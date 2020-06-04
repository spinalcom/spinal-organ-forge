interface ChunkUploadOpts {
    chunkSize?: number;
    concurrentUploads?: number;
    onProgress?: (info: any) => void;
    onComplete?: () => void;
    onError?: (error: any) => void;
}
interface ChunkUploadFile {
    size: number;
    path: string;
}
export default class SpinalForgeUpload {
    bucketKey: string;
    filename: string;
    spinalForgeAuth: any;
    constructor(bucketKey: string, filename: string, spinalForgeAuth: any);
    uploadFile(oAuth: any): Promise<unknown>;
    guid(format?: string): string;
    uploadObjectChunked(oAuth: any, filename: string, file: ChunkUploadFile, opts?: ChunkUploadOpts): Promise<unknown>;
    uploadToForge(): any;
}
export {};
