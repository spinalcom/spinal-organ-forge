"use strict";
/*
 * Copyright 2024 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Software license Agreement ("Agreement")
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalApsDownloadDerivative = void 0;
const axios_1 = require("axios");
const path = require("path");
const fse = require("fs-extra");
const autodesk_sdkmanager_1 = require("@aps_sdk/autodesk-sdkmanager");
const model_derivative_1 = require("@aps_sdk/model-derivative");
const authentication_1 = require("@aps_sdk/authentication");
const svf_utils_1 = require("svf-utils");
const p_queue_1 = require("p-queue");
const SpinalApsManager_1 = require("./SpinalApsManager");
// export interface ThumbnailManifestDerivative {
//   guid: string;
//   type: string;
//   role: string;
//   urn: string;
//   resolution: [number, number];
//   mime: string;
//   status: string;
// }
class SpinalApsDownloadDerivative {
    // #region contructor
    constructor(bucketKey) {
        this.bucketKey = bucketKey;
        this.sdkManager = autodesk_sdkmanager_1.SdkManagerBuilder.create().build();
        this.modelDerivativeClient = new model_derivative_1.ModelDerivativeClient(this.sdkManager);
    }
    // #endregion
    // #region run
    run(urn, options) {
        const context = {
            log: (options === null || options === void 0 ? void 0 : options.log) || ((message) => { }),
            outputDir: (options === null || options === void 0 ? void 0 : options.outputDir) || `viewerForgeFiles/${this.bucketKey}`,
            failOnMissingAssets: !!(options === null || options === void 0 ? void 0 : options.failOnMissingAssets),
        };
        return this._download(urn, context);
    }
    ;
    // #endregion
    // #region download
    _download(urn, context) {
        return __awaiter(this, void 0, void 0, function* () {
            context.log(`Downloading derivative ${urn}`);
            const accessToken = yield SpinalApsManager_1.spinalApsManager.getToken([authentication_1.Scopes.ViewablesRead]);
            const manifest = yield this.modelDerivativeClient.getManifest(accessToken, urn);
            this.debug_output_to_file(manifest, 'manifest.json');
            const urnDir = path.join(context.outputDir || '.', 'resources');
            const viewables = [];
            const { aec, 
            // thumbnailDerivatives,
            // f2dDerivatives,
            svfDerivatives } = this._collectDerivatives(manifest);
            this.debug_output_to_file(aec, 'aec.json');
            // this.debug_output_to_file(thumbnailDerivatives, 'thumbnailDerivatives.json');
            // this.debug_output_to_file(f2dDerivatives, 'f2dDerivatives.json');
            this.debug_output_to_file(svfDerivatives, 'svfDerivatives.json');
            const aecPath = yield this._dlAec(aec, context, urn);
            yield this._dlSvfDerivatives(svfDerivatives, context, urnDir, urn, viewables);
            return {
                viewables,
                aecPath,
            };
        });
    }
    // #endregion
    debug_output_to_file(output, fileName) {
        fse.ensureDirSync('debug');
        fse.writeFileSync(path.resolve('debug', fileName), JSON.stringify(output, null, 2));
    }
    // #region collectDerivatives
    _collectDerivatives(manifest) {
        let aec;
        const svfDerivatives = [];
        // const thumbnailDerivatives: SVFManifestDerivative[] = [];
        // const f2dDerivatives: ManifestDerivativesChildren[] = [];
        function collectDerivativesRec(derivative) {
            if (derivative.type === 'resource' && derivative.role === 'graphics') {
                if (derivative.mime === 'application/autodesk-svf')
                    svfDerivatives.push(derivative);
                // else if ((derivative as any).mime === 'application/autodesk-f2d')
                //   f2dDerivatives.push(derivative as any);
            }
            else if (derivative.role === 'Autodesk.AEC.ModelData')
                aec = derivative;
            // else if (derivative.role === 'thumbnail') thumbnailDerivatives.push(derivative as any);
            if (derivative.children) {
                for (const child of derivative.children) {
                    collectDerivativesRec(child);
                }
            }
        }
        for (const derivative of manifest.derivatives) {
            if (derivative.children) {
                for (const child of derivative.children) {
                    collectDerivativesRec(child);
                }
            }
        }
        return {
            aec,
            // thumbnailDerivatives,
            // f2dDerivatives,
            svfDerivatives
        };
    }
    // #endregion
    // #region dlSvfDerivatives
    _dlSvfDerivatives(svfDerivatives, context, urnDir, urn, viewables) {
        return __awaiter(this, void 0, void 0, function* () {
            const queue = new p_queue_1.default({ concurrency: 5 });
            for (let idxDeriv = 0; idxDeriv < svfDerivatives.length; idxDeriv++) {
                const svfDerivative = svfDerivatives[idxDeriv];
                const guid = svfDerivative.guid;
                const derivativeUrn = svfDerivative.urn;
                const fileName = path.basename(derivativeUrn);
                context.log(`Downloading viewable ${guid}`);
                const outputDir = path.join(urnDir, guid);
                fse.ensureDirSync(outputDir);
                const svf = yield this._dlDerivativeFile(urn, encodeURI(derivativeUrn));
                const outputPath = path.join(outputDir, fileName);
                fse.writeFileSync(outputPath, new Uint8Array(svf));
                viewables.push({
                    path: path.resolve('/html', outputDir, fileName),
                    name: fileName,
                });
                const reader = yield svf_utils_1.SvfReader.FromDerivativeService(urn, guid, SpinalApsManager_1.spinalApsManager.auth);
                const manifest = yield reader.getManifest();
                for (let idxAsset = 0; idxAsset < manifest.assets.length; idxAsset++) {
                    queue.add(this._dlDerivativeAssest.bind(this, manifest.assets[idxAsset], context, idxDeriv, svfDerivatives, idxAsset, manifest, reader, outputDir));
                }
            }
            yield queue.onIdle();
        });
    }
    //#endregion
    // #region dlDerivativeAssest
    _dlDerivativeAssest(asset, context, idxDeriv, svfDerivatives, idxAsset, manifest, reader, outputDir) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!asset.URI.startsWith('embed:')) {
                context.log(`viewable ${idxDeriv + 1}/${svfDerivatives.length} - Downloading asset ${idxAsset + 1}/${manifest.assets.length} ${asset.URI}`);
                try {
                    const assetData = yield reader.getAsset(asset.URI);
                    const assetPath = path.join(outputDir, asset.URI);
                    const assetFolder = path.dirname(assetPath);
                    fse.ensureDirSync(assetFolder);
                    fse.writeFileSync(assetPath, assetData);
                }
                catch (err) {
                    if (context.failOnMissingAssets) {
                        throw err;
                    }
                    else {
                        context.log(`Could not download asset ${asset.URI}`);
                    }
                }
            }
            else {
                context.log(`viewable ${idxDeriv + 1}/${svfDerivatives.length} - Downloading asset ${idxAsset + 1}/${manifest.assets.length} ${asset.URI} SKIP`);
            }
        });
    }
    // #endregion
    // #region dlAec
    _dlAec(aec, context, urn) {
        return __awaiter(this, void 0, void 0, function* () {
            if (aec) {
                fse.ensureDirSync(context.outputDir);
                const urnDeriv = aec.urn;
                const aecData = yield this._dlDerivativeFile(urn, encodeURI(urnDeriv), true);
                const outputPath = path.join(context.outputDir, 'AECModelData.json');
                fse.writeFileSync(outputPath, new Uint8Array(aecData));
                return `/html/${outputPath}`;
            }
        });
    }
    // #endregion
    // #region dlDerivativeFile
    _dlDerivativeFile(urn, derivativeUrn, decompress = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const accessToken = yield SpinalApsManager_1.spinalApsManager.getToken([authentication_1.Scopes.ViewablesRead]);
            try {
                const downloadInfo = yield this.modelDerivativeClient.getDerivativeUrl(accessToken, derivativeUrn, urn);
                const response = yield axios_1.default.get(downloadInfo.url, { responseType: 'arraybuffer', decompress });
                return response.data;
            }
            catch (error) {
                console.log('accessToken', accessToken);
                console.log('derivativeUrn', derivativeUrn);
                console.log('urn', urn);
                throw new Error(`Failed to download derivative ${derivativeUrn}: ${error}`);
            }
        });
    }
}
exports.SpinalApsDownloadDerivative = SpinalApsDownloadDerivative;
//# sourceMappingURL=SpinalApsDownloadDerivative.js.map