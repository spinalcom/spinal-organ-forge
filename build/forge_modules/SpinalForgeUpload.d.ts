export default class SpinalForgeUpload {
    bucketKey: string;
    filename: string;
    spinalForgeAuth: any;
    constructor(bucketKey: string, filename: string, spinalForgeAuth: any);
    uploadFile(oAuth: any): Promise<unknown>;
    uploadToForge(): any;
}
