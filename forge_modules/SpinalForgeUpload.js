// SpinalForgeUpload.js

var fs = require('fs');
var path = require('path');
// const config = new(require('../SpinalConfig'));

var ForgeSDK = require('forge-apis');
var bucketsApi = new ForgeSDK.BucketsApi();
var objectsApi = new ForgeSDK.ObjectsApi();

objectsApi.apiClient.timeout = 300000;

function SpinalForgeUpload(model, BUCKET_KEY, file_name, spinalForgeAuth) {
  var _self = this;

  this.defaultHandleError = function (err) {
    model.state.set("Failed");
    console.error('\x1b[31m Error:', err, '\x1b[0m');
  }

  this.uploadFile = function (oAuth) {
    var promise = function (resolve, reject) {
      file_path = path.resolve(__dirname, "../" + file_name);
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
            })
        }
      });
    };
    return new Promise(promise)
  }

  this.run = function () {
    spinalForgeAuth.auth_and_getBucket().then(function (oAuth) {
      _self.uploadFile(oAuth).then(function (uploadRes) {
        file_path = path.resolve(__dirname, "../" + file_name);
        fs.unlink(file_path);
        model.state.set("Upload to forge completed");
      }, _self.defaultHandleError)
    }, _self.defaultHandleError)
  }

  this.upload_to_forge = function () {
    console.log("Starting to uplaod the file to forge.");
    _self.run()
    // file_path = path.resolve(__dirname, "../" + file_name);
    // console.log(file_path);
    // console.log(" __dirname  = " + path.join(__dirname + "/../" + file_name));
  }
}


module.exports = SpinalForgeUpload;