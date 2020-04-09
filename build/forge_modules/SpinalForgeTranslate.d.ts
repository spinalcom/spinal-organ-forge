export default class SpinalForgeTranslate {
    bucketKey: string;
    filename: string;
    spinalForgeAuth: any;
    constructor(bucketKey: string, filename: string, spinalForgeAuth: any);
    getObjects(oAuth: any): Promise<unknown>;
    convertObj(oAuth: any, obj: any): Promise<{
        auth: any;
        res: any;
    }>;
    translateInForge(): string;
}
