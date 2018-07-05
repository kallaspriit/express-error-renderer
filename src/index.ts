import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import * as fs from "fs";
import * as HttpStatus from "http-status-codes";
import * as path from "path";
import * as stackman from "stackman";

export type FormatXhrErrorFn = (error: Error, options: IOptions) => IJsonPayload;

export interface IJsonPayload {
  [x: string]: string | string[] | number | boolean | null | undefined;
}

export interface IOptions {
  basePath: string;
  debug: boolean;
  showMessage: boolean;
  formatXhrError?: FormatXhrErrorFn;
}

export interface IErrorDetails {
  title: string;
  message: string;
}

export interface IErrorRest {
  // tslint:disable-next-line:no-any
  [x: string]: any;
}

export default function expressErrorRenderer(userOptions: Partial<IOptions> = {}): ErrorRequestHandler {
  const options: IOptions = {
    basePath: path.join(__dirname, "..", ".."),
    debug: true,
    showMessage: true,
    ...userOptions,
  };

  return (error: Error, request: Request, response: Response, next: NextFunction) => {
    // delegate to express default handler that closes the connection and fails the request if headers already sent
    if (response.headersSent) {
      next(error);

      return;
    }

    // respond to xhr requests with json (true if X-Requested-With header equals XMLHttpRequest)
    if (request.xhr) {
      // use user-provided formatter if available
      const payload: IJsonPayload = options.formatXhrError
        ? options.formatXhrError(error, options)
        : formatXhrError(error, options);

      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(payload);

      return;
    }

    // show simple error view if details are disabled
    if (!options.debug) {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(options.showMessage ? error.message : "Internal error occurred");

      return;
    }

    // using stackman for getting details stack traces
    const resolver = stackman();

    // attempt to get error callsites
    resolver.callsites(error, { sourcemap: true }, (callsitesError, callsites) => {
      // handle callsites failure
      // tslint:disable-next-line:strict-boolean-expressions
      if (callsitesError) {
        response
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send(options.showMessage ? error.message : "Internal error occurred");

        return;
      }

      // ignore files in node_modules
      const filteredCallsites = callsites.filter(callsite => {
        const filename = callsite.getFileName();

        /* istanbul ignore if */
        // tslint:disable-next-line:strict-boolean-expressions
        if (!filename) {
          return false;
        }

        // only render traces for project files
        return isProjectTrace(options.basePath, filename);
      });

      // fetch source contexts
      resolver.sourceContexts(filteredCallsites, { lines: 20 }, (contextsError, contexts) => {
        /* istanbul ignore if */
        // tslint:disable-next-line:strict-boolean-expressions
        if (contextsError) {
          // getting source contexts failed for some reason, show simple error
          response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .send(options.showMessage ? error.message : "Internal error occurred");

          return;
        }

        // render stack frames
        const renderedStackFrames = filteredCallsites.map((callsite, index) =>
          renderStackFrame(index, callsite, options.basePath, contexts[index]),
        );

        // send the error page response
        response
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send(renderErrorPage(error, renderedStackFrames, options.basePath));
      });
    });
  };
}

export function formatXhrError(error: Error, options: IOptions): IJsonPayload {
  if (options.debug) {
    const { name, message, stack, ...errorRest } = error;

    return {
      error: error.message,
      stack: typeof stack === "string" ? stack.split("\n").map(line => line.trim()) : [],
      ...errorRest,
    };
  } else {
    return {
      error: "Internal error occurred",
    };
  }
}

function isProjectTrace(basePath: string, line: string) {
  return line.indexOf(basePath) !== -1 && line.indexOf("node_modules") === -1;
}

