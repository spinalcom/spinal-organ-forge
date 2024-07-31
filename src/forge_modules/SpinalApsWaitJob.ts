/*
 * Copyright 2024 SpinalCom - www.spinalcom.com
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

import { Scopes } from "@aps_sdk/authentication";
import { spinalApsManager } from "./SpinalApsManager";

export default class SpinalApsWaitJob {

  constructor() { }

  // #region waitTranslate
  async waitTranslate(urn: string) {
    console.log('Waiting to Translate the file to svf in forge.');
    while (true) {
      await this.waitTime(10000);
      const access_token = await spinalApsManager.getToken([
        Scopes.DataRead, Scopes.BucketRead,
      ])
      const manifest = await spinalApsManager.modelDerivativeClient.getManifest(access_token, urn);

      if (manifest.status === 'success' && manifest.progress === 'complete') {
        console.log('Translating completed !');
        break;
      }
      if (manifest.status === 'failed') {
        console.error('Error from autodesk forge!');
        for (const derivative of manifest.derivatives) {
          console.error(derivative.messages);
        }
        break;
      }
    }
    console.log('Translating completed !');
  }
  // #endregion

  // #region waitTime
  waitTime(time: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }
  // #endregion
}
