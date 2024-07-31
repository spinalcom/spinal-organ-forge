import { FileVersionModel } from 'spinal-model-file_version_model';
export default class SpinalGetFileFromHub {
    fileVersionModel: FileVersionModel;
    filename: string;
    constructor(fileVersionModel: FileVersionModel, filename: string);
    downloadFile(): Promise<void>;
    private download;
}
