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
const loadModelPtr_1 = require("../utils/loadModelPtr");
const nodepath = require('path');
const fs_extra_1 = require("fs-extra");
const axios_1 = require("axios");
const config_1 = require("../config");
const OUT_DIR = nodepath.resolve(__dirname, '..', '..', 'tmp');
class SpinalGetFileFromHub {
    // #region constructor
    constructor(fileVersionModel, filename) {
        this.fileVersionModel = fileVersionModel;
        this.filename = filename;
    }
    // #endregion
    // #region downloadFile
    downloadFile() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Starting to Download the File : ${this.filename}`);
            (0, fs_extra_1.ensureDirSync)(OUT_DIR);
            const path = yield (0, loadModelPtr_1.loadModelPtr)(this.fileVersionModel.ptr);
            try {
                (0, fs_extra_1.unlinkSync)(this.filename);
            }
            catch (error) {
            }
            let url;
            if (path.constructor.name === 'Path') {
                url = `${config_1.SPINALHUB_PROTOCOL}://${config_1.SPINALHUB_IP}`;
                if (config_1.SPINALHUB_PORT)
                    url += `:${process.env.SPINALHUB_PORT}/sceen/_?u=${path._server_id}`;
                else
                    url += `/sceen/_?u=${path._server_id}`;
            }
            else {
                if (path.constructor.name === 'HttpPath') {
                    url = `${path.host.get()}/file/${encodeURIComponent(path.httpRootPath.get())}/${encodeURIComponent(path.httpPath.get())}`;
                }
            }
            return this.download(url, nodepath.resolve(OUT_DIR, this.filename));
        });
    }
    // #endregion
    // #region download
    download(url, dest) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, fs_extra_1.ensureDirSync)(dest);
            const file = (0, fs_extra_1.createWriteStream)(dest);
            const res = yield (0, axios_1.default)({
                method: 'get',
                url,
                responseType: 'stream',
            });
            res.data.pipe(file);
            return new Promise((resolve, reject) => {
                res.data.pipe(file);
                let error = null;
                file.on('error', err => {
                    error = err;
                    file.close();
                    try {
                        (0, fs_extra_1.unlinkSync)(dest);
                    }
                    catch (error) {
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
        });
    }
}
exports.default = SpinalGetFileFromHub;
//# sourceMappingURL=SpinalGetFileFromHub.js.map