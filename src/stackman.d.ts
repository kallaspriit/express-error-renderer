declare module 'stackman' {
	function stackman(options?: stackman.IOptions): stackman.IStackMan;

	namespace stackman {
		export interface IStackMan {
			callsites: (error: Error, options: ICallsitesOptions, cb: ICallsitesCallback) => void;
			sourceContexts: (callsites: ICallsite[], options: ICallsiteContextOptions, cb: ISourceContextsCallback) => void;
		}

		export type ICallsitesCallback = (error: Error, callsites: ICallsite[]) => void;

		export type ISourceContextsCallback = (error: Error, contexts: ICallsiteContext[]) => void;

		export interface ICallsitesOptions {
			sourcemap: boolean;
		}

		export interface ICallsiteContextOptions {
			lines: number;
		}

		export type SourceContextCallback = (error: Error, context: ICallsiteContext) => void;

		export interface ICallsite {
			getTypeName(): string;
			getTypeNameSafely(): string;
			getFunction(): string;
			getFunctionName(): string;
			getFunctionNameSanitized(): string;
			getMethodName(): string;
			getFileName(): string;
			getRelativeFileName(): string;
			getLineNumber(): number;
			getColumnNumber(): number;
			getModuleName(): string;
			isToplevel(): boolean;
			isEval(): boolean;
			isNative(): boolean;
			isConstructor(): boolean;
			isApp(): boolean;
			isModule(): boolean;
			isNode(): boolean;
			sourceContext(options: ICallsiteContextOptions, cb: SourceContextCallback): void;
		}

		export interface ICallsiteContext {
			pre: string[];
			line: string;
			post: string[];
		}

		export interface IOptions {
			fileCacheMax?: number;
			sourceMapCacheMax?: number;
		}
	}

	export = stackman;
}
