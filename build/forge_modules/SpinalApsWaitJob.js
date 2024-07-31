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
const authentication_1 = require("@aps_sdk/authentication");
const SpinalApsManager_1 = require("./SpinalApsManager");
const model_derivative_1 = require("@aps_sdk/model-derivative");
class SpinalApsWaitJob {
    constructor() { }
    // #region waitTranslate
    waitTranslate(urn) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Waiting to Translate the file to svf in forge.');
            while (true) {
                yield this.waitTime(10000);
                const access_token = yield SpinalApsManager_1.spinalApsManager.getToken([
                    authentication_1.Scopes.DataRead, authentication_1.Scopes.BucketRead,
                ]);
                const manifest = yield SpinalApsManager_1.spinalApsManager.modelDerivativeClient.getManifest(access_token, urn, {
                    region: model_derivative_1.Region.Emea
                });
                if (manifest.status === 'success' && manifest.progress === 'complete') {
                    console.log('Translating completed !');
                    break;
                }
                if (manifest.status === 'failed') {
                    console.error('Error from autodesk forge!');
                    for (const derivative of manifest.derivatives) {
                        console.error(derivative.messages);
                    }
                    break;
                }
            }
            console.log('Translating completed !');
        });
    }
    // #endregion
    // #region waitTime
    waitTime(time) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    }
}
exports.default = SpinalApsWaitJob;
//# sourceMappingURL=SpinalApsWaitJob.js.map