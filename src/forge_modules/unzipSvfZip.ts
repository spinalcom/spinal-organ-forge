/*
 * Copyright 2026 SpinalCom - www.spinalcom.com
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

import type { FileVersionModel } from 'spinal-model-file_version_model';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  unlinkSync,
  readdirSync,
  statSync,
  rmdirSync,
} from 'fs';
import { join } from 'path';
import * as Zip from 'adm-zip';
import type { IViewable } from './IViewable';
import { getState } from '../utils/fileVersionState';

export async function unzipSvfZip(
  filename: string,
  fileVersionModel: FileVersionModel
): Promise<void> {
  const filePath = join('tmp', filename);
  if (!existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }
  const folderPath = createNewFolderInViewerForgeFile();
  const zip = new Zip(filePath);
  fileVersionModel.state.set(getState('Unzipping svf.zip'));

  console.log(`Unzipping svf.zip to ${folderPath}`);
  zip.extractAllTo(folderPath, true);

  // delete the svf.zip file after unzipping
  unlinkSync(filePath);

  try {
    // find `AECModelData.json` file in the unzipped folder, may not exist
    const aecModelDataFilePath = findFileInFolder(
      folderPath,
      'AECModelData.json'
    );
    // find all .svf file in the unzipped folder (posible multiple .svf files)
    const svfFiles = findAllSvfInFolder(folderPath);
    if (svfFiles.length === 0) {
      throw new Error(`No .svf files found in ${folderPath}`);
    }
    console.log(`Found .svf files: ${svfFiles.join(', ')}`);
    const sufixPath = '/html/';
    if (aecModelDataFilePath) {
      console.log(`Found AECModelData.json file: ${aecModelDataFilePath}`);
      // update the fileVersionModel with the aecModelDataFilePath
      if (typeof fileVersionModel.aecPath === 'undefined') {
        fileVersionModel.add_attr('aecPath', sufixPath + aecModelDataFilePath);
      } else {
        fileVersionModel.aecPath.set(sufixPath + aecModelDataFilePath);
      }
    }
    // update the fileVersionModel with the path to the unzipped folder
    if (typeof fileVersionModel.items === 'undefined') {
      fileVersionModel.add_attr('items', []);
    } else {
      fileVersionModel.items.clear();
    }
    for (let i = 0; i < svfFiles.length; i += 1) {
      const item: IViewable = {
        path: sufixPath + svfFiles[i],
        name: svfFiles[i].split('/').pop() || '',
      };
      fileVersionModel.items?.push(item);
    }
  } catch (error) {
    console.error(`Error processing unzipped files: ${error}`);
    // unlink folderPath recursively
    try {
      const deleteFolderRecursive = (path: string) => {
        if (existsSync(path)) {
          const pathStat = lstatSync(path);
          if (pathStat.isSymbolicLink()) {
            unlinkSync(path);
            return;
          }
          readdirSync(path).forEach((file) => {
            const curPath = join(path, file);
            const curPathStat = lstatSync(curPath);
            if (curPathStat.isSymbolicLink()) {
              unlinkSync(curPath);
            } else if (curPathStat.isDirectory()) {
              deleteFolderRecursive(curPath);
            } else {
              unlinkSync(curPath);
            }
          });
          rmdirSync(path);
        }
      };
      deleteFolderRecursive(folderPath);
    } catch (deleteError) {
      console.error(`Error deleting folder ${folderPath}: ${deleteError}`);
    }
    throw error;
  }
}

function findFileInFolder(folderPath: string, filename: string): string | null {
  const files = readdirSync(folderPath);
  for (const file of files) {
    const filePath = `${folderPath}/${file}`;
    const lstat = lstatSync(filePath);
    if (lstat.isSymbolicLink()) {
      continue;
    }
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      const result = findFileInFolder(filePath, filename);
      if (result) {
        return result;
      }
    } else if (file === filename) {
      return filePath;
    }
  }
  return null;
}

function createNewFolderInViewerForgeFile() {
  const viewerForgeFilesPath = 'viewerForgeFiles';
  // check if folder 'viewerForgeFile' exist, throw error if not
  if (!existsSync(viewerForgeFilesPath)) {
    throw new Error(`Folder ${viewerForgeFilesPath} does not exist`);
  }
  const timestamp = Date.now();
  const newFolderPath = `${viewerForgeFilesPath}/spinal_${timestamp}`;
  mkdirSync(newFolderPath);
  return newFolderPath;
}

function findAllSvfInFolder(folderPath: string): string[] {
  const svfFiles: string[] = [];
  const files = readdirSync(folderPath);
  for (const file of files) {
    const filePath = `${folderPath}/${file}`;
    const lstat = lstatSync(filePath);
    if (lstat.isSymbolicLink()) {
      continue;
    }
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      svfFiles.push(...findAllSvfInFolder(filePath));
    } else if (file.endsWith('.svf')) {
      svfFiles.push(filePath);
    }
  }
  return svfFiles;
}
