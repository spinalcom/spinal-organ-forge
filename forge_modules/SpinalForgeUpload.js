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

var fs = require('fs');
var path = require('path');

var ForgeSDK = require('forge-apis');
var bucketsApi = new ForgeSDK.BucketsApi();
var objectsApi = new ForgeSDK.ObjectsApi();

objectsApi.apiClient.timeout = 300000;

function SpinalForgeUpload(model, BUCKET_KEY, file_name, spinalForgeAuth) {
  var _self = this;

  this.defaultHandleError = function (err) {
    model.state.set("Failed");
    console.error('\x1b[31m Error:', err, '\x1b[0m');
  };

  this.uploadFile = function (oAuth) {
    var promise = function (resolve, reject) {
      var file_path = path.resolve(__dirname, "../" + file_name);
      fs.readFile(file_path, function (err, data) {
        if (err) {
          reject(err);
        } else {
          objectsApi.uploadObject(BUCKET_KEY, file_name, data.length, data, {},
              oAuth, oAuth.getCredentials())
            .then(function (res) {
              resolve(res.body);
            }, function (err) {
              reject(err);
            });
        }
      });
    };
    return new Promise(promise);
  };

  this.run = function () {
    spinalForgeAuth.auth_and_getBucket().then(function (oAuth) {
      _self.uploadFile(oAuth).then(function (uploadRes) {
        var file_path = path.resolve(__dirname, "../" + file_name);
        fs.unlink(file_path);
        model.state.set("Upload to forge completed");
      }, _self.defaultHandleError);
    }, _self.defaultHandleError);
  };

  this.upload_to_forge = function () {
    console.log("Starting to uplaod the file to forge.");
    _self.run();
    // file_path = path.resolve(__dirname, "../" + file_name);
    // console.log(file_path);
    // console.log(" __dirname  = " + path.join(__dirname + "/../" + file_name));
  };
}


module.exports = SpinalForgeUpload;