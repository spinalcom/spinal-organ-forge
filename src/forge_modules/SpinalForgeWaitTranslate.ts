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

const derivativesApi = new (require('forge-apis').DerivativesApi)();
const q = require('q');

export default class SpinalForgeWaitTranslate {
  spinalForgeAuth: any;
  constructor(spinalForgeAuth: any) {
    this.spinalForgeAuth = spinalForgeAuth;
  }
  getManifest(oAuth: any, urn: string) {
    console.log('**** getManifest');
    return derivativesApi
      .getManifest(urn, null, oAuth, oAuth.getCredentials())
      .then((res: any) => res.body)
      .catch((err: any) => { throw err; });
  }

  waitTranslateDefer(oAuth: any, urn: string) {
    const defer = q.defer();
    const fctRepeat = (requestRes?: any) => {
      if (requestRes) {
        console.log('requestRes', JSON.stringify(requestRes, null, 2));
      }
      if (
        requestRes === undefined ||
        requestRes.status === 'pending' ||
        requestRes.status === 'inprogress'
      ) {
        // check progresss here
        if (requestRes !== undefined) {
          defer.notify(requestRes.progress);
        }
        setTimeout(() => {
          this
            .getManifest(oAuth, urn)
            .then(res => fctRepeat(res))
            .catch((err: any) => { throw err; });
        },         5000);
      } else if (requestRes.status === 'failed') {
        console.log('Error from autodesk forge!');
        for (let i = 0; i < requestRes.derivatives.length; i += 1) {
          console.log(requestRes.derivatives[i].messages);
        }
        defer.reject('Error from autodesk forge');
      } else {
        console.log('Translating completed !');
        // model.state.set("Translating completed");
        defer.resolve();
      }
    };
    fctRepeat();
    return defer.promise;
  }

  waitTranslate(urn) {
    console.log('Waiting to Translate the file to svf in forge.');
    return this.spinalForgeAuth
      .auth_and_getBucket()
      .then((oAuth) => {
        return this.waitTranslateDefer(oAuth, urn);
      }).catch((err: any) => { throw err; });

  }

}

// function SpinalForgeWaitTranslate(spinalForgeAuth) {
//   const _self = this;

//   this.getManifest = function (oAuth, urn) {
//     console.log('**** getManifest');

//     return new Promise(function (resolve, reject) {
//       derivativesApi.getManifest(urn, null, oAuth, oAuth.getCredentials()).then(
//         function (res) {
//           resolve(res.body);
//         },
//         function (err) {
//           reject(err);
//         },
//       );
//     });
//   };

//   function waitTranslate(oAuth, urn) {
//     const defer = q.defer();
//     const fctRepeat = (requestRes?) => {
//       console.log(requestRes);
//       if (
//         requestRes === undefined ||
//         requestRes.status === 'pending' ||
//         requestRes.status === 'inprogress'
//       ) {
//         // check progresss here
//         setTimeout(function () {
//           _self
//             .getManifest(oAuth, urn)
//             .then(fctRepeat);
//         },         5000);

//       } else if (requestRes.status === 'failed') {
//         console.log('Error from autodesk forge!');
//         for (let i = 0; i < requestRes.derivatives.length; i++) {
//           console.log(requestRes.derivatives[i].messages);
//         }
//         defer.reject('Error from autodesk forge');
//       } else {
//         console.log('Translating completed !');
//         // model.state.set("Translating completed");
//         defer.resolve();
//       }
//     };
//     fctRepeat();
//     return defer.promise;
//   }

//   this.run = function (urn) {
//     console.log('Waiting to Translate the file to svf in forge.');
//     spinalForgeAuth.auth_and_getBucket().then(function (oAuth) {
//       return waitTranslate(oAuth, urn);
//     });
//   };

//   this.wait_translate = function (urn) {
//     return _self.run(urn);
//   };
// }

// module.exports = SpinalForgeWaitTranslate;
