export interface IErrorDetails {
    [x: string]: any;
}
export declare class DetailedError extends Error {
    details: IErrorDetails | null;
    constructor(message: string, details?: IErrorDetails | null);
}
