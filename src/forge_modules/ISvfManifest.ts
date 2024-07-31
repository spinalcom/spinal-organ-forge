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

// schema taken from https://github.com/petrbroz/svf-utils/blob/develop/src/svf/schema.ts

export enum AssetType {
  Image = 'Autodesk.CloudPlatform.Image',
  PropertyViewables = 'Autodesk.CloudPlatform.PropertyViewables',
  PropertyOffsets = 'Autodesk.CloudPlatform.PropertyOffsets',
  PropertyAttributes = 'Autodesk.CloudPlatform.PropertyAttributes',
  PropertyValues = 'Autodesk.CloudPlatform.PropertyValues',
  PropertyIDs = 'Autodesk.CloudPlatform.PropertyIDs',
  PropertyAVs = 'Autodesk.CloudPlatform.PropertyAVs',
  PropertyRCVs = 'Autodesk.CloudPlatform.PropertyRCVs',
  ProteinMaterials = 'ProteinMaterials',
  PackFile = 'Autodesk.CloudPlatform.PackFile',
  FragmentList = 'Autodesk.CloudPlatform.FragmentList',
  GeometryMetadataList = 'Autodesk.CloudPlatform.GeometryMetadataList',
  InstanceTree = 'Autodesk.CloudPlatform.InstanceTree'
}
export interface ISvfManifest {
  name: string;
  manifestversion: number;
  toolkitversion: string;
  assets: ISvfManifestAsset[];
  typesets: ISvfManifestTypeSet[];
}
export interface ISvfManifestAsset {
  id: string;
  type: AssetType;
  typeset?: string;
  URI: string;
  size: number;
  usize: number;
}
export interface ISvfManifestTypeSet {
  id: string;
  types: ISvfManifestType[];
}
export interface ISvfManifestType {
  class: string;
  type: string;
  version: number;
}
