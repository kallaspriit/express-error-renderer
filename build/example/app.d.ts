/// <reference types="express" />
import * as express from "express";
export interface IErrorDetails {
    [x: string]: any;
}
export declare class DetailedError extends Error {
    details: IErrorDetails | undefined;
    constructor(message: string, details?: IErrorDetails | undefined);
}
export default function setupApp(): Promise<express.Express>;
