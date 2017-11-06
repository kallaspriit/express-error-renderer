"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const stackman = require("stackman");
function expressErrorRenderer(userOptions = {}) {
    const options = Object.assign({ basePath: path.join(__dirname, '..', '..'), showDetails: true }, userOptions);
    return (error, request, response, _next) => {
        // respond to xhr requests with json (true if X-Requested-With header equals XMLHttpRequest)
        if (request.xhr) {
            // use user-provided formatter if available
            const payload = options.formatXhrError
                ? options.formatXhrError(error, options)
                : formatXhrError(error, options);
            response.status(500).send(payload);
            return;
        }
        // else if (request.headers.accept.indexOf('image/') !== -1) {
        // 	// image was requested
        // 	response.status(500).send(`IMAGE: ${error.message}`);
        // 	return;
        // }
        // show simple error view if details are disabled
        if (!options.showDetails) {
            response.status(500).send(renderError({
                title: 'Internal error occurred',
            }));
            return;
        }
        // using stackman for getting details stack traces
        const resolver = stackman();
        // attempt to get error callsites
        resolver.callsites(error, { sourcemap: true }, (callsitesError, callsites) => {
            // handle callsites failure
            /* istanbul ignore if */
            if (callsitesError) {
                response.status(500).send(renderError({
                    title: 'Internal error occurred',
                    message: `Also getting error callsites failed (${callsitesError.message})`,
                }));
                return;
            }
            // ignore files in node_modules
            const filteredCallsites = callsites.filter(callsite => {
                const filename = callsite.getFileName();
                /* istanbul ignore if */
                if (!filename) {
                    return false;
                }
                // only render traces for project files
                return isProjectTrace(options.basePath, filename);
            });
            // fetch source contexts
            resolver.sourceContexts(filteredCallsites, { lines: 20 }, (contextsError, contexts) => {
                /* istanbul ignore if */
                if (contextsError) {
                    // getting source contexts failed for some reason, show simple error
                    response.status(500).send(renderError({
                        title: 'Internal error occurred',
                        message: `Also getting error callsites contexts failed (${contextsError.message})`,
                    }));
                    return;
                }
                // render stack frames
                const renderedStackFrames = filteredCallsites.map((callsite, index) => renderStackFrame(index, callsite, options.basePath, contexts[index]));
                // send the error page response
                response.status(500).send(renderErrorPage(error, renderedStackFrames, options.basePath));
            });
        });
    };
}
exports.default = expressErrorRenderer;
function formatXhrError(error, options) {
    if (options.showDetails) {
        const { name, message, stack } = error, errorRest = __rest(error, ["name", "message", "stack"]);
        return Object.assign({ error: error.message, stack: stack ? stack.split('\n').map(line => line.trim()) : [] }, errorRest);
    }
    else {
        return {
            error: 'Internal error occurred',
        };
    }
}
exports.formatXhrError = formatXhrError;
function renderError(details = {}) {
    const info = Object.assign({ title: 'Error occurred', message: 'The error has been logged and our engineers are looking into it, sorry about this.' }, details);
    return `
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Error</title>
      <style>
        body {
          background-color: #252526;
          color: #FFF;
          margin: 0;
          padding: 20px;
        }
        a {
          color: #FFF;
        }
        .error-message {
          padding: 20px;
          margin-bottom: 20px;
          background-color: #900;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <h1>${info.title}</h1>
      <p>
        <div class="error-message">${info.message}</div>
      </p>
      <p>
        <a href="/">Navigate to index</a> |
        <a href="javascript: window.location.reload()">Attempt to reload page</a>
      </p>
    </body>
    </html>
  `;
}
exports.renderError = renderError;
function isProjectTrace(basePath, line) {
    return line.indexOf(basePath) !== -1 && line.indexOf('node_modules') === -1;
}
function renderErrorPage(error, stackFrames, basePath) {
    const { name, message, stack } = error, errorDetails = __rest(error, ["name", "message", "stack"]);
    return `
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Error</title>

      <style>${fs.readFileSync(path.join(__dirname, '..', 'static', 'prism.css'), 'utf8')}</style>
      <script>${fs.readFileSync(path.join(__dirname, '..', 'static', 'prism.js'), 'utf8')}</script>

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
        ${renderStackTrace(stack || '', basePath)}
        ${Object.keys(errorDetails).length > 0 ? renderErrorDetails(errorDetails) : ''}
      </div>
      ${stackFrames.join('\n')}
    </body>
    </html>
  `;
}
function renderStackFrame(index, callsite, basePath, context) {
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
function formatFilename(basePath, filename) {
    return path.relative(basePath, filename).replace(/\\/g, '/');
}
function renderContext(lineNumber, context) {
    /* istanbul ignore if */
    if (!context) {
        return '<div class="no-context">no context info available</div>';
    }
    const firstLineNumber = lineNumber - context.pre.length;
    const highlightLineNumber = lineNumber - firstLineNumber + 1;
    const sourceCode = `${context.pre.join('\n')}\n${context.line}\n${context.post.join('\n')}`;
    return `
    <pre class="source-code line-numbers" data-start="${firstLineNumber}" data-line="${highlightLineNumber}">
      <code class="language-typescript">${sourceCode}</code></pre>
  `;
}
function renderStackTrace(stack, basePath) {
    /* istanbul ignore if */
    if (stack.length === 0) {
        return '<div class="no-stack-trace">no stack trace available</div>';
    }
    const lines = stack.split('\n');
    const filteredLines = lines.filter(line => isProjectTrace(basePath, line));
    const renderedLines = filteredLines.map(line => renderStackLine(line, basePath)).join('\n');
    return `
    <ol class="stack-trace">
      ${renderedLines}
    </ol>
  `;
}
function renderErrorDetails(details) {
    return `<div class="error-details">${JSON.stringify(details, null, '  ')}</div>`;
}
function renderStackLine(line, basePath) {
    const regexp = /^\s*at (?:((?:\[object object\])?\S+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$/i;
    const matches = regexp.exec(line);
    /* istanbul ignore if */
    if (!matches || matches.length !== 5) {
        return line;
    }
    const method = matches[1];
    const filename = matches[2];
    const lineNumber = matches[3];
    const formattedFilename = formatFilename(basePath, filename);
    return `
    <li>
      <span class="stack-line__source">${formattedFilename}:${lineNumber}</span>
      ${method ? `<span class="stack-line__method">(${method})</span>` : ''}
    </li>
  `;
}
//# sourceMappingURL=index.js.map