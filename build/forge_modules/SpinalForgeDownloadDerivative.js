"use strict";
/*
 * Copyright 2020 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
const forgeSDK = require('forge-apis');
const derivativesApi = new forgeSDK.DerivativesApi();
const zlib = require('zlib');
const zip = require('node-zip');
const mkdirp = require('mkdirp');
function spinalForgeDownloadDerivative(BUCKET_KEY, spinalForgeAuth) {
    // tslint:disable-next-line:variable-name no-this-assignment
    const _self = this;
    this._outPath = './';
    this._viewables = []; // { path: '', name: '' }
    this._errors = []; // ''
    this._thumbnail = [];
    function getManifest(oAuth, urn) {
        console.log('**** getManifest');
        if (urn === undefined || urn === null) {
            return Promise.reject("Missing the required parameter 'urn' when calling getManifest");
        }
        const modelDerivative = new forgeSDK.DerivativesApi();
        return modelDerivative.apiClient.callApi('/derivativeservice/v2/manifest/{urn}', 'GET', {
            urn,
        }, {}, {
        /*'Accept-Encoding': 'gzip, deflate'*/
        }, {}, null, [], ['application/vnd.api+json', 'application/json'], null, oAuth, oAuth.getCredentials());
    }
    function downloadBubble(bubble, outPath, modelUrn) {
        _self._viewables = []; // { path: '', name: '' }
        _self._errors = []; // ''
        _self._outPath = outPath;
        return new Promise((fulfill) => {
            console.log('download_manifest');
            // console.log(bubble);
            listAllDerivativeFiles(bubble, modelUrn, (error, result) => {
                // _self._progress._filesToFetch =result.list.length ;
                console.log('Number of files to fetch:', result.list.length);
                // _self._progress._estimatedSize =0 | (result.totalSize / (1024 * 1024)) ;
                console.log('Estimated download size:', 0 | (result.totalSize / (1024 * 1024)), 'MB');
                console.log('\n\nDownloading derivative files\n\n');
                console.log(result);
                downloadAllDerivativeFiles(result.list, _self._outPath, modelUrn, (failed, succeeded) => {
                    _self.failed = failed;
                    _self.succeeded = succeeded;
                    console.log('\n\nDownloading derivative files END\n\n');
                    fulfill(_self);
                });
            });
        });
    }
    function listAllDerivativeFiles(bubble, modelUrn, callback) {
        const res = [];
        traverse_node(bubble, null, res, bubble);
        console.log('Manifests to process: ', res.length);
        if (res.length === 0) {
            return callback(null, {
                list: [],
                totalSize: 0,
            });
        }
        toZip(res, modelUrn, callback);
    }
    function downloadAllDerivativeFiles(fileList, destDir, modelUrn, callback) {
        let succeeded = 0;
        let failed = 0;
        const flatList = [];
        for (let i = 0; i < fileList.length; i += 1) {
            const item = fileList[i];
            for (let j = 0; j < item.files.length; j += 1) {
                const flatItem = {
                    basePath: item.basePath,
                    localPath: destDir + item.localPath.replace(/\s/g, '_'),
                    fileName: item.files[j],
                };
                if (item.name)
                    flatItem.name = item.name;
                if (item.urn) {
                    flatItem.urn = item.urn;
                    flatItem.guid = item.guid;
                    flatItem.mime = item.mime;
                }
                flatList.push(flatItem);
            }
        }
        console.log('++++++++++++++++++++++++++++++++++');
        console.log(flatList);
        console.log(destDir);
        console.log('++++++++++++++++++++++++++++++++++');
        if (flatList.length === 0)
            return callback(failed, succeeded);
        let current = 0;
        let done = 0;
        const downloadOneItem = function () {
            if (current >= flatList.length)
                return;
            const fi = flatList[current];
            current += 1;
            console.log(`start to download ${fi.localPath}${fi.fileName}`);
            const downloadComplete = function (error) {
                done += 1;
                if (error) {
                    failed += 1;
                    console.error('Failed to download file:', fi.localPath + fi.fileName, error);
                    _self._errors.push(`Failed to download file: ${fi.localPath}${fi.fileName}`);
                }
                else {
                    succeeded += 1;
                    console.log('Downloaded:', fi.localPath + fi.fileName);
                }
                console.log('Progress:', ((100 * (failed + succeeded)) / flatList.length) | 0, '%');
                if (done === flatList.length)
                    callback(failed, succeeded);
                else
                    setTimeout(downloadOneItem, 0);
            };
            if (fi.mime && fi.mime === 'thumbnail') {
                getThumbnail(fi.urn, fi.guid, 400, fi.localPath + fi.fileName, downloadComplete);
                _self._thumbnail.push({
                    path: `/html/${path.normalize(fi.localPath + fi.fileName)}`,
                    localPath: fi.localPath,
                });
            }
            else {
                getItem(fi.basePath + fi.fileName, fi.localPath + fi.fileName, modelUrn, downloadComplete);
            }
            if ((fi.mime === 'application/autodesk-svf' ||
                fi.mime === 'application/autodesk-f2d') &&
                (path.extname(fi.fileName).toLowerCase() === '.svf' ||
                    path.extname(fi.fileName).toLowerCase() === '.f2d')) {
                _self._viewables.push({
                    localPath: fi.localPath,
                    path: `/html/${path.normalize(fi.localPath + fi.fileName)}`,
                    name: fi.name,
                });
            }
        };
        // Kick off 10 parallel jobs
        for (let k = 0; k < 10; k += 1)
            downloadOneItem();
    }
    function getThumbnail(urn, guid, sz, outFile, callback) {
        // tslint:disable-next-line:no-this-assignment variable-name
        // const _self = this;
        const modelDerivative = new forgeSDK.DerivativesApi();
        if (urn === undefined || urn === null) {
            return Promise.reject("Missing the required parameter 'urn' when calling getThumbnail");
        }
        const queryParams = {
            width: sz,
            height: sz,
            role: 'rendered',
        };
        if (guid)
            queryParams.guid = guid;
        modelDerivative.apiClient
            .callApi('/derivativeservice/v2/thumbnails/{urn}', 'GET', {
            urn,
        }, queryParams, {}, {}, null, [], ['application/octet-stream'], null, _self.oAuth, _self.oAuth.getCredentials())
            .then((thumbnail) => {
            const wstream = openWriteStream(outFile);
            if (wstream) {
                wstream.write(thumbnail.body);
                wstream.end();
                callback(null, thumbnail.statusCode);
            }
            else {
                callback(null, thumbnail.body);
            }
        })
            .catch((error) => {
            console.error('Error:', error.message);
            _self._errors.push(`Error: ${error.message}`);
            callback(error, null);
        });
    }
    function toZip(res, modelUrn, callback) {
        let current = 0;
        let done = 0;
        let estSize = 0;
        const countedPropDb = {};
        const processOne = function () {
            function onProgress() {
                done += 1;
                console.log('Manifests done ', done);
                if (done === res.length) {
                    const result = {
                        list: res,
                        totalSize: estSize,
                    };
                    callback(null, result);
                }
                else {
                    setTimeout(processOne, 0);
                }
            }
            if (current >= res.length)
                return;
            const rootItem = res[current];
            current += 1;
            let basePath;
            const files = (rootItem.files = []);
            if (rootItem.mime !== 'thumbnail')
                basePath = rootItem.basePath;
            if (rootItem.mime === 'application/autodesk-db') {
                // The file list for property database files is fixed,
                // no need to go to the server to find out
                files.push('objects_attrs.json.gz');
                files.push('objects_vals.json.gz');
                files.push('objects_avs.json.gz');
                files.push('objects_offs.json.gz');
                files.push('objects_ids.json.gz');
                // f2d will reference us, but not the svf :( - add ourself here
                files.push(rootItem.rootFileName);
                onProgress();
            }
            else if (rootItem.mime === 'thumbnail') {
                rootItem.files.push(rootItem.rootFileName);
                onProgress();
            }
            else if (rootItem.mime === 'application/autodesk-svf') {
                const svfPath = rootItem.urn.slice(basePath.length);
                files.push(svfPath);
                // Closure to capture loop-variant variable for the getItem callback
                (function () {
                    const myItem = rootItem;
                    getItem(rootItem.urn, null, modelUrn, (error, vSuccess) => {
                        let success = vSuccess;
                        if (error)
                            _self._errors.push(`Failed to download ${myItem.urn}`);
                        if (success) {
                            let manifest;
                            try {
                                const pack = new zip(success, {
                                    base64: false,
                                    checkCRC32: true,
                                });
                                success = pack.files['manifest.json'].asNodeBuffer();
                                manifest = JSON.parse(success.toString('utf8'));
                            }
                            catch (e) {
                                console.error('Error:', e.message);
                                _self._errors.push(e.message);
                            }
                            if (manifest && manifest.assets) {
                                for (let j = 0; j < manifest.assets.length; j += 1) {
                                    const asset = manifest.assets[j];
                                    // Skip SVF embedded resources
                                    if (asset.URI.indexOf('embed:/') === 0)
                                        continue;
                                    // Skip non-local property db files
                                    // Those are listed explicitly in the bubble as property database role
                                    // so we will get them anyway
                                    if (asset.URI.indexOf('../') === 0) {
                                        // To get a correct bubble size estimate,
                                        // we get the property db file sizes from the SVF manifest,
                                        // because they are not available in the bubble itself.
                                        // It's ugly, but such is bubble life.
                                        // Also, this number seems to be the uncompressed size of the property db files,
                                        // so it's an overestimate, and we divide by 4 to get a more reasonable one.
                                        if (!countedPropDb[rootItem.basePath]) {
                                            estSize += asset.size / 4;
                                        }
                                        continue;
                                    }
                                    estSize += asset.size;
                                    myItem.files.push(asset.URI);
                                }
                            }
                            countedPropDb[rootItem.basePath] = 1;
                        }
                        onProgress();
                    });
                })();
            }
            else if (rootItem.mime === 'application/autodesk-f2d') {
                files.push('manifest.json.gz');
                const manifestPath = `${basePath}manifest.json.gz`;
                // Closure to capture loop-variant variable for the getItem callback
                (function () {
                    const myItem = rootItem;
                    getItem(manifestPath, null, modelUrn, (error, vSuccess) => {
                        let success = vSuccess;
                        if (error)
                            _self._errors.push('Failed to download ${myItem.urn}');
                        if (success) {
                            estSize += success.length;
                            let manifest;
                            try {
                                if (success[0] === 0x1f && success[1] === 0x8b) {
                                    success = zlib.gunzipSync(success);
                                }
                                manifest = JSON.parse(success.toString('utf8'));
                            }
                            catch (e) {
                                console.error('Error:', e.message);
                                _self._errors.push(e.message);
                            }
                            if (manifest && manifest.assets) {
                                for (let j = 0; j < manifest.assets.length; j += 1) {
                                    const asset = manifest.assets[j];
                                    // Skip non-local property db files
                                    // Those are listed explicitly in the bubble as property database role
                                    // so we will get them anyway
                                    if (asset.URI.indexOf('../') === 0)
                                        continue;
                                    estSize += asset.size;
                                    myItem.files.push(asset.URI);
                                }
                            }
                        }
                        onProgress();
                    });
                })();
            }
            else {
                // All other files are assumed to be just the file listed in the bubble
                files.push(rootItem.rootFileName);
                onProgress();
            }
        };
        // Kick off 6 parallel jobs
        for (let k = 0; k < 6; k += 1)
            processOne();
    }
    function traverse_node(node, parent, res, bubble) {
        console.log(node.role);
        if (node.role === 'Autodesk.CloudPlatform.PropertyDatabase' ||
            node.role === 'Autodesk.CloudPlatform.DesignDescription' ||
            node.role === 'Autodesk.CloudPlatform.IndexableContent' ||
            node.role === 'graphics' ||
            node.role === 'raas' ||
            node.role === 'pdf' ||
            node.role === 'leaflet-zip' ||
            node.role === 'preview' ||
            node.role === 'lod') {
            const item = {
                mime: node.mime,
            };
            extractPathsFromGraphicsUrn(node.urn, item);
            node.urn = `$file$/${item.localPath + item.rootFileName}`;
            res.push(item);
            if (node.mime === 'application/autodesk-svf' ||
                node.mime === 'application/autodesk-f2d') {
                item.name = node.name = parent.name;
                if (parent.hasThumbnail === 'true') {
                    const thumbnailItem = {
                        mime: 'thumbnail',
                        urn: bubble.urn,
                        guid: parent.guid,
                        localPath: item.localPath,
                        thumbnailUrn: `$file$/thumbnails/${parent.guid}.png`,
                        rootFileName: `${item.rootFileName}.png`,
                    };
                    res.push(thumbnailItem);
                }
            }
        }
        if (node.type === 'geometry') {
            if (node.intermediateFile && node.children) {
                let f2dNode;
                for (let i = 0; i < node.children.length; i += 1) {
                    if (node.children[i].mime === 'application/autodesk-f2d') {
                        f2dNode = node.children[i];
                        break;
                    }
                }
                if (f2dNode) {
                    const f2dUrl = f2dNode.urn;
                    const idx = f2dUrl.indexOf(bubble.urn);
                    const baseUrl = f2dUrl.substr(0, idx + bubble.urn.length);
                    const mItem = {
                        mime: 'application/octet-stream',
                        urn: bubble.urn,
                        guid: node.guid,
                    };
                    // Construct the full urn path, similar to how it's stored for the SVF geometry items
                    let intPath = `/${node.intermediateFile}`;
                    if (baseUrl.indexOf('urn:adsk.objects') === 0) {
                        intPath = encodeURIComponent(intPath);
                    }
                    const fullPath = baseUrl + intPath;
                    extractPathsFromGraphicsUrn(fullPath, mItem);
                    res.push(mItem);
                }
            }
        }
        if (node.children) {
            node.children.forEach((child) => {
                traverse_node(child, node, res, bubble);
            });
        }
        if (node.derivatives) {
            node.derivatives.forEach((child) => {
                traverse_node(child, node, res, bubble);
            });
        }
    }
    function extractPathsFromGraphicsUrn(origUrn, result) {
        // This needs to be done for encoded OSS URNs, because the paths
        // in there are url encoded and lose the / character.
        const urn = decodeURIComponent(origUrn);
        const basePath = urn.slice(0, urn.lastIndexOf('/') + 1);
        let localPath = basePath.slice(basePath.indexOf('/') + 1);
        localPath = localPath.replace(/^output\//, '');
        // For supporting compound bubbles, we need to prefix
        // by sub-urn as well, otherwise files might clash.
        // var localPrefix = urnBase ? crypto.createHash('md5')
        // .update(urnBase).digest("hex") + "/" : "";
        const localPrefix = '';
        result.urn = urn;
        result.basePath = basePath;
        result.localPath = localPrefix + localPath;
        result.rootFileName = urn.slice(urn.lastIndexOf('/') + 1);
    }
    function getItem(itemUrn, outFile, modelUrn, callback) {
        // console.log ('-> ' + itemUrn) ;
        downloadItem(itemUrn, modelUrn)
            .then((response) => {
            if (response.statusCode !== 200)
                return callback(response.statusCode);
            // Skip unzipping of items to make the downloaded content compatible with viewer debugging
            const wstream = openWriteStream(outFile);
            if (wstream) {
                wstream.write(typeof response.body === 'object' &&
                    path.extname(outFile) === '.json'
                    ? JSON.stringify(response.body)
                    : response.body);
                wstream.end();
                callback(null, response.statusCode);
            }
            else {
                callback(null, response.body);
            }
        })
            .catch((error) => {
            console.error(error);
            _self._errors.push(`Error: ${error.message}`);
            callback(error, null);
        });
        // .pipe (wstream)
    }
    function downloadItem(urn, modelUrn) {
        // Verify the required parameter 'urn' is set
        if (urn === undefined || urn === null) {
            return Promise.reject("Missing the required parameter 'urn' when calling downloadItem");
        }
        return new Promise((resolve, reject) => {
            derivativesApi
                .getDerivativeManifest(modelUrn, urn, null, _self.oAuth, _self.oAuth.getCredentials())
                .then(resolve, reject);
        });
    }
    function openWriteStream(outFile) {
        let wstream;
        if (outFile) {
            try {
                mkdirp.sync(path.dirname(outFile));
                wstream = fs.createWriteStream(outFile);
            }
            catch (e) {
                console.error('Error:', e.message);
            }
        }
        return wstream;
    }
    function run(urn) {
        console.log('Starting to Download the file svf in forge and upload it to the SpinalCore.');
        return spinalForgeAuth
            .auth_and_getBucket()
            .then((oAuth) => {
            // console.log(model.get());
            // let urn = model.urn.get();
            _self.oAuth = oAuth;
            return getManifest(oAuth, urn);
        })
            .then((bubbleRqst) => {
            return downloadBubble(bubbleRqst.body, `./viewerForgeFiles/${BUCKET_KEY}/`, urn);
        })
            .then((bubule) => {
            console.log('\n\n\ndownload Bubble done\n\n\n');
            for (const thumbnail of bubule._thumbnail) {
                for (const viewable of bubule._viewables) {
                    if (thumbnail.localPath === viewable.localPath) {
                        viewable.thumbnail = thumbnail.path;
                        break;
                    }
                }
            }
            console.log('bubule._viewables', bubule._viewables);
            // model._children.clear();
            // for (var i = 0; i < bubule._viewables.length; i++) {
            //   model.add_child(new ForgeFileDerivativesItem(bubule._viewables[i]));
            // }
            // model.state.set("Export completed");
            return bubule._viewables;
            // return (bubule._viewables)
        });
        // .catch(function (err) {
        //   console.error(err);
        // });
    }
    this.downloadDerivative = function (urn) {
        return run(urn);
    };
}
exports.default = spinalForgeDownloadDerivative;
//# sourceMappingURL=SpinalForgeDownloadDerivative.js.map