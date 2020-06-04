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
const fs = require('fs');
const path = require('path');
const async_1 = require("async");
const OUT_DIR = path.resolve(__dirname, '..', '..', 'tmp');
const objectsApi = new (require('forge-apis').ObjectsApi)();
objectsApi.apiClient.timeout = 300000000;
function getFilesizeInBytes(filename) {
    const stats = fs.statSync(filename);
    const fileSizeInBytes = stats['size'];
    return fileSizeInBytes;
}
class SpinalForgeUpload {
    constructor(bucketKey, filename, spinalForgeAuth) {
        this.bucketKey = bucketKey;
        this.filename = filename;
        this.spinalForgeAuth = spinalForgeAuth;
    }
    uploadFile(oAuth) {
        return new Promise((resolve, reject) => {
            const filePath = path.resolve(OUT_DIR, this.filename);
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    return objectsApi.uploadObject(this.bucketKey, this.filename, data.length, data, {}, oAuth, oAuth.getCredentials()).then((res) => {
                        resolve(res.body);
                    }, (err) => {
                        reject(err);
                    });
                }
            });
        });
    }
    guid(format = 'xxxxxxxxxxxx') {
        let d = new Date().getTime();
        return format.replace(/[xy]/g, (c) => {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    }
    uploadObjectChunked(oAuth, filename, file, opts = {}) {
        return new Promise((resolve, reject) => {
            const chunkSize = opts.chunkSize || 5 * 1024 * 1024;
            const nbChunks = Math.ceil(file.size / chunkSize);
            const chunksMap = Array.from({
                length: nbChunks,
            }, (e, i) => i);
            // generates uniques session ID
            const sessionId = this.guid();
            // prepare the upload tasks
            const uploadTasks = chunksMap.map((chunkIdx) => {
                const start = chunkIdx * chunkSize;
                const end = Math.min(file.size, (chunkIdx + 1) * chunkSize) - 1;
                const range = `bytes ${start}-${end}/${file.size}`;
                const length = end - start + 1;
                const readStream = fs.createReadStream(file.path, {
                    start, end,
                });
                const run = () => __awaiter(this, void 0, void 0, function* () {
                    // uploadChunk(bucketKey, objectName, contentLength, contentRange,
                    //             sessionId, body, opts, oauth2client, credentials)
                    return objectsApi.uploadChunk(this.bucketKey, filename, length, range, sessionId, readStream, {}, oAuth, oAuth.getCredentials());
                });
                return {
                    run,
                    chunkIndex: chunkIdx,
                };
            });
            let progress = 0;
            async_1.eachLimit(uploadTasks, opts.concurrentUploads || 3, (task, callback) => {
                task.run().then((res) => {
                    if (opts.onProgress) {
                        progress += 100.0 / nbChunks;
                        opts.onProgress({
                            progress: Math.round(progress * 100) / 100,
                            chunkIndex: task.chunkIndex,
                        });
                    }
                    callback();
                }, (err) => {
                    console.log('error');
                    console.log(err);
                    callback(err);
                });
            }, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve({
                    filename,
                    nbChunks,
                    fileSize: file.size,
                    bucketKey: this.bucketKey,
                });
            });
        });
    }
    uploadToForge() {
        console.log('Starting to uplaod the file to forge.');
        return this.spinalForgeAuth
            .auth_and_getBucket()
            .then((oAuth) => {
            // return this.uploadFile(oAuth);
            const opts = {
                chunkSize: 5 * 1024 * 1024,
                concurrentUploads: 3,
                onProgress: (info) => {
                    console.log('upload info:', info);
                },
                onComplete: () => {
                    console.log('upload done');
                },
                onError: (error) => {
                    console.log('upload error:', error);
                },
            };
            const filePath = path.resolve(OUT_DIR, this.filename);
            return this.uploadObjectChunked(oAuth, this.filename, {
                size: getFilesizeInBytes(filePath),
                path: filePath,
            }, opts);
        })
            .then(() => {
            return new Promise((resolve) => {
                const filePath = path.resolve(OUT_DIR, this.filename);
                fs.unlink(filePath, () => {
                    // model.state.set("Upload to forge completed");
                    resolve();
                });
            });
        });
    }
}
exports.default = SpinalForgeUpload;
// function SpinalForgeUpload(BUCKET_KEY, file_name, spinalForgeAuth) {
//   const _self = this;
//   // this.defaultHandleError = function(err) {
//   //   model.state.set("Failed");
//   //   console.error("\x1b[31m Error:", err, "\x1b[0m");
//   // };
//   this.uploadFile = function (oAuth) {
//     const promise = function (resolve, reject) {
//       const file_path = path.resolve(__dirname, '../' + file_name);
//       fs.readFile(file_path, function (err, data) {
//         if (err) {
//           reject(err);
//         } else {
//           objectsApi
//             .uploadObject(
//               BUCKET_KEY,
//               file_name,
//               data.length,
//               data,
//               {},
//               oAuth,
//               oAuth.getCredentials(),
//             )
//             .then(
//               function (res) {
//                 resolve(res.body);
//               },
//               function (err) {
//                 reject(err);
//               },
//             );
//         }
//       });
//     };
//     return new Promise(promise);
//   };
//   this.run = function () {
//     console.log('Starting to uplaod the file to forge.');
//     return spinalForgeAuth
//       .auth_and_getBucket()
//       .then(function (oAuth) {
//         return _self.uploadFile(oAuth);
//       })
//       .then(function () {
//         return Promise(resolve => {
//           const file_path = path.resolve(__dirname, '../' + file_name);
//           fs.unlink(file_path, () => {
//             // model.state.set("Upload to forge completed");
//             resolve();
//           });
//         });
//       });
//   };
//   this.upload_to_forge = function () {
//     return _self.run();
//     // file_path = path.resolve(__dirname, "../" + file_name);
//     // console.log(file_path);
//     // console.log(" __dirname  = " + path.join(__dirname + "/../" + file_name));
//   };
// }
// module.exports = SpinalForgeUpload;
//# sourceMappingURL=SpinalForgeUpload.js.map