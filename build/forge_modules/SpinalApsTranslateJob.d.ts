export default class SpinalApsTranslateJob {
    private bucketKey;
    private filename;
    constructor(bucketKey: string, filename: string);
    translateInForge(): Promise<string>;
    private getObjectIdFile;
    private urnify;
}
