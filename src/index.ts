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

import { spinalCore, FileSystem } from 'spinal-core-connectorjs';
import SpinalForgeSystem from './SpinalForgeSystem';
import { FileVersionModel } from 'spinal-model-file_version_model';
import { SPINAL_PASSWORD, SPINAL_USER_ID, SPINALHUB_IP, SPINALHUB_PORT, SPINALHUB_PROTOCOL } from './config';

// so it's not cut from the build.
FileVersionModel;

function main() {
  let connectOpt = `${SPINALHUB_PROTOCOL}://${SPINAL_USER_ID}:${SPINAL_PASSWORD}@${SPINALHUB_IP}`;
  if (SPINALHUB_PORT)
    connectOpt += `:${SPINALHUB_PORT}/`;
  else connectOpt += '/';
  const conn = spinalCore.connect(connectOpt);
  spinalCore.load_type(conn, 'FileVersionModel', callbackSuccess, errorConnect);
}
main();

function errorConnect(err?: any): void {
  if (!err) console.log('Error Connect.');
  else console.log(`Error Connect : ${err}`);
  process.exit(0);
};

function waitModelReady(file: FileVersionModel): Promise<FileVersionModel> {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (FileSystem._sig_server === false) {
        return false;
      }
      clearInterval(interval);
      resolve(file);
      return true;
    }, 100);
  });
};

async function callbackSuccess(fileVersionModel: FileVersionModel) {
  await waitModelReady(fileVersionModel);
  let filename: string = 'noname.rvt';
  if (typeof fileVersionModel.filename !== 'undefined') {
    filename = fileVersionModel.filename.get();
  }
  console.log(`new filenameVersion :${filename}`);
  new SpinalForgeSystem(fileVersionModel, filename);
};
