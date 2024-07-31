export default class SpinalApsUpload {
    private bucketKey;
    private filename;
    constructor(bucketKey: string, filename: string);
    uploadToAps(): Promise<void>;
}
