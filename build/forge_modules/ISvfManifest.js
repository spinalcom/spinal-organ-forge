"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetType = void 0;
// schema taken from https://github.com/petrbroz/svf-utils/blob/develop/src/svf/schema.ts
var AssetType;
(function (AssetType) {
    AssetType["Image"] = "Autodesk.CloudPlatform.Image";
    AssetType["PropertyViewables"] = "Autodesk.CloudPlatform.PropertyViewables";
    AssetType["PropertyOffsets"] = "Autodesk.CloudPlatform.PropertyOffsets";
    AssetType["PropertyAttributes"] = "Autodesk.CloudPlatform.PropertyAttributes";
    AssetType["PropertyValues"] = "Autodesk.CloudPlatform.PropertyValues";
    AssetType["PropertyIDs"] = "Autodesk.CloudPlatform.PropertyIDs";
    AssetType["PropertyAVs"] = "Autodesk.CloudPlatform.PropertyAVs";
    AssetType["PropertyRCVs"] = "Autodesk.CloudPlatform.PropertyRCVs";
    AssetType["ProteinMaterials"] = "ProteinMaterials";
    AssetType["PackFile"] = "Autodesk.CloudPlatform.PackFile";
    AssetType["FragmentList"] = "Autodesk.CloudPlatform.FragmentList";
    AssetType["GeometryMetadataList"] = "Autodesk.CloudPlatform.GeometryMetadataList";
    AssetType["InstanceTree"] = "Autodesk.CloudPlatform.InstanceTree";
})(AssetType || (exports.AssetType = AssetType = {}));
//# sourceMappingURL=ISvfManifest.js.map