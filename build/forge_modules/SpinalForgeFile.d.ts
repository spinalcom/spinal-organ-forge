import { FileVersionModel } from 'spinal-model-file_version_model';
export default class SpinalForgeFile {
    fileVersionModel: FileVersionModel;
    filename: string;
    constructor(fileVersionModel: FileVersionModel, filename: string);
    download(url: string, dest: string): Promise<void>;
    downloadFile(): Promise<void>;
}
