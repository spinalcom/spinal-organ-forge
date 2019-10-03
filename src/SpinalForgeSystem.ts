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
import SpinalForgeDownloadDerivative from './forge_modules/SpinalForgeDownloadDerivative';
// import SpinalForgeGetProps from './forge_modules/SpinalForgeGetProps';
import { Process as spinalProcess, Model } from 'spinal-core-connectorjs_type';
import { FileVersionModel } from 'spinal-model-file_version_model';
import { getStateLabel, getState } from './utils/fileVersionState';

type StateFunc = {
  state: string,
  func: () => Promise<void>,
};

type ViewableItem = {
  path: string;
  name: string;
  thumbnail?: string;
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
  constructor(fileVersionModel: FileVersionModel, filename: string) {
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
      this.fileVersionModel.mod_attr(
        'info',
        new Model({
          bucketKey: '',
          translation: 0,
          urn: '',
        }),
      );
    }
  }

  setupBucketKey(filename: string) {
    if (
      typeof this.fileVersionModel.info.bucketKey !== 'undefined' &&
      this.fileVersionModel.info.bucketKey.get() !== ''
    ) {
      return this.fileVersionModel.info.bucketKey.get();
    } else {
      const tmpBucketKey =
        `spinal_${encodeURIComponent(filename)}_${Date.now()}`;
      const BUCKET_KEY = encodeURIComponent(
        Buffer.from(tmpBucketKey)
          .toString('base64')
          .replace(/=*/g, ''),
      )
        .toLowerCase()
        .replace(/%*/g, '');
      this.fileVersionModel.info.bucketKey.set(BUCKET_KEY);
      return BUCKET_KEY;
    }
  }
  createJob(fct: () => Promise<void>) {
    return () => {
      if (this.job) {
        return this.job;
      }
      this.job = fct().then(
        () => {
          this.job = null;
        },
      );
      return this.job;
    };
  }

  addState(stateLabel: string, fct: () => Promise<void>) {

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
      this.spinalForgeFile = new SpinalForgeFile(
        this.fileVersionModel,
        this.filename,
      );
      this.spinalForgeAuth = new SpinalForgeAuth(BUCKET_KEY);
      this.spinalForgeUpload = new SpinalForgeUpload(
        BUCKET_KEY,
        this.filename,
        this.spinalForgeAuth,
      );
      this.spinalForgeTranslate = new SpinalForgeTranslate(
        BUCKET_KEY,
        this.filename,
        this.spinalForgeAuth,
      );
      this.spinalForgeWaitTranslate = new SpinalForgeWaitTranslate(
        this.spinalForgeAuth,
      );
      this.spinalForgeDownloadDerivative = new SpinalForgeDownloadDerivative(
        BUCKET_KEY,
        this.spinalForgeAuth,
      );
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

  async downloadDerivative() {
    const model = this.fileVersionModel;
    if (this.urn === '') {
      this.urn = model.info.urn.get();
    }
    if (typeof model.items === 'undefined') {
      model.mod_attr('items', []);
    }
    try {
      const viewables = await this.spinalForgeDownloadDerivative.downloadDerivative(this.urn);
      model.items.clear();
      for (let i = 0; i < viewables.length; i++) {
        const item: ViewableItem = {
          path: viewables[i].path,
          name: viewables[i].name,
        };
        const thumbnail = viewables[i].thumbnail;
        if (typeof thumbnail !== 'undefined') {
          item.thumbnail = thumbnail;
        }
        model.items.push(new Model(item));
      }
      // await SpinalForgeGetProps(this.spinalForgeAuth, this.urn, this.bucketKey);
      model.state.set(getState('Converted'));
    } catch (e) {
      console.error(e);
      model.state.set(getState('Failed'));
    }
  }

  waitConversion() {
    if (this.urn === '') {
      this.urn = this.fileVersionModel.info.urn.get();
    }
    this.fileVersionModel.state.set(getState('Converting'));
    return this.spinalForgeWaitTranslate
      .waitTranslate(this.urn)
      .then(() => { // resolve
        this.fileVersionModel.state.set(getState('Converting completed'));
      }, (e) => { // reject
        console.error(e);
        this.fileVersionModel.state.set(getState('Failed'));
      }, (progress) => { // progress
        console.log(`[${this.filename}] progress => ${progress}`);
      });
  }

  async startConvertion() {
    try {
      this.urn = await this.spinalForgeTranslate.translateInForge();
      this.fileVersionModel.info.urn.set(this.urn);
      this.fileVersionModel.state.set(getState('In queue for conversion'));
    } catch (e) {
      console.error(e);
      this.fileVersionModel.state.set(getState('Failed'));
    }
  }

  async uploadFileToForge() {
    try {
      this.fileVersionModel.state.set(getState('Uploading file to Forge'));
      await this.spinalForgeUpload.uploadToForge();
      this.fileVersionModel.state.set(getState('Upload file to Forge completed'));
    } catch (e) {
      console.error(e);
      this.fileVersionModel.state.set(getState('Failed'));
    }
  }

  async downloadFile() {
    try {
      this.fileVersionModel.state.set(getState('File downloading to Organ'));
      await this.spinalForgeFile.downloadFile();
      this.fileVersionModel.state.set(getState('File download to Organ completed'));
    } catch (e) {
      console.error(e);
      this.fileVersionModel.state.set(getState('Failed'));
    }
  }

  onchange() {
    if (
      typeof this.fileVersionModel.state === 'undefined' ||
      this.fileVersionModel.state.get() === 0
    ) {
      return;
    }
    this.init();
    const modelState = this.fileVersionModel.state.get();
    const stateLabel = getStateLabel(modelState);
    console.log(`[${this.filename}] (${modelState}) state => ${stateLabel}`);

    for (const stateJob of this.stateFunc) {
      if (stateJob.state === stateLabel) {
        return stateJob.func();
      }
    }
  }
}
function placeholerFct() {
  console.log('placeholer');
  return Promise.resolve();
}
