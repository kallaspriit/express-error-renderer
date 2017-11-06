/// <reference types="express" />
import { ErrorRequestHandler } from 'express';
export declare type FormatXhrErrorFn = (error: Error, options: IOptions) => IJsonPayload;
export interface IJsonPayload {
    [x: string]: string | string[] | number | boolean | null;
}
export interface IOptions {
    basePath: string;
    showDetails: boolean;
    formatXhrError?: FormatXhrErrorFn;
}
export interface IErrorDetails {
    title?: string;
    message?: string;
}
export interface IErrorRest {
    [x: string]: any;
}
export default function expressErrorRenderer(userOptions?: Partial<IOptions>): ErrorRequestHandler;
export declare function formatXhrError(error: Error, options: IOptions): IJsonPayload;
export declare function renderError(details?: IErrorDetails): string;
