"use strict";
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
/*
 * Copyright 2020 SpinalCom - www.spinalcom.com
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
const SpinalForgeAuth_1 = require("./forge_modules/SpinalForgeAuth");
const SpinalForgeFile_1 = require("./forge_modules/SpinalForgeFile");
const SpinalForgeUpload_1 = require("./forge_modules/SpinalForgeUpload");
const SpinalForgeTranslate_1 = require("./forge_modules/SpinalForgeTranslate");
const SpinalForgeWaitTranslate_1 = require("./forge_modules/SpinalForgeWaitTranslate");
const SpinalForgeDownloadDerivative_1 = require("./forge_modules/SpinalForgeDownloadDerivative");
// import SpinalForgeGetProps from './forge_modules/SpinalForgeGetProps';
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const fileVersionState_1 = require("./utils/fileVersionState");
class SpinalForgeSystem extends spinal_core_connectorjs_type_1.Process {
    constructor(fileVersionModel, filename) {
        super(fileVersionModel);
        this.fileVersionModel = fileVersionModel;
        this.classReady = false;
        this.stateFunc = [];
        this.filename = filename;
        this.job = null;
        this.urn = '';
        this.bucketKey = '';
    }
    createInfo() {
        if (typeof this.fileVersionModel.info === 'undefined') {
            this.fileVersionModel.mod_attr('info', new spinal_core_connectorjs_type_1.Model({
                bucketKey: '',
                translation: 0,
                urn: '',
            }));
        }
    }
    setupBucketKey(filename) {
        if (typeof this.fileVersionModel.info.bucketKey !== 'undefined' &&
            this.fileVersionModel.info.bucketKey.get() !== '') {
            return this.fileVersionModel.info.bucketKey.get();
        }
        {
            const tmpBucketKey = `spinal_${encodeURIComponent(filename)}_${Date.now()}`;
            const BUCKET_KEY = encodeURIComponent(Buffer.from(tmpBucketKey)
                .toString('base64')
                .replace(/=*/g, ''))
                .toLowerCase()
                .replace(/%*/g, '');
            this.fileVersionModel.info.bucketKey.set(BUCKET_KEY);
            return BUCKET_KEY;
        }
    }
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
    addState(stateLabel, fct) {
        this.stateFunc.push({
            state: stateLabel,
            func: this.createJob(fct),
        });
    }
    init() {
        if (this.classReady === false) {
            this.classReady = true;
            this.createInfo();
            const BUCKET_KEY = this.setupBucketKey(this.filename);
            this.bucketKey = BUCKET_KEY;
            this.spinalForgeFile = new SpinalForgeFile_1.default(this.fileVersionModel, this.filename);
            this.spinalForgeAuth = new SpinalForgeAuth_1.default(BUCKET_KEY);
            this.spinalForgeUpload = new SpinalForgeUpload_1.default(BUCKET_KEY, this.filename, this.spinalForgeAuth);
            this.spinalForgeTranslate = new SpinalForgeTranslate_1.default(BUCKET_KEY, this.filename, this.spinalForgeAuth);
            this.spinalForgeWaitTranslate = new SpinalForgeWaitTranslate_1.default(this.spinalForgeAuth);
            this.spinalForgeDownloadDerivative = new SpinalForgeDownloadDerivative_1.default(BUCKET_KEY, this.spinalForgeAuth);
            this.addState('Send tranlation command to organ', this.downloadFile.bind(this));
            this.addState('File downloading to Organ', this.downloadFile.bind(this));
            this.addState('File download to Organ completed', this.uploadFileToForge.bind(this));
            this.addState('Uploading file to Forge', this.uploadFileToForge.bind(this));
            this.addState('Upload file to Forge completed', this.startConvertion.bind(this));
            this.addState('In queue for conversion', this.waitConversion.bind(this));
            this.addState('Converting', this.waitConversion.bind(this));
            this.addState('Converting completed', this.downloadDerivative.bind(this));
            this.addState('Download converted file', this.downloadDerivative.bind(this));
            this.addState('Converted', placeholerFct);
        }
    }
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
                const viewables = yield this.spinalForgeDownloadDerivative.downloadDerivative(this.urn);
                model.items.clear();
                for (let i = 0; i < viewables.length; i += 1) {
                    const item = {
                        path: viewables[i].path,
                        name: viewables[i].name,
                    };
                    const thumbnail = viewables[i].thumbnail;
                    if (typeof thumbnail !== 'undefined') {
                        item.thumbnail = thumbnail;
                    }
                    model.items.push(new spinal_core_connectorjs_type_1.Model(item));
                }
                // await SpinalForgeGetProps(this.spinalForgeAuth, this.urn, this.bucketKey);
                model.state.set(fileVersionState_1.getState('Converted'));
            }
            catch (e) {
                console.error(e);
                model.state.set(fileVersionState_1.getState('Failed'));
            }
        });
    }
    waitConversion() {
        if (this.urn === '') {
            this.urn = this.fileVersionModel.info.urn.get();
        }
        this.fileVersionModel.state.set(fileVersionState_1.getState('Converting'));
        return this.spinalForgeWaitTranslate
            .waitTranslate(this.urn)
            .then(() => {
            this.fileVersionModel.state.set(fileVersionState_1.getState('Converting completed'));
        }, (e) => {
            console.error(e);
            this.fileVersionModel.state.set(fileVersionState_1.getState('Failed'));
        }, (progress) => {
            console.log(`[${this.filename}] progress => ${progress}`);
            this.fileVersionModel.info.translation.set(parseInt(progress, 10));
        });
    }
    startConvertion() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.urn = yield this.spinalForgeTranslate.translateInForge();
                this.fileVersionModel.info.urn.set(this.urn);
                this.fileVersionModel.state.set(fileVersionState_1.getState('In queue for conversion'));
            }
            catch (e) {
                console.error(e);
                this.fileVersionModel.state.set(fileVersionState_1.getState('Failed'));
            }
        });
    }
    uploadFileToForge() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.fileVersionModel.state.set(fileVersionState_1.getState('Uploading file to Forge'));
                yield this.spinalForgeUpload.uploadToForge();
                this.fileVersionModel.state.set(fileVersionState_1.getState('Upload file to Forge completed'));
            }
            catch (e) {
                console.error(e);
                this.fileVersionModel.state.set(fileVersionState_1.getState('Failed'));
            }
        });
    }
    downloadFile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.fileVersionModel.state.set(fileVersionState_1.getState('File downloading to Organ'));
                yield this.spinalForgeFile.downloadFile();
                this.fileVersionModel.state.set(fileVersionState_1.getState('File download to Organ completed'));
            }
            catch (e) {
                console.error(e);
                this.fileVersionModel.state.set(fileVersionState_1.getState('Failed'));
            }
        });
    }
    onchange() {
        if (typeof this.fileVersionModel.state === 'undefined' ||
            this.fileVersionModel.state.get() === 0) {
            return;
        }
        this.init();
        const modelState = this.fileVersionModel.state.get();
        const stateLabel = fileVersionState_1.getStateLabel(modelState);
        console.log(`[${this.filename}] (${modelState}) state => ${stateLabel}`);
        for (const stateJob of this.stateFunc) {
            if (stateJob.state === stateLabel) {
                return stateJob.func();
            }
        }
    }
}
exports.default = SpinalForgeSystem;
function placeholerFct() {
    console.log('placeholer');
    return Promise.resolve();
}
//# sourceMappingURL=SpinalForgeSystem.js.map