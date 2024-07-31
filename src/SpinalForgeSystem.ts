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

import SpinalGetFileFromHub from './forge_modules/SpinalGetFileFromHub';
import SpinalApsUpload from './forge_modules/SpinalApsUpload';
import SpinalApsTranslateJob from './forge_modules/SpinalApsTranslateJob';
import SpinalApsWaitJob from './forge_modules/SpinalApsWaitJob';
import { SpinalApsDownloadDerivative } from './forge_modules/SpinalApsDownloadDerivative';
import { Process as spinalProcess, Model } from 'spinal-core-connectorjs';
import { FileVersionModel } from 'spinal-model-file_version_model';
import { getStateLabel, getState } from './utils/fileVersionState';
import { queueJobHandle } from './utils/QueueJobHandle';
import { IViewable } from './forge_modules/IViewable';

type StateFunc = {
  state: string,
  func: () => Promise<void>,
};

export default class SpinalForgeSystem extends spinalProcess {
  private static uidCounter = 0;
  uid: number;
  fileVersionModel: FileVersionModel;
  classReady: boolean = false;
  stateFunc: StateFunc[] = [];
  spinalGetFileFromHub: SpinalGetFileFromHub;
  spinalApsUpload: SpinalApsUpload;
  spinalApsTranslateJob: SpinalApsTranslateJob;
  spinalApsWaitJob: SpinalApsWaitJob;
  spinalApsDownloadDerivative: SpinalApsDownloadDerivative;
  job: Promise<void> = null;
  urn: string = '';
  bucketKey: string = '';

  //#region constructor
  constructor(fileVersionModel: FileVersionModel, public filename: string) {
    super(fileVersionModel);
    this.fileVersionModel = fileVersionModel;
    this.uid = SpinalForgeSystem.uidCounter;
    SpinalForgeSystem.uidCounter = SpinalForgeSystem.uidCounter + 1;
  }
  //#endregion

  //#region onchange
  async onchange() {
    if (
      typeof this.fileVersionModel.state === 'undefined' ||
      this.fileVersionModel.state.get() === 0 ||  // 'Inital'
      this.fileVersionModel.state.get() === 10 || // 'Converted'
      this.fileVersionModel.state.get() === 11    // 'Failed'
    ) {
      if (this.classReady === true) queueJobHandle.finishedJob(this.uid);
      return;
    }
    await queueJobHandle.waitJob(this.uid);
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
  //#endregion

  // #region createInfo
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
  // #endregion

  // #region setupBucketKey
  setupBucketKey() {
    if (this.fileVersionModel.info?.bucketKey?.get() !== '') {
      return this.fileVersionModel.info.bucketKey.get();
    } {
      const BUCKET_KEY = `spinal_${Date.now()}`;
      this.fileVersionModel.info.bucketKey.set(BUCKET_KEY);
      return BUCKET_KEY;
    }
  }
  // #endregion

  // #region createJob
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
  // #endregion

  // #region addState
  addState(stateLabel: string, fct: () => Promise<void>) {

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
      this.spinalGetFileFromHub = new SpinalGetFileFromHub(
        this.fileVersionModel, this.filename,
      );
      this.spinalApsUpload = new SpinalApsUpload(
        BUCKET_KEY, this.filename,
      );
      this.spinalApsTranslateJob = new SpinalApsTranslateJob(
        BUCKET_KEY, this.filename,
      );
      this.spinalApsWaitJob = new SpinalApsWaitJob();
      this.spinalApsDownloadDerivative = new SpinalApsDownloadDerivative(
        BUCKET_KEY
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

      this.addState('Converted', convertionFinished);
    }
  }
  // #endregion

  // #region downloadDerivative
  async downloadDerivative() {
    const model = this.fileVersionModel;
    if (this.urn === '') {
      this.urn = model.info.urn.get();
    }
    if (typeof model.items === 'undefined') {
      model.mod_attr('items', []);
    }
    try {
      const { viewables, aecPath } = await this.spinalApsDownloadDerivative.run(this.urn, {
        log: console.log,
      });
      if (aecPath) {
        if (model.aecPath) {
          model.aecPath.set(aecPath)
        } else {
          model.mod_attr("aecPath", aecPath)
        }
      }
      model.items.clear();
      for (let i = 0; i < viewables.length; i += 1) {
        const item: IViewable = {
          path: viewables[i].path,
          name: viewables[i].name,
        };
        model.items.push(new Model(item));
      }
      model.state.set(getState('Converted'));
    } catch (e) {
      console.error(e);
      model.state.set(getState('Failed'));
    } finally {
      // JOB DONE
      console.log('convertionFinished');
    }
  }
  // #endregion

  // #region waitConversion
  async waitConversion() {
    if (this.urn === '') {
      this.urn = this.fileVersionModel.info.urn.get();
    }
    this.fileVersionModel.state.set(getState('Converting'));
    try {
      await this.spinalApsWaitJob.waitTranslate(this.urn)
    } catch (e) {
      console.error(e);
      this.fileVersionModel.state.set(getState('Failed'));
    }

    this.fileVersionModel.state.set(getState('Converting completed'));
  }
  // #endregion
  // #region startConvertion
  async startConvertion() {
    try {
      this.urn = await this.spinalApsTranslateJob.translateInForge();
      this.fileVersionModel.info.urn.set(this.urn);
      this.fileVersionModel.state.set(getState('In queue for conversion'));
    } catch (e) {
      console.error(e);
      this.fileVersionModel.state.set(getState('Failed'));
    }
  }
  // #endregion

  // #region uploadFileToForge
  async uploadFileToForge() {
    try {
      this.fileVersionModel.state.set(getState('Uploading file to Forge'));
      await this.spinalApsUpload.uploadToAps();
      this.fileVersionModel.state.set(getState('Upload file to Forge completed'));
    } catch (e) {
      console.error(e);
      this.fileVersionModel.state.set(getState('Failed'));
    }
  }
  // #endregion

  // #region downloadFile
  async downloadFile() {
    try {
      this.fileVersionModel.state.set(getState('File downloading to Organ'));
      await this.spinalGetFileFromHub.downloadFile();
      this.fileVersionModel.state.set(getState('File download to Organ completed'));
    } catch (e) {
      console.error(e);
      this.fileVersionModel.state.set(getState('Failed'));
    }
  }
  // #endregion
}

// #region convertionFinished
function convertionFinished() {
  return Promise.resolve();
}
// #endregion
