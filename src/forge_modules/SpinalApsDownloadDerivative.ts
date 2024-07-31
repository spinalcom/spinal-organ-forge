/*
 * Copyright 2024 SpinalCom - www.spinalcom.com
 * 
 * This file is part of SpinalCore.
 * 
 * Please read all of the following terms and conditions
 * of the Software license Agreement ("Agreement")
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

import axios from 'axios';
import * as path from 'path';
import * as fse from 'fs-extra';
import { SdkManager, SdkManagerBuilder } from '@aps_sdk/autodesk-sdkmanager';
import {
  ManifestDerivativesChildren,
  ModelDerivativeClient,
  Manifest
} from '@aps_sdk/model-derivative';
import { Scopes } from '@aps_sdk/authentication';
import {
  SvfReader,
} from 'svf-utils';
import { IDownloadDerivativeOutput } from "./IDownloadDerivativeOutput";
import { IViewable } from './IViewable';
import PQueue from 'p-queue';
import { ISvfManifest, ISvfManifestAsset } from 'svf-utils/lib/svf/schema';
import { spinalApsManager } from './SpinalApsManager';

export interface IDownloadOptions {
  outputDir?: string;
  log?: (message: string) => void;
  failOnMissingAssets?: boolean;
}
export type IDownloadContext = Required<IDownloadOptions>
export interface SVFManifestDerivative {
  guid: string;
  type: string;
  role: string;
  urn: string;
  mime: string;
}

// export interface ThumbnailManifestDerivative {
//   guid: string;
//   type: string;
//   role: string;
//   urn: string;
//   resolution: [number, number];
//   mime: string;
//   status: string;
// }

export class SpinalApsDownloadDerivative {
  private sdkManager: SdkManager;
  private modelDerivativeClient: ModelDerivativeClient;

  // #region contructor
  constructor(private bucketKey: string) {
    this.sdkManager = SdkManagerBuilder.create().build();
    this.modelDerivativeClient = new ModelDerivativeClient(this.sdkManager);

  }
  // #endregion

  // #region run
  run(urn: string, options?: IDownloadOptions): Promise<IDownloadDerivativeOutput> {
    const context: IDownloadContext = {
      log: options?.log || ((message: string) => { }),
      outputDir: options?.outputDir || `viewerForgeFiles/${this.bucketKey}`,
      failOnMissingAssets: !!options?.failOnMissingAssets,
    };
    return this._download(urn, context)
  };
  // #endregion

  // #region download
  private async _download(urn: string, context: IDownloadContext): Promise<IDownloadDerivativeOutput> {
    context.log(`Downloading derivative ${urn}`);
    const accessToken = await spinalApsManager.getToken([Scopes.ViewablesRead]);
    const manifest = await this.modelDerivativeClient.getManifest(accessToken, urn);
    this.debug_output_to_file(manifest, 'manifest.json');
    const urnDir = path.join(context.outputDir || '.', 'resources');
    const viewables: IViewable[] = [];
    const {
      aec,
      // thumbnailDerivatives,
      // f2dDerivatives,
      svfDerivatives
    } = this._collectDerivatives(manifest);
    this.debug_output_to_file(aec, 'aec.json');
    // this.debug_output_to_file(thumbnailDerivatives, 'thumbnailDerivatives.json');
    // this.debug_output_to_file(f2dDerivatives, 'f2dDerivatives.json');
    this.debug_output_to_file(svfDerivatives, 'svfDerivatives.json');
    const aecPath = await this._dlAec(aec, context, urn);
    await this._dlSvfDerivatives(svfDerivatives, context, urnDir, urn, viewables);
    return {
      viewables,
      aecPath,
    }
  }
  // #endregion

  debug_output_to_file(output: any, fileName: string) {
    fse.ensureDirSync('debug');
    fse.writeFileSync(path.resolve('debug', fileName), JSON.stringify(output, null, 2));
  }

  // #region collectDerivatives
  private _collectDerivatives(manifest: Manifest): {
    aec: ManifestDerivativesChildren;
    // thumbnailDerivatives: SVFManifestDerivative[];
    // f2dDerivatives: ManifestDerivativesChildren[];
    svfDerivatives: SVFManifestDerivative[];
  } {
    let aec: ManifestDerivativesChildren;
    const svfDerivatives: SVFManifestDerivative[] = [];
    // const thumbnailDerivatives: SVFManifestDerivative[] = [];
    // const f2dDerivatives: ManifestDerivativesChildren[] = [];

    function collectDerivativesRec(derivative: ManifestDerivativesChildren) {
      if (derivative.type === 'resource' && derivative.role === 'graphics') {
        if ((derivative as any).mime === 'application/autodesk-svf')
          svfDerivatives.push(derivative as any);
        // else if ((derivative as any).mime === 'application/autodesk-f2d')
        //   f2dDerivatives.push(derivative as any);
      }
      else if (derivative.role === 'Autodesk.AEC.ModelData') aec = derivative;
      // else if (derivative.role === 'thumbnail') thumbnailDerivatives.push(derivative as any);
      if (derivative.children) {
        for (const child of derivative.children) {
          collectDerivativesRec(child);
        }
      }
    }
    for (const derivative of manifest.derivatives) {
      if (derivative.children) {
        for (const child of derivative.children) {
          collectDerivativesRec(child);
        }
      }
    }
    return {
      aec,
      // thumbnailDerivatives,
      // f2dDerivatives,
      svfDerivatives
    };
  }
  // #endregion

  // #region dlSvfDerivatives
  private async _dlSvfDerivatives(
    svfDerivatives: SVFManifestDerivative[],
    context: Required<IDownloadOptions>,
    urnDir: string,
    urn: string,
    viewables: IViewable[]
  ): Promise<void> {
    const queue = new PQueue({ concurrency: 5 });
    for (let idxDeriv = 0; idxDeriv < svfDerivatives.length; idxDeriv++) {
      const svfDerivative = svfDerivatives[idxDeriv];
      const guid = svfDerivative.guid;
      const derivativeUrn = svfDerivative.urn;
      const fileName = path.basename(derivativeUrn);
      context.log(`Downloading viewable ${guid}`);
      const outputDir = path.join(urnDir, guid);
      fse.ensureDirSync(outputDir);
      const svf = await this._dlDerivativeFile(urn, encodeURI(derivativeUrn));
      const outputPath = path.join(outputDir, fileName);
      fse.writeFileSync(outputPath, new Uint8Array(svf));

      viewables.push({
        path: path.resolve('/html', outputDir, fileName),
        name: fileName,
      });

      const reader = await SvfReader.FromDerivativeService(urn, guid, spinalApsManager.auth);
      const manifest = await reader.getManifest();
      for (let idxAsset = 0; idxAsset < manifest.assets.length; idxAsset++) {
        queue.add(this._dlDerivativeAssest.bind(this,
          manifest.assets[idxAsset], context, idxDeriv, svfDerivatives, idxAsset, manifest, reader, outputDir));
      }
    }
    await queue.onIdle();
  }
  //#endregion

  // #region dlDerivativeAssest
  private async _dlDerivativeAssest(
    asset: ISvfManifestAsset,
    context: Required<IDownloadOptions>,
    idxDeriv: number, svfDerivatives: SVFManifestDerivative[],
    idxAsset: number,
    manifest: ISvfManifest,
    reader: SvfReader,
    outputDir: string) {
    if (!asset.URI.startsWith('embed:')) {
      context.log(`viewable ${idxDeriv + 1}/${svfDerivatives.length} - Downloading asset ${idxAsset + 1}/${manifest.assets.length} ${asset.URI}`);
      try {
        const assetData = await reader.getAsset(asset.URI);
        const assetPath = path.join(outputDir, asset.URI);
        const assetFolder = path.dirname(assetPath);
        fse.ensureDirSync(assetFolder);
        fse.writeFileSync(assetPath, assetData);
      } catch (err) {
        if (context.failOnMissingAssets) {
          throw err;
        } else {
          context.log(`Could not download asset ${asset.URI}`);
        }
      }
    } else {
      context.log(`viewable ${idxDeriv + 1}/${svfDerivatives.length} - Downloading asset ${idxAsset + 1}/${manifest.assets.length} ${asset.URI} SKIP`);
    }
  }
  // #endregion

  // #region dlAec
  private async _dlAec(aec: ManifestDerivativesChildren, context: IDownloadContext, urn: string): Promise<string> {
    if (aec) {
      fse.ensureDirSync(context.outputDir);
      const urnDeriv: string = (aec as any).urn;
      const aecData = await this._dlDerivativeFile(urn, encodeURI(urnDeriv), true);
      const outputPath = path.join(context.outputDir, 'AECModelData.json')
      fse.writeFileSync(outputPath, new Uint8Array(aecData));
      return `/html/${outputPath}`
    }
  }
  // #endregion

  // #region dlDerivativeFile
  private async _dlDerivativeFile(urn: string, derivativeUrn: string, decompress: boolean = false): Promise<ArrayBuffer> {
    const accessToken = await spinalApsManager.getToken([Scopes.ViewablesRead]);
    try {
      const downloadInfo = await this.modelDerivativeClient.getDerivativeUrl(accessToken, derivativeUrn, urn);
      const response = await axios.get(downloadInfo.url as string, { responseType: 'arraybuffer', decompress });
      return response.data;
    } catch (error) {
      console.log('accessToken', accessToken);
      console.log('derivativeUrn', derivativeUrn);
      console.log('urn', urn);
      throw new Error(`Failed to download derivative ${derivativeUrn}: ${error}`);
    }
  }
  // #endregion

}