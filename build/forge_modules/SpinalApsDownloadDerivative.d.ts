import { IDownloadDerivativeOutput } from "./IDownloadDerivativeOutput";
export interface IDownloadOptions {
    outputDir?: string;
    log?: (message: string) => void;
    failOnMissingAssets?: boolean;
}
export type IDownloadContext = Required<IDownloadOptions>;
export interface SVFManifestDerivative {
    guid: string;
    type: string;
    role: string;
    urn: string;
    mime: string;
}
export declare class SpinalApsDownloadDerivative {
    private bucketKey;
    private sdkManager;
    private modelDerivativeClient;
    constructor(bucketKey: string);
    run(urn: string, options?: IDownloadOptions): Promise<IDownloadDerivativeOutput>;
    private _download;
    debug_output_to_file(output: any, fileName: string): void;
    private _collectDerivatives;
    private _dlSvfDerivatives;
    private _dlDerivativeAssest;
    private _dlAec;
    private _dlDerivativeFile;
}
