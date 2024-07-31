export declare enum AssetType {
    Image = "Autodesk.CloudPlatform.Image",
    PropertyViewables = "Autodesk.CloudPlatform.PropertyViewables",
    PropertyOffsets = "Autodesk.CloudPlatform.PropertyOffsets",
    PropertyAttributes = "Autodesk.CloudPlatform.PropertyAttributes",
    PropertyValues = "Autodesk.CloudPlatform.PropertyValues",
    PropertyIDs = "Autodesk.CloudPlatform.PropertyIDs",
    PropertyAVs = "Autodesk.CloudPlatform.PropertyAVs",
    PropertyRCVs = "Autodesk.CloudPlatform.PropertyRCVs",
    ProteinMaterials = "ProteinMaterials",
    PackFile = "Autodesk.CloudPlatform.PackFile",
    FragmentList = "Autodesk.CloudPlatform.FragmentList",
    GeometryMetadataList = "Autodesk.CloudPlatform.GeometryMetadataList",
    InstanceTree = "Autodesk.CloudPlatform.InstanceTree"
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
