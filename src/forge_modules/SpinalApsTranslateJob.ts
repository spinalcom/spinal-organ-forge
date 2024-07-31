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

import { Region, Type, View } from "@aps_sdk/model-derivative";
import { spinalApsManager } from "./SpinalApsManager";

export default class SpinalApsTranslateJob {
  constructor(private bucketKey: string, private filename: string) { }

  // #region translateInForge
  async translateInForge(): Promise<string> {
    console.log('Starting to Translate the file to svf in forge.');
    const accessToken = await spinalApsManager.getAuthAndCreateBucket(this.bucketKey);
    const objectID = await this.getObjectIdFile(accessToken);
    const urn = this.urnify(objectID);
    const res = await spinalApsManager.modelDerivativeClient.startJob(accessToken, {
      input: {
        urn,
        compressedUrn: false,
      },
      output: {
        formats: [{
          type: Type.Svf,
          views: [View._3d, View._2d],
        }],
      },
    }, {
      region: Region.Emea,
    })
    return res.urn;
  }
  // #endregion

  // #region getObjectIdFile
  private async getObjectIdFile(accessToken: string) {
    const res = await spinalApsManager.ossClient.getObjects(this.bucketKey, accessToken, {
      limit: 20
    });
    for (const obj of res.items) {
      if (obj.objectKey === this.filename) {
        return obj.objectId;
      }
    }
    throw new Error(`File ${this.filename} not found in bucket ${this.bucketKey}`);
  }
  // #endregion

  // #region urnify
  private urnify(id: string) {
    return Buffer.from(id).toString('base64').replace(/=/g, '')
  };
  // #endregion
}
