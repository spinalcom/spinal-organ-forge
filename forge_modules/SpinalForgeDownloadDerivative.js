/**
 * Copyright 2015 SpinalCom - www.spinalcom.com
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

var fs = require('fs');
var path = require('path');

var ForgeSDK = require('forge-apis');
var objectsApi = new ForgeSDK.ObjectsApi();
var derivativesApi = new ForgeSDK.DerivativesApi();
var base64url = require('base64-url');
var zlib = require('zlib');
var zip = require('node-zip');
var mkdirp = require('mkdirp');
var ForgeFileDerivativesItem = require('spinal-lib-forgefile').ForgeFileDerivativesItem;

function SpinalForgeDownloadDerivative(model, BUCKET_KEY, file_name, spinalForgeAuth) {
  var _self = this;
  this._outPath = './';
  this._viewables = []; // { path: '', name: '' }
  this._errors = []; // ''

  this.defaultHandleError = function (err) {
    model.state.set("Failed");
    console.error('\x1b[31m Error:', err, '\x1b[0m');
  };

  this.getManifest = function (oAuth, urn) {
    console.log("**** getManifest");

    if (urn === undefined || urn === null)
      return (Promise.reject("Missing the required parameter 'urn' when calling getManifest"));
    var ModelDerivative = new ForgeSDK.DerivativesApi();
    return (ModelDerivative.apiClient.callApi(
      '/derivativeservice/v2/manifest/{urn}', 'GET', {
        'urn': urn
      }, {}, { /*'Accept-Encoding': 'gzip, deflate'*/ }, {}, null, [], ['application/vnd.api+json', 'application/json'], null,
      oAuth, oAuth.getCredentials()
    ));
  };


  this.downloadBubble = function (bubble, outPath) {
    _self._viewables = []; // { path: '', name: '' }
    _self._errors = []; // ''
    _self._outPath = outPath;
    return (new Promise(function (fulfill, reject) {
      console.log("download_manifest");
      // console.log(bubble);
      _self.listAllDerivativeFiles(bubble, function (error, result) {
        // _self._progress._filesToFetch =result.list.length ;
        console.log('Number of files to fetch:', result.list.length);
        // _self._progress._estimatedSize =0 | (result.totalSize / (1024 * 1024)) ;
        console.log('Estimated download size:', 0 | (result.totalSize / (1024 * 1024)), 'MB');
        console.log("\n\nDownloading derivative files\n\n");
        console.log(result);
        _self.downloadAllDerivativeFiles(result.list, _self._outPath, function (failed, succeeded) {
          _self.failed = failed;
          _self.succeeded = succeeded;
          console.log("\n\nDownloading derivative files END\n\n");
          fulfill(_self);
        });

      });
    }));
  };
  _self.listAllDerivativeFiles = function (bubble, callback) {
    var res = [];
    _self.traverse_node(bubble, null, res, bubble);
    console.log('Manifests to process: ', res.length);
    if (res.length === 0)
      return (callback(null, {
        list: [],
        totalSize: 0
      }));
    _self.toZip(res, callback);
  };

  this.run = function () {
    spinalForgeAuth.auth_and_getBucket()
      .then(function (oAuth) {
        console.log(model.get());
        urn = model.urn.get();
        _self.oAuth = oAuth;
        return _self.getManifest(oAuth, urn);
      }, _self.defaultHandleError)
      .then(function (bubble_rqst) {
        return _self.downloadBubble(bubble_rqst.body, './viewerForgeFiles/' + BUCKET_KEY + '/');
      }, _self.defaultHandleError)
      .then(function (bubule) {
        console.log('\n\n\ndownloadBubble done\n\n\n');
        console.log(bubule._viewables);
        model._children.clear();
        for (var i = 0; i < bubule._viewables.length; i++) {
          model.add_child(new ForgeFileDerivativesItem(bubule._viewables[i]));
        }
        model.state.set("Export completed");
        // return (bubule._viewables)
      }, _self.defaultHandleError)
      .catch(function (err) {
        console.error(err);
      });
  };

  this.downloadAllDerivativeFiles = function (fileList, destDir, callback) {
    var succeeded = 0;
    var failed = 0;
    var flatList = [];
    for (var i = 0; i < fileList.length; i++) {
      var item = fileList[i];
      for (var j = 0; j < item.files.length; j++) {
        var flatItem = {
          basePath: item.basePath,
          localPath: destDir + item.localPath.replace(/\s/g, "_"),
          fileName: item.files[j]
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
    console.log("++++++++++++++++++++++++++++++++++");
    console.log("++++++++++++++++++++++++++++++++++");
    console.log("++++++++++++++++++++++++++++++++++");
    console.log(flatList);
    console.log(destDir);
    console.log("++++++++++++++++++++++++++++++++++");
    console.log("++++++++++++++++++++++++++++++++++");
    console.log("++++++++++++++++++++++++++++++++++");
    if (flatList.length === 0)
      return (callback(failed, succeeded));
    var current = 0;
    var done = 0;
    var downloadOneItem = function () {
      if (current >= flatList.length)
        return;
      var fi = flatList[current++];
      console.log('start to download ' + fi.localPath + fi.fileName);
      var downloadComplete = function (error, success) {
        done++;
        if (error) {
          failed++;
          console.error('Failed to download file:', fi.localPath + fi.fileName, error);
          _self._errors.push('Failed to download file: ' + fi.localPath + fi.fileName);
        } else {
          succeeded++;
          console.log('Downloaded:', fi.localPath + fi.fileName);
        }
        console.log('Progress:', (100 * (failed + succeeded) / flatList.length) | 0, '%');
        if (done === flatList.length)
          callback(failed, succeeded);
        else
          setTimeout(downloadOneItem, 0);
      };
      if (fi.mime && fi.mime === 'thumbnail')
        _self.getThumbnail(fi.urn, fi.guid, 400, fi.localPath + fi.fileName, downloadComplete);
      else
        _self.getItem(fi.basePath + fi.fileName, fi.localPath + fi.fileName, downloadComplete);
      if ((fi.mime == 'application/autodesk-svf' ||
          fi.mime == 'application/autodesk-f2d') &&
        (path.extname(fi.fileName).toLowerCase() == '.svf' ||
          path.extname(fi.fileName).toLowerCase() == '.f2d')
      ) {
        // console.log("\n\nTEST\n\n");
        // console.log(fi.localPath);
        // console.log(fi.fileName);
        // console.log(path.resolve(__dirname, fi.localPath + fi.fileName));
        // console.log("\n\nTEST END\n\n");
        // console.log('http://localhost:8889/html/' + path.normalize(fi.localPath + fi.fileName));
        let hostname = 'http://' + process.env.SPINALHUB_IP;
        if (process.env.SPINALHUB_PORT)
          hostname += ":" + process.env.SPINALHUB_PORT;
        _self._viewables.push({
          path: hostname + '/html/' + path.normalize(fi.localPath + fi.fileName),
          name: fi.name
        });
      }
    };
    // Kick off 10 parallel jobs
    for (var k = 0; k < 10; k++)
      downloadOneItem();
  };

  this.getThumbnail = function (urn, guid, sz, outFile, callback) {
    var _self = this;
    var ModelDerivative = new ForgeSDK.DerivativesApi();
    if (urn === undefined || urn === null)
      return (Promise.reject("Missing the required parameter 'urn' when calling getThumbnail"));
    var queryParams = {
      width: sz,
      height: sz,
      role: 'rendered'
    };
    if (guid)
      queryParams.guid = guid;
    ModelDerivative.apiClient.callApi(
        '/derivativeservice/v2/thumbnails/{urn}', 'GET', {
          'urn': urn
        }, queryParams, {}, {}, null, [], ['application/octet-stream'], null,
        _self.oAuth, _self.oAuth.getCredentials()
      )
      .then(function (thumbnail) {
        var wstream = _self.openWriteStream(outFile);
        if (wstream) {
          wstream.write(thumbnail.body);
          wstream.end();
          callback(null, thumbnail.statusCode);
        } else {
          callback(null, thumbnail.body);
        }
      })
      .catch(function (error) {
        console.error('Error:', error.message);
        _self._errors.push('Error: ' + error.message);
        callback(error, null);
      });
  };

  this.toZip = function (res, callback) {
    var current = 0;
    var done = 0;
    var estSize = 0;
    var countedPropDb = {};

    var processOne = function () {
      function onProgress() {
        done++;
        console.log('Manifests done ', done);
        if (done === res.length) {
          var result = {
            list: res,
            totalSize: estSize
          };
          callback(null, result);
        } else {
          setTimeout(processOne, 0);
        }
      }

      if (current >= res.length)
        return;
      var rootItem = res[current++];
      var basePath;
      var files = rootItem.files = [];
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
      } else if (rootItem.mime === 'thumbnail') {
        rootItem.files.push(rootItem.rootFileName);
        onProgress();
      } else if (rootItem.mime === 'application/autodesk-svf') {
        var svfPath = rootItem.urn.slice(basePath.length);
        files.push(svfPath);
        // Closure to capture loop-variant variable for the getItem callback
        (function () {
          var myItem = rootItem;
          _self.getItem(rootItem.urn, null, function (error, success) {
            if (error)
              _self._errors.push('Failed to download ' + myItem.urn);
            if (success) {
              var manifest;
              try {
                var pack = new zip(success, {
                  base64: false,
                  checkCRC32: true
                });
                success = pack.files['manifest.json'].asNodeBuffer();
                manifest = JSON.parse(success.toString('utf8'));
              } catch (e) {
                console.error('Error:', e.message);
                _self._errors.push(e.message);
              }
              if (manifest && manifest.assets) {
                for (var j = 0; j < manifest.assets.length; j++) {
                  var asset = manifest.assets[j];
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
                    if (!countedPropDb[rootItem.basePath])
                      estSize += asset.size / 4;
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
      } else if (rootItem.mime === 'application/autodesk-f2d') {
        files.push('manifest.json.gz');
        var manifestPath = basePath + 'manifest.json.gz';
        // Closure to capture loop-variant variable for the getItem callback
        (function () {
          var myItem = rootItem;
          _self.getItem(manifestPath, null, function (error, success) {
            if (error)
              _self._errors.push('Failed to download ' + myItem.urn);
            if (success) {
              estSize += success.length;
              var manifest;
              try {
                if (success[0] === 0x1f && success[1] === 0x8b)
                  success = zlib.gunzipSync(success);
                manifest = JSON.parse(success.toString('utf8'));
              } catch (e) {
                console.error('Error:', e.message);
                _self._errors.push(e.message);
              }
              if (manifest && manifest.assets) {
                for (var j = 0; j < manifest.assets.length; j++) {
                  var asset = manifest.assets[j];
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
      } else {
        // All other files are assumed to be just the file listed in the bubble
        files.push(rootItem.rootFileName);
        onProgress();
      }
    };
    // Kick off 6 parallel jobs
    for (var k = 0; k < 6; k++)
      processOne();
  };

  this.traverse_node = function (node, parent, res, bubble) {
    console.log(node.role);
    if (node.role === 'Autodesk.CloudPlatform.PropertyDatabase' ||
      node.role === 'Autodesk.CloudPlatform.DesignDescription' ||
      node.role === 'Autodesk.CloudPlatform.IndexableContent' ||
      node.role === 'graphics' ||
      node.role === 'raas' ||
      node.role === 'pdf' ||
      node.role === 'leaflet-zip' ||
      node.role === 'preview' ||
      node.role === 'lod'
    ) {
      var item = {
        mime: node.mime
      };
      _self.extractPathsFromGraphicsUrn(node.urn, item);
      node.urn = '$file$/' + item.localPath + item.rootFileName;
      res.push(item);
      if (node.mime == 'application/autodesk-svf' ||
        node.mime == 'application/autodesk-f2d'
      ) {
        item.name = node.name = parent.name;
        if (parent.hasThumbnail === 'true') {
          var thumbnailItem = {
            mime: 'thumbnail',
            urn: bubble.urn,
            guid: parent.guid,
            localPath: item.localPath,
            thumbnailUrn: '$file$/thumbnails/' + parent.guid + '.png',
            rootFileName: (item.rootFileName + '.png')
          };
          res.push(thumbnailItem);
        }
      }
    }
    if (node.type === 'geometry') {
      if (node.intermediateFile && node.children) {
        var f2dNode;
        for (var i = 0; i < node.children.length; i++) {
          if (node.children[i].mime === 'application/autodesk-f2d') {
            f2dNode = node.children[i];
            break;
          }
        }
        if (f2dNode) {
          var f2dUrl = f2dNode.urn;
          var idx = f2dUrl.indexOf(bubble.urn);
          var baseUrl = f2dUrl.substr(0, idx + bubble.urn.length);
          var _item = {
            mime: 'application/octet-stream',
            urn: bubble.urn,
            guid: node.guid
          };
          // Construct the full urn path, similar to how it's stored for the SVF geometry items
          var intPath = '/' + node.intermediateFile;
          if (baseUrl.indexOf('urn:adsk.objects') === 0)
            intPath = encodeURIComponent(intPath);
          var fullPath = baseUrl + intPath;
          _self.extractPathsFromGraphicsUrn(fullPath, _item);
          res.push(_item);
        }
      }
    }
    if (node.children) {
      node.children.forEach(function (child) {
        _self.traverse_node(child, node, res, bubble);
      });
    }
    if (node.derivatives) {
      node.derivatives.forEach(function (child) {
        _self.traverse_node(child, node, res, bubble);
      });
    }

  };

  this.extractPathsFromGraphicsUrn = function (urn, result) {
    // This needs to be done for encoded OSS URNs, because the paths
    // in there are url encoded and lose the / character.
    urn = decodeURIComponent(urn);
    var basePath = urn.slice(0, urn.lastIndexOf('/') + 1);
    var localPath = basePath.slice(basePath.indexOf('/') + 1);
    var urnBase = basePath.slice(0, basePath.indexOf('/'));
    localPath = localPath.replace(/^output\//, '');
    // For supporting compound bubbles, we need to prefix
    // by sub-urn as well, otherwise files might clash.
    // var localPrefix = urnBase ? crypto.createHash('md5').update(urnBase).digest("hex") + "/" : "";
    var localPrefix = '';
    result.urn = urn;
    result.basePath = basePath;
    result.localPath = localPrefix + localPath;
    result.rootFileName = urn.slice(urn.lastIndexOf('/') + 1);
  };

  this.getItem = function (itemUrn, outFile, callback) {
    //console.log ('-> ' + itemUrn) ;
    _self.downloadItem(itemUrn)
      .then(function (response) {
        if (response.statusCode !== 200)
          return (callback(response.statusCode));
        // Skip unzipping of items to make the downloaded content compatible with viewer debugging
        var wstream = _self.openWriteStream(outFile);
        if (wstream) {
          wstream.write(typeof response.body == 'object' && path.extname(outFile) === '.json' ? JSON.stringify(response.body) : response.body);
          wstream.end();
          callback(null, response.statusCode);
        } else {
          callback(null, response.body);
        }
      })
      .catch(function (error) {
        console.error(error);
        _self._errors.push('Error: ' + error.message);
        callback(error, null);
      });
    //.pipe (wstream)
  };

  this.downloadItem = function (urn) {
    // Verify the required parameter 'urn' is set
    if (urn === undefined || urn === null)
      return (Promise.reject("Missing the required parameter 'urn' when calling downloadItem"));
    return new Promise(function (resolve, reject) {
      derivativesApi.getDerivativeManifest(model.urn.get(), urn, null, _self.oAuth, _self.oAuth.getCredentials())
        .then(function (res) {
          resolve(res);
        }, function (err) {
          reject(err);
        });
    });
  };
  this.openWriteStream = function (outFile) {
    var wstream;
    if (outFile) {
      try {
        mkdirp.sync(path.dirname(outFile));
        wstream = fs.createWriteStream(outFile);
      } catch (e) {
        console.error('Error:', e.message);
      }
    }
    return (wstream);
  };

  this.get_forge_models = function () {
    console.log("Starting to Download the file svf in forge and upload it to the SpinalCore.");
    _self.run();
  };


}


module.exports = SpinalForgeDownloadDerivative;