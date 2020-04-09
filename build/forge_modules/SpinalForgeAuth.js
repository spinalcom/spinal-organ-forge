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
const forgeSDK = require('forge-apis');
const bucketsApi = new forgeSDK.BucketsApi();
class SpinalForgeAuth {
    constructor(BUCKET_KEY) {
        this.oAuth2TwoLegged = 0;
        this.loggedIn = false;
        this.bucketKey = BUCKET_KEY;
    }
    getBucketDetails(bucketKey) {
        console.log(`**** Getting bucket details : ${bucketKey}`);
        return bucketsApi.getBucketDetails(bucketKey, this.oAuth2TwoLegged, this.oAuth2TwoLegged.getCredentials());
    }
    createBucket(bucketKey) {
        console.log(`**** Creating Bucket : ${bucketKey}`);
        const createBucketJson = {
            bucketKey,
            policyKey: 'temporary',
        };
        return bucketsApi.createBucket(createBucketJson, {}, this.oAuth2TwoLegged, this.oAuth2TwoLegged.getCredentials());
    }
    createBucketIfNotExist(bucketKey) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('**** Creating bucket if not exist :', bucketKey);
            try {
                return yield this.getBucketDetails(bucketKey);
            }
            catch (err) {
                console.log(err);
                if (err.statusCode === 404) {
                    try {
                        return yield this.createBucket(bucketKey);
                    }
                    catch (err2) {
                        throw err2;
                    }
                }
                throw err;
            }
        });
    }
    auth() {
        return __awaiter(this, void 0, void 0, function* () {
            this.oAuth2TwoLegged = new forgeSDK.AuthClientTwoLegged(process.env.CLIENT_ID, process.env.CLIENT_SECRET, [
                'data:read',
                'data:write',
                'data:create',
                'data:search',
                'bucket:create',
                'bucket:read',
                'bucket:update',
            ], true);
            const credentials = yield this.oAuth2TwoLegged.authenticate();
            console.log('**** Got Credentials', credentials);
            return (this.oAuth2TwoLegged);
        });
    }
    auth_and_getBucket() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('*** auth_and_getBucket');
            yield this.auth();
            yield this.createBucketIfNotExist(this.bucketKey);
            this.loggedIn = true;
            return this.oAuth2TwoLegged;
        });
    }
}
exports.default = SpinalForgeAuth;
//# sourceMappingURL=SpinalForgeAuth.js.map