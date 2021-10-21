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

import forgeSDK = require('forge-apis');
const bucketsApi = new forgeSDK.BucketsApi();
type OAuthToken = any;

export default class SpinalForgeAuth {
  oAuth2TwoLegged: forgeSDK.AuthClientTwoLegged = null;
  loggedIn: boolean = false;
  bucketKey: string;

  constructor(BUCKET_KEY) {
    this.bucketKey = BUCKET_KEY;
  }

  getBucketDetails(bucketKey: string) {
    console.log(`**** Getting bucket details : ${bucketKey}`);
    return bucketsApi.getBucketDetails(
      bucketKey,
      this.oAuth2TwoLegged,
      this.oAuth2TwoLegged.getCredentials(),
    );
  }
  createBucket(bucketKey: string) {
    console.log(`**** Creating Bucket : ${bucketKey}`);
    const createBucketJson = {
      bucketKey,
      policyKey: 'temporary',
    };
    return bucketsApi.createBucket(
      createBucketJson,
      {},
      this.oAuth2TwoLegged,
      this.oAuth2TwoLegged.getCredentials(),
    );
  }

  async createBucketIfNotExist(bucketKey: string): Promise<any> {
    console.log('**** Creating bucket if not exist :', bucketKey);

    try {
      return await this.getBucketDetails(bucketKey);
    } catch (err) {
      console.log(err);
      if (err.statusCode === 404) {
        try {
          return await this.createBucket(bucketKey);
        } catch (err2) {
          throw err2;
        }
      }
      throw err;
    }
  }

  async auth(): Promise<OAuthToken> {
    this.oAuth2TwoLegged = new forgeSDK.AuthClientTwoLegged(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      [
        'data:read',
        'data:write',
        'data:create',
        'data:search',
        'bucket:create',
        'bucket:read',
        'bucket:update',
      ],
      true,
    );

    const credentials = await this.oAuth2TwoLegged.authenticate();
    console.log('**** Got Credentials', credentials);
    return (this.oAuth2TwoLegged);
  }

  async auth_and_getBucket(): Promise<OAuthToken> {
    console.log('*** auth_and_getBucket');
    await this.auth();
    await this.createBucketIfNotExist(this.bucketKey);
    this.loggedIn = true;
    return this.oAuth2TwoLegged;
  }
}
