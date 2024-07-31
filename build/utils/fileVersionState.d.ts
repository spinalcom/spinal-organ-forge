export declare const fileVersionState: readonly ["Inital", "Send tranlation command to organ", "File downloading to Organ", "File download to Organ completed", "Uploading file to Forge", "Upload file to Forge completed", "In queue for conversion", "Converting", "Converting completed", "Download converted file", "Converted", "Failed"];
export default fileVersionState;
export declare function getStateLabel(state: number): typeof fileVersionState[number];
export declare function getState(stateLabel: typeof fileVersionState[number]): number;
