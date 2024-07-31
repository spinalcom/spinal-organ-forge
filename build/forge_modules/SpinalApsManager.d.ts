import { OssClient } from '@aps_sdk/oss';
import { Scopes, AuthenticationClient } from '@aps_sdk/authentication';
import { ModelDerivativeClient } from '@aps_sdk/model-derivative';
export declare class SpinalApsManager {
    ossClient: OssClient;
    modelDerivativeClient: ModelDerivativeClient;
    authenticationClient: AuthenticationClient;
    private constructor();
    static getInstance(): SpinalApsManager;
    getToken(scopes: Scopes[]): Promise<string>;
    getAuthAndCreateBucket(bucketKey: string): Promise<string>;
    ensureBucketExists(bucketKey: string, token: string): Promise<void>;
}
export declare const spinalApsManager: SpinalApsManager;
