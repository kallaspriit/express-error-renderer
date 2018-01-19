export interface IErrorDetails {
    [x: string]: any;
}
export declare class DetailedError extends Error {
    details: IErrorDetails | undefined;
    constructor(message: string, details?: IErrorDetails | undefined);
}
