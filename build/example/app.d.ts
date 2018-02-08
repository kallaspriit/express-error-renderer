/// <reference types="express" />
import * as express from "express";
import { IOptions } from "../";
export interface IErrorDetails {
    [x: string]: any;
}
export declare class DetailedError extends Error {
    details: IErrorDetails | undefined;
    constructor(message: string, details?: IErrorDetails | undefined);
}
export default function setupApp(userOptions?: Partial<IOptions>): Promise<express.Express>;
