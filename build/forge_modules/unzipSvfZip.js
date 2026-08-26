"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unzipSvfZip = unzipSvfZip;
const fs_1 = require("fs");
const path_1 = require("path");
const Zip = require("adm-zip");
const fileVersionState_1 = require("../utils/fileVersionState");
function unzipSvfZip(filename, fileVersionModel) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const filePath = (0, path_1.join)('tmp', filename);
        if (!(0, fs_1.existsSync)(filePath)) {
            throw new Error(`File ${filePath} does not exist`);
        }
        const folderPath = createNewFolderInViewerForgeFile();
        const zip = new Zip(filePath);
        fileVersionModel.state.set((0, fileVersionState_1.getState)('Unzipping svf.zip'));
        console.log(`Unzipping svf.zip to ${folderPath}`);
        zip.extractAllTo(folderPath, true);
        // delete the svf.zip file after unzipping
        (0, fs_1.unlinkSync)(filePath);
        try {
            // find `AECModelData.json` file in the unzipped folder, may not exist
            const aecModelDataFilePath = findFileInFolder(folderPath, 'AECModelData.json');
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
                }
                else {
                    fileVersionModel.aecPath.set(sufixPath + aecModelDataFilePath);
                }
            }
            // update the fileVersionModel with the path to the unzipped folder
            if (typeof fileVersionModel.items === 'undefined') {
                fileVersionModel.add_attr('items', []);
            }
            else {
                fileVersionModel.items.clear();
            }
            for (let i = 0; i < svfFiles.length; i += 1) {
                const item = {
                    path: sufixPath + svfFiles[i],
                    name: svfFiles[i].split('/').pop() || '',
                };
                (_a = fileVersionModel.items) === null || _a === void 0 ? void 0 : _a.push(item);
            }
        }
        catch (error) {
            console.error(`Error processing unzipped files: ${error}`);
            // unlink folderPath recursively
            try {
                const deleteFolderRecursive = (path) => {
                    if ((0, fs_1.existsSync)(path)) {
                        const pathStat = (0, fs_1.lstatSync)(path);
                        if (pathStat.isSymbolicLink()) {
                            (0, fs_1.unlinkSync)(path);
                            return;
                        }
                        (0, fs_1.readdirSync)(path).forEach((file) => {
                            const curPath = (0, path_1.join)(path, file);
                            const curPathStat = (0, fs_1.lstatSync)(curPath);
                            if (curPathStat.isSymbolicLink()) {
                                (0, fs_1.unlinkSync)(curPath);
                            }
                            else if (curPathStat.isDirectory()) {
                                deleteFolderRecursive(curPath);
                            }
                            else {
                                (0, fs_1.unlinkSync)(curPath);
                            }
                        });
                        (0, fs_1.rmdirSync)(path);
                    }
                };
                deleteFolderRecursive(folderPath);
            }
            catch (deleteError) {
                console.error(`Error deleting folder ${folderPath}: ${deleteError}`);
            }
            throw error;
        }
    });
}
function findFileInFolder(folderPath, filename) {
    const files = (0, fs_1.readdirSync)(folderPath);
    for (const file of files) {
        const filePath = `${folderPath}/${file}`;
        const lstat = (0, fs_1.lstatSync)(filePath);
        if (lstat.isSymbolicLink()) {
            continue;
        }
        const stat = (0, fs_1.statSync)(filePath);
        if (stat.isDirectory()) {
            const result = findFileInFolder(filePath, filename);
            if (result) {
                return result;
            }
        }
        else if (file === filename) {
            return filePath;
        }
    }
    return null;
}
function createNewFolderInViewerForgeFile() {
    const viewerForgeFilesPath = 'viewerForgeFiles';
    // check if folder 'viewerForgeFile' exist, throw error if not
    if (!(0, fs_1.existsSync)(viewerForgeFilesPath)) {
        throw new Error(`Folder ${viewerForgeFilesPath} does not exist`);
    }
    const timestamp = Date.now();
    const newFolderPath = `${viewerForgeFilesPath}/spinal_${timestamp}`;
    (0, fs_1.mkdirSync)(newFolderPath);
    return newFolderPath;
}
function findAllSvfInFolder(folderPath) {
    const svfFiles = [];
    const files = (0, fs_1.readdirSync)(folderPath);
    for (const file of files) {
        const filePath = `${folderPath}/${file}`;
        const lstat = (0, fs_1.lstatSync)(filePath);
        if (lstat.isSymbolicLink()) {
            continue;
        }
        const stat = (0, fs_1.statSync)(filePath);
        if (stat.isDirectory()) {
            svfFiles.push(...findAllSvfInFolder(filePath));
        }
        else if (file.endsWith('.svf')) {
            svfFiles.push(filePath);
        }
    }
    return svfFiles;
}
//# sourceMappingURL=unzipSvfZip.js.map