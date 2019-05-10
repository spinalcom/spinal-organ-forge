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

const fs = require('fs');
const request = require('request');
import { loadModelPtr } from '../utils/loadModelPtr';
import { FileVersionModel } from 'spinal-model-file_version_model';
const mkdirp = require('mkdirp');
const nodepath = require('path');
const OUT_DIR = nodepath.resolve(__dirname, '..', '..', 'tmp');

export default class SpinalForgeFile {
  fileVersionModel: FileVersionModel;
  filename: string;

  constructor(fileVersionModel: FileVersionModel, filename: string) {
    this.fileVersionModel = fileVersionModel;
    this.filename = filename;
  }

  download(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      const sendReq = request.get(url);
      sendReq.on('response', (response) => {
        if (response.statusCode !== 200) {
          reject(`Response status was ${response.statusCode}`);
        }
      });
      sendReq.on('error', (err) => {
        console.log('Download failed.');
        try {
          fs.unlink(dest);
        } catch (e) {
          console.error('error on unlink');
        }
        reject(err);
      });
      sendReq.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log('Download completed.');
          // model.state.set("Uploading to forge");
          resolve();
        });
      });
      file.on('error', (err) => {
        console.log('Download failed.');
        try {
          fs.unlink(dest);
        } catch (e) {
          console.error('error on unlink');
        }
        reject(err);
      });
    });
  }

  downloadFile(): Promise<void> {
    console.log(`Starting to Download the File : ${this.filename}`);
    mkdirp.sync(OUT_DIR);
    return loadModelPtr(this.fileVersionModel.ptr).then((path): Promise<void> => {
      return new Promise((resolve, reject) => {
        fs.unlink(this.filename, () => {
          let url;
          if (path.constructor.name === 'Path') {
            url = `http://${process.env.SPINALHUB_IP}:${process.env.SPINALHUB_PORT
              }/sceen/_?u=${path._server_id}`;
          } else {
            if (path.constructor.name === 'HttpPath') {
              url = `${path.host.get()}/file/${encodeURIComponent(path.httpRootPath.get())
                }/${encodeURIComponent(path.httpPath.get())}`;
            }
          }
          return this.download(url, nodepath.resolve(OUT_DIR, this.filename)).then(resolve, reject);
        });
      });
    });
  }

}
