/**
 * Copyright 2015 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */
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
