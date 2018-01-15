var ForgeSDK = require('forge-apis');
var SpinalForgeAuth = require('./forge_modules/SpinalForgeAuth');
var SpinalForgeFile = require('./forge_modules/SpinalForgeFile');
var SpinalForgeUpload = require('./forge_modules/SpinalForgeUpload');
var SpinalForgeTranslate = require('./forge_modules/SpinalForgeTranslate');
var SpinalForgeWaitTranslate = require('./forge_modules/SpinalForgeWaitTranslate');
// var SpinalForgeDownloadDerivative = require('./forge_modules/SpinalForgeDownloadDerivative');
var SpinalForgeMetadata = require('./forge_modules/SpinalForgeMetadata');



// const config = new(require('./SpinalConfig'))();

function SpinalForgeSystem(model) {
  var _self = this;
  SpinalForgeSystem.super(this, model);
  var file_name = model.name.get();
  var BUCKET_KEY;
  if (model.bucket_key && model.bucket_key.get() != "") {
    BUCKET_KEY = model.bucket_key.get();
  } else {
    BUCKET_KEY = 'spinal_' + encodeURI(file_name) + '_' + Date.now();
    model.bucket_key.set(BUCKET_KEY);
  }
  var spinalForgeFile = new SpinalForgeFile(model, file_name);
  var spinalForgeAuth = new SpinalForgeAuth(BUCKET_KEY);
  var spinalForgeUpload = new SpinalForgeUpload(model, BUCKET_KEY, file_name, spinalForgeAuth);
  var spinalForgeTranslate = new SpinalForgeTranslate(model, BUCKET_KEY, file_name, spinalForgeAuth);
  var spinalForgeWaitTranslate = new SpinalForgeWaitTranslate(model, BUCKET_KEY, file_name, spinalForgeAuth);
  // var spinalForgeDownloadDerivative = new SpinalForgeDownloadDerivative(model, BUCKET_KEY, file_name, spinalForgeAuth);
  //  var spinalForgeMetadata = new SpinalForgeMetadata(model, model_export, BUCKET_KEY, file_name, spinalForgeAuth);


  this.placeholer = function () {
    console.log("placeholer");
  };
  // model.state.set("Uploading to forge");

  _self.lastState = "";
  _self._func = [{
      state: "Uploading completed",
      func: spinalForgeFile.download_file
    },
    {
      state: "Uploading to forge",
      func: spinalForgeUpload.upload_to_forge
    },
    {
      state: "Upload to forge completed",
      func: spinalForgeTranslate.translate_in_forge
    },
    {
      state: "Translating",
      func: spinalForgeWaitTranslate.wait_translate
    },
    /*    {
          state: "Translating completed",
          func: spinalForgeMetadata.metadata
          // func: spinalForgeDownloadDerivative.get_forge_models
        },
    */
    {
      state: "Exporting",
      func: _self.placeholer
    },
    {
      state: "Export completed",
      func: _self.placeholer
    },
  ];

  this.defaultHandleError = function (err) {
    model.state.set("Failed");
    console.error('\x1b[31m Error:', err, '\x1b[0m');
  };

  this.ask_token = function () {
    if (model.ask_token && model.ask_token.get()) {
      spinalForgeAuth.auth()
        .then(function (oAuth) {
          model.oauth.set(oAuth.getCredentials().access_token);
          model.ask_token.set(false);
        }, _self.defaultHandleError);
    }
  };
  if (model.ask_token)
    model.ask_token.bind(_self.ask_token);

  this.onchange = function () {
    if (model.state || model.state.get() === _self.lastState) {
      console.log("State: " + model.state.get());
      for (var i = 0; i < _self._func.length; i++) {
        var _func = _self._func[i];
        if (_func.state == model.state.get()) {
          _self.lastState = _func.state;
          _func.func();
          return;
        }
      }
    }
  };

}


spinalCore.extend(SpinalForgeSystem, Process);

module.exports = SpinalForgeSystem;