"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
// const SpinalForgeSystem = require('./SpinalForgeSystem');
const SpinalForgeSystem_1 = require("./SpinalForgeSystem");
const Q = require('q');
const spinal_model_file_version_model_1 = require("spinal-model-file_version_model");
console.log(spinal_model_file_version_model_1.FileVersionModel);
if (!process.env.CLIENT_ID) {
    console.log('default config');
    process.env.SPINAL_USER_ID = '168';
    process.env.SPINAL_PASSWORD = 'JHGgcz45JKilmzknzelf65ddDadggftIO98P';
    process.env.SPINALHUB_IP = 'localhost';
    process.env.SPINALHUB_PORT = '7777';
}
const connectOpt = `http://${process.env.SPINAL_USER_ID}:${process.env.SPINAL_PASSWORD}@${process.env.SPINALHUB_IP}:${process.env.SPINALHUB_PORT}/`;
const conn = spinal_core_connectorjs_type_1.spinalCore.connect(connectOpt);
// FileSystem._disp = true;
const errorConnect = function (err) {
    if (!err)
        console.log('Error Connect.');
    else
        console.log(`Error Connect : ${err}`);
    process.exit(0);
};
const waitModelReady = (file) => {
    const deferred = Q.defer();
    const waitModelReadyLoop = (f, defer) => {
        if (spinal_core_connectorjs_type_1.FileSystem._sig_server === false) {
            setTimeout(() => {
                defer.resolve(waitModelReadyLoop(f, defer));
            }, 100);
        }
        else {
            defer.resolve(f);
        }
        return defer.promise;
    };
    return waitModelReadyLoop(file, deferred);
};
const callbackSuccess = (fileVersionModel) => {
    waitModelReady(fileVersionModel).then(() => {
        let filename = 'noname.rvt';
        if (typeof fileVersionModel.filename !== 'undefined') {
            filename = fileVersionModel.filename.get();
        }
        console.log(`new filenameVersion :${filename}`);
        new SpinalForgeSystem_1.default(fileVersionModel, filename);
    }, (e) => {
        console.error(e);
    });
};
spinal_core_connectorjs_type_1.spinalCore.load_type(conn, 'FileVersionModel', callbackSuccess, errorConnect);
//# sourceMappingURL=index.js.map