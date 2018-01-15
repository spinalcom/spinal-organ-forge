// SpinalForgeUpload.js

var fs = require('fs');
var path = require('path');
// const config = new(require('../SpinalConfig'));

var ForgeSDK = require('forge-apis');
var objectsApi = new ForgeSDK.ObjectsApi();
var derivativesApi = new ForgeSDK.DerivativesApi();
var base64url = require('base64-url');
var ForgeFileDerivativesItem = require('spinal-lib-forgefile').ForgeFileDerivativesItem;

function SpinalForgeWaitTranslate(model, BUCKET_KEY, file_name, spinalForgeAuth) {
  var _self = this;

  this.defaultHandleError = function (err) {
    model.state.set("Failed");
    console.error('\x1b[31m Error:', err, '\x1b[0m');
  };

  this.getManifest = function (oAuth, urn) {
    console.log("**** getManifest");

    return new Promise(function (resolve, reject) {
      derivativesApi.getManifest(urn, null, oAuth, oAuth.getCredentials())
        .then(function (res) {
          resolve(res.body);
        }, function (err) {
          reject(err);
        });
    });
  };

  this.save_data = function (derivatives) {
    for (var i = 0; i < derivatives.length; i++) {
      var derivative = derivatives[i];

      model.add_child(new ForgeFileDerivativesItem(derivative));
    }
  };

  this.run = function () {
    spinalForgeAuth.auth_and_getBucket()
      .then(function (oAuth) {

        var urn = model.urn.get();
        var call_success = function (callback_res) {
          console.log(callback_res);
          if (callback_res.status === "pending" || callback_res.status === "inprogress") {
            setTimeout(function () {
              _self.getManifest(oAuth, urn)
                .then(call_success, _self.defaultHandleError);
            }, 5000);
          } else {
            console.log("Translating completed ! ");
            _self.save_data(callback_res.derivatives);
            model.state.set("Translating completed");
          }
        };
        _self.getManifest(oAuth, urn)
          .then(call_success, _self.defaultHandleError);
      }, _self.defaultHandleError);
  };

  this.wait_translate = function () {
    console.log("Waiting to Translate the file to svf in forge.");
    _self.run();
  };
}

module.exports = SpinalForgeWaitTranslate;