declare type OAuthToken = any;
export default class SpinalForgeAuth {
    oAuth2TwoLegged: any;
    loggedIn: boolean;
    bucketKey: string;
    constructor(BUCKET_KEY: any);
    getBucketDetails(bucketKey: string): any;
    createBucket(bucketKey: string): any;
    createBucketIfNotExist(bucketKey: string): Promise<any>;
    auth(): Promise<OAuthToken>;
    auth_and_getBucket(): Promise<OAuthToken>;
}
export {};
