var fs = require('fs');
// const config = new(require('../SpinalConfig'));
var ForgeSDK = require('forge-apis');
var bucketsApi = new ForgeSDK.BucketsApi();
var path = require('path');

function SpinalForgeAuth(BUCKET_KEY) {
  var _self = this;
  this.oAuth2TwoLegged = 0;
  _self.loggedIn = false;

  this.getBucketDetails = function (bucketKey) {
    console.log("**** Getting bucket details : " + bucketKey);

    console.log('oauth 2 legged');
    console.log(this.oAuth2TwoLegged);

    console.log('oauth 2 legged 2');
    console.log(this.oAuth2TwoLegged.getCredentials());

    return bucketsApi.getBucketDetails(bucketKey, this.oAuth2TwoLegged, this.oAuth2TwoLegged.getCredentials());
  };

  this.createBucket = function (bucketKey) {
    console.log("**** Creating Bucket : " + bucketKey);
    var createBucketJson = {
      'bucketKey': bucketKey,
      'policyKey': 'temporary'
    };
    return bucketsApi.createBucket(createBucketJson, {}, this.oAuth2TwoLegged, this.oAuth2TwoLegged.getCredentials());
  };

  this.createBucketIfNotExist = function (bucketKey) {
    console.log("**** Creating bucket if not exist :", bucketKey);
    return new Promise(function (resolve, reject) {
      _self.getBucketDetails(bucketKey).then(function (resp) {
          resolve(resp);
        },
        function (err) {
          console.log(err);
          if (err.statusCode === 404) {
            _self.createBucket(bucketKey).then(function (res) {
                resolve(res);
              },
              function (err) {
                reject(err);
              })
          } else {
            reject(err);
          }
        });
    });
  };

  this.auth = function () {
    var promise = function (resolve, reject) {
      _self.oAuth2TwoLegged = new ForgeSDK.AuthClientTwoLegged(process.env.CLIENT_ID,
        process.env.CLIENT_SECRET, [
          'data:read', 'data:write', 'data:create', 'data:search',
          'bucket:create', 'bucket:read', 'bucket:update'
        ], true);

      _self.oAuth2TwoLegged.authenticate().then(function (credentials) {
          console.log("**** Got Credentials", credentials);
          resolve(_self.oAuth2TwoLegged);
        },
        function (err) {
          reject(err);
        });
    }
    return new Promise(promise);
  }

  this.auth_and_getBucket = function () {
    console.log("*** auth_and_getBucket");
    var promise = function (resolve, reject) {
      // if (_self.loggedIn == true) {
      //   resolve(_self.oAuth2TwoLegged);
      //   return;
      // }
      // _self.oAuth2TwoLegged = new ForgeSDK.AuthClientTwoLegged(config.forge.client_id,
      //   config.forge.client_secret, [
      //     'data:read', 'data:write', 'data:create', 'data:search',
      //     'bucket:create', 'bucket:read', 'bucket:update'
      //   ], true);

      // _self.oAuth2TwoLegged.authenticate().then(function (credentials) {
      //     console.log("**** Got Credentials", credentials);
      _self.auth().then(function () {
        return _self.createBucketIfNotExist(BUCKET_KEY).then(function (createBucketRes) {
            _self.loggedIn = true;
            resolve(_self.oAuth2TwoLegged);
          },
          function (err) {
            reject(err);
          });
      })
      // },
      // function (err) {
      //   reject(err);
      // })
    }
    return new Promise(promise);
  }
}

module.exports = SpinalForgeAuth;