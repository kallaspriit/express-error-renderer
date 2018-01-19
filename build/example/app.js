"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const _1 = require("../");
function setupApp() {
    return __awaiter(this, void 0, void 0, function* () {
        // create a new express app
        const app = express();
        // add json body parser
        app.use(bodyParser.json());
        // index endpoint
        app.get("/", (_request, response, _next) => {
            response.send("Hello!");
        });
        // throws an error
        app.get("/throw-error", (_request, _response, _next) => {
            throw new Error("Thrown error message");
        });
        // forwards an error
        app.get("/next-error", (_request, _response, next) => {
            next(new Error("Forwarded error message"));
        });
        // forwards an error
        app.get("/object-error", (_request, _response, next) => {
            next({
                message: "Test message"
            });
        });
        // render express errors, add this as the last middleware
        app.use(_1.default({
            // application base path, used to decide which stack frames to include and for formatting the error source location
            basePath: path.join(__dirname, "..", ".."),
            // showing details should probably be disabled for production sites
            showDetails: true,
            // returns JSON payload for XHR requests, configure the output here
            formatXhrError: (error, options) => {
                // only show actual error message and stack trace if showing details is enabled
                if (options.showDetails) {
                    return {
                        payload: null,
                        success: false,
                        error: error.message,
                        stack: typeof error.stack === "string" ? error.stack.split("\n").map(line => line.trim()) : []
                    };
                }
                else {
                    return {
                        payload: null,
                        success: false,
                        error: "Internal error occurred"
                    };
                }
            }
        }));
        return app;
    });
}
exports.default = setupApp;
//# sourceMappingURL=app.js.map