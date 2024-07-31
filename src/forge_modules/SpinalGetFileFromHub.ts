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

import { loadModelPtr } from '../utils/loadModelPtr';
import { FileVersionModel } from 'spinal-model-file_version_model';
const nodepath = require('path');
import { createWriteStream, ensureDirSync, unlinkSync } from 'fs-extra';
import axios from 'axios';
import { SPINALHUB_IP, SPINALHUB_PORT, SPINALHUB_PROTOCOL } from '../config';
const OUT_DIR = nodepath.resolve(__dirname, '..', '..', 'tmp');

export default class SpinalGetFileFromHub {
  fileVersionModel: FileVersionModel;
  filename: string;

  // #region constructor
  constructor(fileVersionModel: FileVersionModel, filename: string) {
    this.fileVersionModel = fileVersionModel;
    this.filename = filename;
  }
  // #endregion


  // #region downloadFile
  async downloadFile(): Promise<void> {
    console.log(`Starting to Download the File : ${this.filename}`);
    ensureDirSync(OUT_DIR);
    const path = await loadModelPtr(this.fileVersionModel.ptr);
    try {
      unlinkSync(this.filename);
    } catch (error) {

    }
    let url;
    if (path.constructor.name === 'Path') {
      url = `${SPINALHUB_PROTOCOL}://${SPINALHUB_IP}`
      if (SPINALHUB_PORT) url += `:${process.env.SPINALHUB_PORT}/sceen/_?u=${path._server_id}`;
      else url += `/sceen/_?u=${path._server_id}`;
    } else {
      if (path.constructor.name === 'HttpPath') {
        url = `${path.host.get()}/file/${encodeURIComponent(path.httpRootPath.get())
          }/${encodeURIComponent(path.httpPath.get())}`;
      }
    }
    return this.download(url, nodepath.resolve(OUT_DIR, this.filename));
  }
  // #endregion

  // #region download
  private async download(url: string, dest: string): Promise<void> {
    try {
      unlinkSync(dest);
    } catch (error) { }
    const file = createWriteStream(dest);
    const res = await axios({
      method: 'get',
      url,
      responseType: 'stream',
    })
    return new Promise((resolve, reject) => {
      res.data.pipe(file);
      let error = null;
      file.on('error', err => {
        error = err;
        file.close();
        try {
          unlinkSync(dest);
        } catch (error) {
          console.error('error on unlink');
        }
        reject(err);
      });
      file.on('close', () => {
        if (!error) {
          resolve();
        }
      });
    });
  }
  // #endregion
}
