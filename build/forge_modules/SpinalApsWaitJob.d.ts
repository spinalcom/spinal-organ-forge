export default class SpinalApsWaitJob {
    constructor();
    waitTranslate(urn: string): Promise<void>;
    waitTime(time: number): Promise<void>;
}
