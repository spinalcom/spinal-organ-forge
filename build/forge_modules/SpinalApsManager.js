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
exports.spinalApsManager = exports.SpinalApsManager = void 0;
const svf_utils_1 = require("svf-utils");
const oss_1 = require("@aps_sdk/oss");
const autodesk_sdkmanager_1 = require("@aps_sdk/autodesk-sdkmanager");
const authentication_1 = require("@aps_sdk/authentication");
const model_derivative_1 = require("@aps_sdk/model-derivative");
const config_1 = require("../config");
class SpinalApsManager {
    // #region singleton
    constructor() {
        this.auth = new svf_utils_1.TwoLeggedAuthenticationProvider(config_1.CLIENT_ID, config_1.CLIENT_SECRET);
        const sdk = autodesk_sdkmanager_1.SdkManagerBuilder.create().build();
        // this.authenticationClient = new AuthenticationClient(sdk);
        this.ossClient = new oss_1.OssClient(sdk);
        this.modelDerivativeClient = new model_derivative_1.ModelDerivativeClient(sdk);
    }
    static getInstance() {
        return new SpinalApsManager();
    }
    // #endregion
    // #region getToken
    getToken(scopes) {
        return this.auth.getToken(scopes);
    }
    // #endregion
    // #region getAuthAndCreateBucket
    getAuthAndCreateBucket(bucketKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = yield this.getToken([
                authentication_1.Scopes.CodeAll,
                authentication_1.Scopes.DataCreate, authentication_1.Scopes.DataWrite, authentication_1.Scopes.DataRead,
                authentication_1.Scopes.BucketCreate, authentication_1.Scopes.BucketRead,
            ]);
            this.ensureBucketExists(bucketKey, token);
            return token;
        });
    }
    // #endregion
    // #region ensureBucketExists
    ensureBucketExists(bucketKey, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.ossClient.getBucketDetails(token, bucketKey);
            }
            catch (err) {
                if (err.axiosError.response.status === 404) {
                    yield this.ossClient.createBucket(token, oss_1.CreateBucketXAdsRegionEnum.Emea, {
                        bucketKey: bucketKey,
                        policyKey: oss_1.CreateBucketsPayloadPolicyKeyEnum.Transient
                    });
                }
                else {
                    throw err;
                }
            }
        });
    }
}
exports.SpinalApsManager = SpinalApsManager;
exports.spinalApsManager = SpinalApsManager.getInstance();
//# sourceMappingURL=SpinalApsManager.js.map