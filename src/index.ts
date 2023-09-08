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

import { spinalCore, FileSystem } from 'spinal-core-connectorjs_type';
// const SpinalForgeSystem = require('./SpinalForgeSystem');
import SpinalForgeSystem from './SpinalForgeSystem';
const Q = require('q');
import { FileVersionModel } from 'spinal-model-file_version_model';

FileVersionModel;

if (!process.env.CLIENT_ID) {
  console.log('default config');
  process.env.SPINAL_USER_ID = '168';
  process.env.SPINAL_PASSWORD = 'JHGgcz45JKilmzknzelf65ddDadggftIO98P';
  process.env.SPINALHUB_IP = 'localhost';
  process.env.SPINALHUB_PORT = '7777';
}

const connectOpt = `http://${process.env.SPINAL_USER_ID}:${process.env.SPINAL_PASSWORD}@${process.env.SPINALHUB_IP}:${process.env.SPINALHUB_PORT}/`;

const conn = spinalCore.connect(connectOpt);
const errorConnect = function (err?) {
  if (!err) console.log('Error Connect.');
  else console.log(`Error Connect : ${err}`);
  process.exit(0);
};

const waitModelReady = (file: FileVersionModel) => {
  const deferred = Q.defer();
  const interval = setInterval(() => {
    if (FileSystem._sig_server === false) {
      return false;
    }
    clearInterval(interval);
    deferred.resolve(file);
    return true;
  }, 100);

  return deferred.promise;
};

const callbackSuccess = (fileVersionModel: FileVersionModel) => {
  waitModelReady(fileVersionModel).then(
    () => {
      let filename: string = 'noname.rvt';
      if (typeof fileVersionModel.filename !== 'undefined') {
        filename = fileVersionModel.filename.get();
      }
      console.log(`new filenameVersion :${filename}`);
      new SpinalForgeSystem(fileVersionModel, filename);
    },
    (e) => {
      console.error(e);
    }
  );
};
spinalCore.load_type(conn, 'FileVersionModel', callbackSuccess, errorConnect);
