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
const path = require("path");
const SpinalApsManager_1 = require("./SpinalApsManager");
const OUT_DIR = path.resolve(__dirname, '..', '..', 'tmp');
class SpinalApsUpload {
    // #region constructor
    constructor(bucketKey, filename) {
        this.bucketKey = bucketKey;
        this.filename = filename;
    }
    // #endregion
    // #region uploadToAps
    uploadToAps() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Starting to uplaod the file [%s] to aps.', this.filename);
            const accessToken = yield SpinalApsManager_1.spinalApsManager.getAuthAndCreateBucket(this.bucketKey);
            const filepath = path.resolve(OUT_DIR, this.filename);
            yield SpinalApsManager_1.spinalApsManager.ossClient.upload(this.bucketKey, this.filename, filepath, accessToken, null, null, null, {
                onProgress(percentCompleted) {
                    console.log('Upload file [%s] progress: %d', this.filename, percentCompleted);
                },
            });
            console.log('Uplaod file [%s] to aps done.', this.filename);
        });
    }
}
exports.default = SpinalApsUpload;
//# sourceMappingURL=SpinalApsUpload.js.map