// SpinalForgeUpload.js

var fs = require('fs');
var path = require('path');

var ForgeSDK = require('forge-apis');
var objectsApi = new ForgeSDK.ObjectsApi();
var derivativesApi = new ForgeSDK.DerivativesApi();
var base64url = require('base64-url');

function SpinalForgeDownloadDerivative(model, BUCKET_KEY, file_name, spinalForgeAuth) {
  var _self = this;

  this.defaultHandleError = function (err) {
    model.state.set("Failed");
    console.error('\x1b[31m Error:', err, '\x1b[0m');
  }


  // this.getObjects = function(oAuth) {
  //   console.log("**** Uploading file List in the bucket.");
  //   var promise = function(resolve, reject) {
  //     file_path = path.resolve(__dirname, "../" + file_name);
  //     fs.readFile(file_path, function(err, data) {
  //       if (err) {
  //         reject(err);
  //       } else {
  //         objectsApi.getObjects(BUCKET_KEY, {}, oAuth, oAuth.getCredentials())
  //           .then(function(res) {
  //             resolve({
  //               auth: oAuth,
  //               res: res.body.items
  //             });
  //           }, function(err) {
  //             reject(err);
  //           });
  //       }
  //     });
  //   };
  //   return new Promise(promise);
  // }
  //
  // this.convertObj = function(oAuth, obj) {
  //   var job = {
  //     input: {
  //       'urn': base64url.encode(obj.objectId)
  //     },
  //     'output': {
  //       "formats": [{
  //         'type': "svf",
  //         'views': ['3d', '2d']
  //       }, ]
  //     }
  //   }
  //
  //   if (path.extname(file_name).toLowerCase() === '.zip') {
  //     job.input.compressedUrn = true;
  //     idx = file_name.lastIndexOf('.zip');
  //     job.input.rootFilename = file_name.slice(0, idx);
  //   }
  //
  //   return new Promise(function(resolve, reject) {
  //     console.log("**** Translate");
  //     derivativesApi.translate(job, {
  //         'xAdsForce': true
  //       }, oAuth, oAuth.getCredentials())
  //       .then(function(res) {
  //         resolve({
  //           auth: oAuth,
  //           res: res.body
  //         });
  //       }, function(err) {
  //         reject(err);
  //       });
  //   })
  // }


  this.get_svf_item = function (item) {
    console.log("******* get_svf_item : ", item.name.get());
    if (item.role && item.role.get() == "graphics" &&
      item.mime && item.mime.get() == "application/autodesk-svf") {
      urn = item.urn;
      console.log(urn);
      return urn.get();
    }
    for (var i = 0; i < item._children.length; i++) {
      urn = _self.get_svf_item(item._children[i]);
      if (urn)
        return urn;
    }
    return false;
  }

  this.run = function () {
    spinalForgeAuth.auth_and_getBucket()
      .then(function (oAuth) {
        console.log(model._children[0]);
        urn = _self.get_svf_item(model._children[0]) // TEST
        console.log("result urn = ", urn);

        derivativesApi.getDerivativeManifest(model.urn.get(), urn, {}, oAuth, oAuth.getCredentials())
          .then(function (res) {

            console.log(res);
            fs.writeFile("test.svf", res.body, function (err) {
              if (err) {
                return console.log(err);
              }
              console.log("download done.");
            })


          }, _self.defaultHandleError)

        // return _self.getObjects(oAuth);
      }, _self.defaultHandleError)
    // .then(function(res) {
    //   list = res.res;
    //   console.log(list);
    //   for (var i = 0; i < list.length; i++) {
    //     if (list[i].objectKey == file_name) {
    //       return _self.convertObj(res.auth, list[i]);
    //     }
    //   }
    // }, _self.defaultHandleError)
    // .then(function(res) {
    //   console.log(res);
    //   model.state.set("Translating");
    // }, _self.defaultHandleError)
  }




  this.get_forge_models = function () {
    console.log("Starting to Download the file svf in forge and upload it to the SpinalCore.");
    // _self.run()



    // file_path = path.resolve(__dirname, "../" + file_name);
    // console.log(file_path);
    // console.log(" __dirname  = " + path.join(__dirname + "/../" + file_name));
  }
}


module.exports = SpinalForgeDownloadDerivative;