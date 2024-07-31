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

import { TwoLeggedAuthenticationProvider } from 'svf-utils';
import { OssClient, CreateBucketsPayloadPolicyKeyEnum, CreateBucketXAdsRegionEnum } from '@aps_sdk/oss';
import { SdkManagerBuilder } from '@aps_sdk/autodesk-sdkmanager';
import { Scopes } from '@aps_sdk/authentication';
import { ModelDerivativeClient } from '@aps_sdk/model-derivative';
import { CLIENT_ID, CLIENT_SECRET } from '../config';

export class SpinalApsManager {
  public auth: TwoLeggedAuthenticationProvider;
  ossClient: OssClient;
  modelDerivativeClient: ModelDerivativeClient;

  // #region singleton
  private constructor() {
    this.auth = new TwoLeggedAuthenticationProvider(
      CLIENT_ID,
      CLIENT_SECRET
    )
    const sdk = SdkManagerBuilder.create().build();
    // this.authenticationClient = new AuthenticationClient(sdk);
    this.ossClient = new OssClient(sdk);
    this.modelDerivativeClient = new ModelDerivativeClient(sdk);
  }

  static getInstance(): SpinalApsManager {
    return new SpinalApsManager();
  }
  // #endregion

  // #region getToken
  getToken(scopes: Scopes[]): Promise<string> {
    return this.auth.getToken(scopes)
  }
  // #endregion

  // #region getAuthAndCreateBucket
  async getAuthAndCreateBucket(bucketKey: string) {
    const token = await this.getToken([
      Scopes.CodeAll,
      Scopes.DataCreate, Scopes.DataWrite, Scopes.DataRead,
      Scopes.BucketCreate, Scopes.BucketRead,
    ])
    this.ensureBucketExists(bucketKey, token);
    return token;
  }
  // #endregion

  // #region ensureBucketExists
  async ensureBucketExists(bucketKey: string, token: string) {
    try {
      await this.ossClient.getBucketDetails(token, bucketKey);
    } catch (err) {
      if (err.axiosError.response.status === 404) {
        await this.ossClient.createBucket(token, CreateBucketXAdsRegionEnum.Emea, {
          bucketKey: bucketKey,
          policyKey: CreateBucketsPayloadPolicyKeyEnum.Transient
        });
      } else {
        throw err;
      }
    }
  }
  // #endregion

}

export const spinalApsManager = SpinalApsManager.getInstance();
