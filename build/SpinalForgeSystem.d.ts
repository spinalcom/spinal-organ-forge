import SpinalForgeAuth from './forge_modules/SpinalForgeAuth';
import SpinalForgeFile from './forge_modules/SpinalForgeFile';
import SpinalForgeUpload from './forge_modules/SpinalForgeUpload';
import SpinalForgeTranslate from './forge_modules/SpinalForgeTranslate';
import SpinalForgeWaitTranslate from './forge_modules/SpinalForgeWaitTranslate';
import { Process as spinalProcess } from 'spinal-core-connectorjs_type';
import { FileVersionModel } from 'spinal-model-file_version_model';
declare type StateFunc = {
    state: string;
    func: () => Promise<void>;
};
export default class SpinalForgeSystem extends spinalProcess {
    fileVersionModel: FileVersionModel;
    classReady: boolean;
    filename: string;
    stateFunc: StateFunc[];
    spinalForgeFile: SpinalForgeFile;
    spinalForgeAuth: SpinalForgeAuth;
    spinalForgeUpload: SpinalForgeUpload;
    spinalForgeTranslate: SpinalForgeTranslate;
    spinalForgeWaitTranslate: SpinalForgeWaitTranslate;
    spinalForgeDownloadDerivative: any;
    job: Promise<void>;
    urn: string;
    bucketKey: string;
    constructor(fileVersionModel: FileVersionModel, filename: string);
    createInfo(): void;
    setupBucketKey(filename: string): any;
    createJob(fct: () => Promise<void>): () => Promise<void>;
    addState(stateLabel: string, fct: () => Promise<void>): void;
    init(): void;
    downloadDerivative(): Promise<void>;
    waitConversion(): any;
    startConvertion(): Promise<void>;
    uploadFileToForge(): Promise<void>;
    downloadFile(): Promise<void>;
    onchange(): Promise<void>;
}
export {};
