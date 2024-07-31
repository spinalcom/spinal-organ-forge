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
const spinal_core_connectorjs_1 = require("spinal-core-connectorjs");
const SpinalForgeSystem_1 = require("./SpinalForgeSystem");
const spinal_model_file_version_model_1 = require("spinal-model-file_version_model");
const config_1 = require("./config");
// so it's not cut from the build.
spinal_model_file_version_model_1.FileVersionModel;
function main() {
    let connectOpt = `${config_1.SPINALHUB_PROTOCOL}://${config_1.SPINAL_USER_ID}:${config_1.SPINAL_PASSWORD}@${config_1.SPINALHUB_IP}`;
    if (config_1.SPINALHUB_PORT)
        connectOpt += `:${config_1.SPINALHUB_PORT}/`;
    else
        connectOpt += '/';
    const conn = spinal_core_connectorjs_1.spinalCore.connect(connectOpt);
    spinal_core_connectorjs_1.spinalCore.load_type(conn, 'FileVersionModel', callbackSuccess, errorConnect);
}
main();
function errorConnect(err) {
    if (!err)
        console.log('Error Connect.');
    else
        console.log(`Error Connect : ${err}`);
    process.exit(0);
}
;
function waitModelReady(file) {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (spinal_core_connectorjs_1.FileSystem._sig_server === false) {
                return false;
            }
            clearInterval(interval);
            resolve(file);
            return true;
        }, 100);
    });
}
;
function callbackSuccess(fileVersionModel) {
    return __awaiter(this, void 0, void 0, function* () {
        yield waitModelReady(fileVersionModel);
        let filename = 'noname.rvt';
        if (typeof fileVersionModel.filename !== 'undefined') {
            filename = fileVersionModel.filename.get();
        }
        console.log(`new filenameVersion :${filename}`);
        new SpinalForgeSystem_1.default(fileVersionModel, filename);
    });
}
;
//# sourceMappingURL=index.js.map