function renderErrorPage(error: Error, stackFrames: string[], basePath: string): string {
  const { name, message, stack, ...errorDetails } = error;

  return `
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Error</title>

      <style>${fs.readFileSync(path.join(__dirname, "..", "static", "prism.css"), "utf8")}</style>
      <script>${fs.readFileSync(path.join(__dirname, "..", "static", "prism.js"), "utf8")}</script>

      <style>
        body {
          background-color: #252526;
          color: #FFF;
          margin: 0;
          padding: 20px;
        }
        .error-message {
          font-family: Consolas, fixed;
          font-size: 120%;
          margin-bottom: 20px;
          border-radius: 5px 5px 0 0;
          display: flex;
          overflow: hidden;
        }
        .error-message__name {
          padding: 20px;
          background-color: #600;
        }
        .error-message__message {
          padding: 20px;
          background-color: #900;
          flex-grow: 1;
        }
        .error-info {
          background-color: #1E1E1E;
          border-radius: 0 0 5px 5px;
          margin-bottom: 20px;
        }
        .error-details {
          white-space: pre;
          font-family: Consolas, fixed;
          font-size: 80%;
          padding: 20px;
          background-color: #111;
        }
        .stack-trace {
          font-family: Consolas, fixed;
          padding: 20px;
        }
        .stack-line {

        }
        .stack-line__match,
        .stack-line__column {
          display: none;
        }
        .stack-frame {
          background-color: #1E1E1E;
          padding: 0;
          margin-bottom: 20px;
          border-radius: 5px;
          overflow: hidden;
        }
        .source-file {
          font-weight: bold;
          font-family: Consolas, fixed;
          padding: 8px 10px;
          background-color: #000;
        }
        .source-file__filename {
          text-decoration: underline;
        }
        .source-lines {
          font-family: Consolas, fixed;
          padding: 0;
          margin: 0;
          color: #5A5A5A;
        }
        .source-lines__line {
          padding: 5px 10px;
          margin: 0;
          white-space: pre;
          list-style: decimal inside none;
        }
        .source-lines__line span {
          color: #FFF;
        }
        .source-lines__line--main {
          background-color: #111;
        }
        .no-context {
          padding: 20px;
        }
        .source-code {
          padding-left: 0 !important;
          margin: 0 !important;
          background-color: transparent !important;
        }
        .source-code code {
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="error-info">
        <div class="error-message">
          <div class="error-message__name">${name}</div>
          <div class="error-message__message">${message}</div>
        </div>
        ${renderStackTrace(stack, basePath)}
        ${Object.keys(errorDetails).length > 0 ? renderErrorDetails(errorDetails) : ""}
      </div>
      ${stackFrames.join("\n")}
    </body>
    </html>
  `;
}

function renderStackFrame(
  index: number,
  callsite: stackman.ICallsite,
  basePath: string,
  context?: stackman.ICallsiteContext,
): string {
  const filename = callsite.getFileName();
  const formattedFilename = formatFilename(basePath, filename);
  const lineNumber = callsite.getLineNumber();

  return `
    <div class="stack-frame">
      <div class="source-file">
        <span class="source-file__index">#${index + 1}</span>
        <span class="source-file__filename">${formattedFilename}</span>:<span class="source-file__line">${lineNumber}</span>
      </div>
      ${renderContext(lineNumber, context)}
    </div>
  `;
}

function formatFilename(basePath: string, filename: string): string {
  return path.relative(basePath, filename).replace(/\\/g, "/");
}

function renderContext(lineNumber: number, context?: stackman.ICallsiteContext) {
  /* istanbul ignore if */
  if (!context) {
    return '<div class="no-context">no context info available</div>';
  }

  const firstLineNumber = lineNumber - context.pre.length;
  const highlightLineNumber = lineNumber - firstLineNumber + 1;
  const sourceCode = `${context.pre.join("\n")}\n${context.line}\n${context.post.join("\n")}`;

  return `
    <pre class="source-code line-numbers" data-start="${firstLineNumber}" data-line="${highlightLineNumber}">
      <code class="language-typescript">${sourceCode}</code></pre>
  `;
}

function renderStackTrace(stack: string | undefined, basePath: string): string {
  /* istanbul ignore if */
  if (typeof stack !== "string" || stack.length === 0) {
    return '<div class="no-stack-trace">no stack trace available</div>';
  }

  const lines = stack.split("\n");
  const filteredLines = lines.filter(line => isProjectTrace(basePath, line));
  const renderedLines = filteredLines.map(line => renderStackLine(line, basePath)).join("\n");

  return `
    <ol class="stack-trace">
      ${renderedLines}
    </ol>
  `;
}

function renderErrorDetails(details: Partial<IErrorDetails>) {
  // check for circular json
  try {
    return `<div class="error-details">${JSON.stringify(details, undefined, "  ")}</div>`;
  } catch (e) {
    return `<div class="error-details"><em>error details contained circular reference</em></div>`;
  }
}

function renderStackLine(line: string, basePath: string): string {
  const regexp = /^\s*at (?:((?:\[object object\])?\S+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;
  const matches = regexp.exec(line);
  const expectedMatchCount = 5;

  /* istanbul ignore if */
  if (matches === null || matches.length !== expectedMatchCount) {
    return line;
  }

  const method = matches[1] as string | undefined;
  const filename = matches[2];
  // tslint:disable-next-line:no-magic-numbers
  const lineNumber = matches[3];
  const formattedFilename = formatFilename(basePath, filename);

  return `
    <li>
      <span class="stack-line__source">${formattedFilename}:${lineNumber}</span>
      ${typeof method === "string" ? `<span class="stack-line__method">(${method})</span>` : ""}
    </li>
  `;
}
