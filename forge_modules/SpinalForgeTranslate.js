// SpinalForgeUpload.js

var fs = require('fs');
var path = require('path');
// const config = new(require('../SpinalConfig'));

var ForgeSDK = require('forge-apis');
var objectsApi = new ForgeSDK.ObjectsApi();
var derivativesApi = new ForgeSDK.DerivativesApi();
var base64url = require('base64-url');

function SpinalForgeTranslate(model, BUCKET_KEY, file_name, spinalForgeAuth) {
  var _self = this;

  this.defaultHandleError = function (err) {
    model.state.set("Failed");
    console.error('\x1b[31m Error:', err, '\x1b[0m');
  };


  this.getObjects = function (oAuth) {
    console.log("**** Uploading file List in the bucket.");
    var promise = function (resolve, reject) {
      file_path = path.resolve(__dirname, "../" + file_name);
      objectsApi.getObjects(BUCKET_KEY, {}, oAuth, oAuth.getCredentials())
        .then(function (res) {
          resolve({
            auth: oAuth,
            res: res.body.items
          });
        }, function (err) {
          reject(err);
        });
    };
    return new Promise(promise);
  };

  this.convertObj = function (oAuth, obj) {
    var job = {
      input: {
        'urn': base64url.encode(obj.objectId)
      },
      'output': {
        "formats": [{
          'type': "svf",
          'views': ['3d', '2d']
        }, ]
      }
    };

    if (path.extname(file_name).toLowerCase() === '.zip') {
      job.input.compressedUrn = true;
      var idx = file_name.lastIndexOf('.zip');
      job.input.rootFilename = file_name.slice(0, idx);
    }

    return new Promise(function (resolve, reject) {
      console.log("**** Translate");
      derivativesApi.translate(job, {
          'xAdsForce': true
        }, oAuth, oAuth.getCredentials())
        .then(function (res) {
          resolve({
            auth: oAuth,
            res: res.body
          });
        }, function (err) {
          reject(err);
        });
    });
  };


  this.run = function () {
    spinalForgeAuth.auth_and_getBucket()
      .then(function (oAuth) {
        return _self.getObjects(oAuth);
      }, _self.defaultHandleError)
      .then(function (res) {
        var list = res.res;
        console.log(list);
        for (var i = 0; i < list.length; i++) {
          if (list[i].objectKey == file_name) {
            return _self.convertObj(res.auth, list[i]);
          }
        }
      }, _self.defaultHandleError)
      .then(function (res) {
        console.log(res);
        model.urn.set(res.res.urn);
        model.state.set("Translating");
      }, _self.defaultHandleError);
  };




  this.translate_in_forge = function () {
    console.log("Starting to Translate the file to svf in forge.");
    _self.run();
    // file_path = path.resolve(__dirname, "../" + file_name);
    // console.log(file_path);
    // console.log(" __dirname  = " + path.join(__dirname + "/../" + file_name));
  };
}


module.exports = SpinalForgeTranslate;