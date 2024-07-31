"use strict";
/*
 * Copyright 2024 SpinalCom - www.spinalcom.com
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
const model_derivative_1 = require("@aps_sdk/model-derivative");
const SpinalApsManager_1 = require("./SpinalApsManager");
class SpinalApsTranslateJob {
    constructor(bucketKey, filename) {
        this.bucketKey = bucketKey;
        this.filename = filename;
    }
    // #region translateInForge
    translateInForge() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Starting to Translate the file to svf in forge.');
            const accessToken = yield SpinalApsManager_1.spinalApsManager.getAuthAndCreateBucket(this.bucketKey);
            const objectID = yield this.getObjectIdFile(accessToken);
            const urn = this.urnify(objectID);
            const res = yield SpinalApsManager_1.spinalApsManager.modelDerivativeClient.startJob(accessToken, {
                input: {
                    urn,
                    compressedUrn: false,
                },
                output: {
                    formats: [{
                            type: model_derivative_1.Type.Svf,
                            views: [model_derivative_1.View._3d, model_derivative_1.View._2d],
                        }],
                },
            }, {
                region: model_derivative_1.Region.Emea,
            });
            return res.urn;
        });
    }
    // #endregion
    // #region getObjectIdFile
    getObjectIdFile(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield SpinalApsManager_1.spinalApsManager.ossClient.getObjects(accessToken, this.bucketKey, {
                limit: 20
            });
            for (const obj of res.items) {
                if (obj.objectKey === this.filename) {
                    return obj.objectId;
                }
            }
            throw new Error(`File ${this.filename} not found in bucket ${this.bucketKey}`);
        });
    }
    // #endregion
    // #region urnify
    urnify(id) {
        return Buffer.from(id).toString('base64').replace(/=/g, '');
    }
    ;
}
exports.default = SpinalApsTranslateJob;
//# sourceMappingURL=SpinalApsTranslateJob.js.map