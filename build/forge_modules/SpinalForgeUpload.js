"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
const OUT_DIR = path.resolve(__dirname, '..', '..', 'tmp');
const objectsApi = new (require('forge-apis').ObjectsApi)();
objectsApi.apiClient.timeout = 300000;
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
    uploadToForge() {
        console.log('Starting to uplaod the file to forge.');
        return this.spinalForgeAuth
            .auth_and_getBucket()
            .then((oAuth) => {
            return this.uploadFile(oAuth);
        })
            .then(() => {
            return new Promise(resolve => {
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