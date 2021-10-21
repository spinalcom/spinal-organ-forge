import forgeSDK = require('forge-apis');
declare type OAuthToken = any;
export default class SpinalForgeAuth {
    oAuth2TwoLegged: forgeSDK.AuthClientTwoLegged;
    loggedIn: boolean;
    bucketKey: string;
    constructor(BUCKET_KEY: any);
    getBucketDetails(bucketKey: string): Promise<forgeSDK.ApiResponse>;
    createBucket(bucketKey: string): Promise<forgeSDK.ApiResponse>;
    createBucketIfNotExist(bucketKey: string): Promise<any>;
    auth(): Promise<OAuthToken>;
    auth_and_getBucket(): Promise<OAuthToken>;
}
export {};
