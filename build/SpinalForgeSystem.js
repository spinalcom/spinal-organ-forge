"use strict";
/*
 * Copyright 2024 SpinalCom - www.spinalcom.com
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const SpinalGetFileFromHub_1 = require("./forge_modules/SpinalGetFileFromHub");
const SpinalApsUpload_1 = require("./forge_modules/SpinalApsUpload");
const SpinalApsTranslateJob_1 = require("./forge_modules/SpinalApsTranslateJob");
const SpinalApsWaitJob_1 = require("./forge_modules/SpinalApsWaitJob");
const SpinalApsDownloadDerivative_1 = require("./forge_modules/SpinalApsDownloadDerivative");
const spinal_core_connectorjs_1 = require("spinal-core-connectorjs");
const fileVersionState_1 = require("./utils/fileVersionState");
const QueueJobHandle_1 = require("./utils/QueueJobHandle");
class SpinalForgeSystem extends spinal_core_connectorjs_1.Process {
    //#region constructor
    constructor(fileVersionModel, filename) {
        super(fileVersionModel);
        this.filename = filename;
        this.classReady = false;
        this.stateFunc = [];
        this.job = null;
        this.urn = '';
        this.bucketKey = '';
        this.fileVersionModel = fileVersionModel;
        this.uid = SpinalForgeSystem.uidCounter;
        SpinalForgeSystem.uidCounter = SpinalForgeSystem.uidCounter + 1;
    }
    //#endregion
    //#region onchange
    onchange() {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this.fileVersionModel.state === 'undefined' ||
                this.fileVersionModel.state.get() === 0 || // 'Inital'
                this.fileVersionModel.state.get() === 10 || // 'Converted'
                this.fileVersionModel.state.get() === 11 // 'Failed'
            ) {
                if (this.classReady === true)
                    QueueJobHandle_1.queueJobHandle.finishedJob(this.uid);
                return;
            }
            yield QueueJobHandle_1.queueJobHandle.waitJob(this.uid);
            this.init();
            const modelState = this.fileVersionModel.state.get();
            const stateLabel = (0, fileVersionState_1.getStateLabel)(modelState);
            console.log(`[${this.filename}] (${modelState}) state => ${stateLabel}`);
            for (const stateJob of this.stateFunc) {
                if (stateJob.state === stateLabel) {
                    return stateJob.func();
                }
            }
        });
    }
    //#endregion
    // #region createInfo
    createInfo() {
        if (typeof this.fileVersionModel.info === 'undefined') {
            this.fileVersionModel.mod_attr('info', new spinal_core_connectorjs_1.Model({
                bucketKey: '',
                translation: 0,
                urn: '',
            }));
        }
    }
    // #endregion
    // #region setupBucketKey
    setupBucketKey() {
        var _a, _b;
        if (((_b = (_a = this.fileVersionModel.info) === null || _a === void 0 ? void 0 : _a.bucketKey) === null || _b === void 0 ? void 0 : _b.get()) !== '') {
            return this.fileVersionModel.info.bucketKey.get();
        }
        {
            const BUCKET_KEY = `spinal_${Date.now()}`;
            this.fileVersionModel.info.bucketKey.set(BUCKET_KEY);
            return BUCKET_KEY;
        }
    }
    // #endregion
    // #region createJob
    createJob(fct) {
        return () => {
            if (this.job) {
                return this.job;
            }
            this.job = fct().then(() => {
                this.job = null;
            });
            return this.job;
        };
    }
    // #endregion
    // #region addState
    addState(stateLabel, fct) {
        this.stateFunc.push({
            state: stateLabel,
            func: this.createJob(fct),
        });
    }
    // #endregion
    // #region init
    init() {
        if (this.classReady === false) {
            this.classReady = true;
            this.createInfo();
            const BUCKET_KEY = this.setupBucketKey();
            this.bucketKey = BUCKET_KEY;
            this.spinalGetFileFromHub = new SpinalGetFileFromHub_1.default(this.fileVersionModel, this.filename);
            this.spinalApsUpload = new SpinalApsUpload_1.default(BUCKET_KEY, this.filename);
            this.spinalApsTranslateJob = new SpinalApsTranslateJob_1.default(BUCKET_KEY, this.filename);
            this.spinalApsWaitJob = new SpinalApsWaitJob_1.default();
            this.spinalApsDownloadDerivative = new SpinalApsDownloadDerivative_1.SpinalApsDownloadDerivative(BUCKET_KEY);
            this.addState('Send tranlation command to organ', this.downloadFile.bind(this));
            this.addState('File downloading to Organ', this.downloadFile.bind(this));
            this.addState('File download to Organ completed', this.uploadFileToForge.bind(this));
            this.addState('Uploading file to Forge', this.uploadFileToForge.bind(this));
            this.addState('Upload file to Forge completed', this.startConvertion.bind(this));
            this.addState('In queue for conversion', this.waitConversion.bind(this));
            this.addState('Converting', this.waitConversion.bind(this));
            this.addState('Converting completed', this.downloadDerivative.bind(this));
            this.addState('Download converted file', this.downloadDerivative.bind(this));
            this.addState('Converted', convertionFinished);
        }
    }
    // #endregion
    // #region downloadDerivative
    downloadDerivative() {
        return __awaiter(this, void 0, void 0, function* () {
            const model = this.fileVersionModel;
            if (this.urn === '') {
                this.urn = model.info.urn.get();
            }
            if (typeof model.items === 'undefined') {
                model.mod_attr('items', []);
            }
            try {
                const { viewables, aecPath } = yield this.spinalApsDownloadDerivative.run(this.urn, {
                    log: console.log,
                });
                if (aecPath) {
                    if (model.aecPath) {
                        model.aecPath.set(aecPath);
                    }
                    else {
                        model.mod_attr("aecPath", aecPath);
                    }
                }
                model.items.clear();
                for (let i = 0; i < viewables.length; i += 1) {
                    const item = {
                        path: viewables[i].path,
                        name: viewables[i].name,
                    };
                    model.items.push(new spinal_core_connectorjs_1.Model(item));
                }
                model.state.set((0, fileVersionState_1.getState)('Converted'));
            }
            catch (e) {
                console.error(e);
                model.state.set((0, fileVersionState_1.getState)('Failed'));
            }
            finally {
                // JOB DONE
                console.log('convertionFinished');
            }
        });
    }
    // #endregion
    // #region waitConversion
    waitConversion() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.urn === '') {
                this.urn = this.fileVersionModel.info.urn.get();
            }
            this.fileVersionModel.state.set((0, fileVersionState_1.getState)('Converting'));
            try {
                yield this.spinalApsWaitJob.waitTranslate(this.urn);
            }
            catch (e) {
                console.error(e);
                this.fileVersionModel.state.set((0, fileVersionState_1.getState)('Failed'));
            }
            this.fileVersionModel.state.set((0, fileVersionState_1.getState)('Converting completed'));
        });
    }
    // #endregion
    // #region startConvertion
    startConvertion() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.urn = yield this.spinalApsTranslateJob.translateInForge();
                this.fileVersionModel.info.urn.set(this.urn);
                this.fileVersionModel.state.set((0, fileVersionState_1.getState)('In queue for conversion'));
            }
            catch (e) {
                console.error(e);
                this.fileVersionModel.state.set((0, fileVersionState_1.getState)('Failed'));
            }
        });
    }
    // #endregion
    // #region uploadFileToForge
    uploadFileToForge() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.fileVersionModel.state.set((0, fileVersionState_1.getState)('Uploading file to Forge'));
                yield this.spinalApsUpload.uploadToAps();
                this.fileVersionModel.state.set((0, fileVersionState_1.getState)('Upload file to Forge completed'));
            }
            catch (e) {
                console.error(e);
                this.fileVersionModel.state.set((0, fileVersionState_1.getState)('Failed'));
            }
        });
    }
    // #endregion
    // #region downloadFile
    downloadFile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.fileVersionModel.state.set((0, fileVersionState_1.getState)('File downloading to Organ'));
                yield this.spinalGetFileFromHub.downloadFile();
                this.fileVersionModel.state.set((0, fileVersionState_1.getState)('File download to Organ completed'));
            }
            catch (e) {
                console.error(e);
                this.fileVersionModel.state.set((0, fileVersionState_1.getState)('Failed'));
            }
        });
    }
}
SpinalForgeSystem.uidCounter = 0;
exports.default = SpinalForgeSystem;
// #region convertionFinished
function convertionFinished() {
    return Promise.resolve();
}
// #endregion
//# sourceMappingURL=SpinalForgeSystem.js.map