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
const express = require("express");
const supertest = require("supertest");
require("ts-jest");
const index_1 = require("../index");
const app_1 = require("./app");
let app;
class DetailedError extends Error {
    constructor(message, details = null) {
        super(message);
        this.details = details;
        this.name = 'DetailedError';
    }
}
exports.DetailedError = DetailedError;
describe('create-user-route', () => {
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        app = supertest(yield app_1.default());
    }));
    it('should return valid index endpoint result', () => __awaiter(this, void 0, void 0, function* () {
        const response = yield app.get('/');
        expect(response.status).toEqual(200);
        expect(response.text).toMatchSnapshot();
    }));
    it('should render thrown error', () => __awaiter(this, void 0, void 0, function* () {
        const response = yield app.get('/throw-error');
        expect(response.status).toEqual(500);
        expect(response.text).toMatchSnapshot();
    }));
    it('should render forwarded error', () => __awaiter(this, void 0, void 0, function* () {
        const response = yield app.get('/next-error');
        expect(response.status).toEqual(500);
        expect(response.text).toMatchSnapshot();
    }));
    it('should return error info as json if requested with XHR', () => __awaiter(this, void 0, void 0, function* () {
        const response = yield app
            .get('/throw-error')
            .set('X-Requested-With', 'XMLHttpRequest')
            .send();
        expect(response.status).toEqual(500);
        expect(response.body.error).toEqual('Thrown error message');
        expect(response.body.stack).toBeInstanceOf(Array);
        expect(response.body.stack.length).toBeGreaterThan(0);
    }));
    it('can use default config', () => __awaiter(this, void 0, void 0, function* () {
        const server = express();
        server.get('/error', (_request, _response, _next) => {
            throw new Error('Error message');
        });
        server.use(index_1.default());
        app = supertest(server);
        const response = yield app.get('/error');
        expect(response.status).toEqual(500);
        expect(response.text).toMatchSnapshot();
    }));
    it('can be configured not to show error details', () => __awaiter(this, void 0, void 0, function* () {
        const server = express();
        server.get('/error', (_request, _response, _next) => {
            throw new Error('Error message');
        });
        server.use(index_1.default({
            showDetails: false,
        }));
        app = supertest(server);
        const response = yield app.get('/error');
        expect(response.status).toEqual(500);
        expect(response.text).toMatchSnapshot();
    }));
    it('uses default XHR error formatter by default', () => __awaiter(this, void 0, void 0, function* () {
        const server = express();
        server.get('/error', (_request, _response, _next) => {
            throw new Error('Error message');
        });
        server.use(index_1.default());
        app = supertest(server);
        const response = yield app
            .get('/error')
            .set('X-Requested-With', 'XMLHttpRequest')
            .send();
        expect(response.status).toEqual(500);
        expect(response.body.error).toEqual('Error message');
        expect(response.body.stack).toBeInstanceOf(Array);
        expect(response.body.stack.length).toBeGreaterThan(0);
    }));
    it("doesn't return XHR error stack if details are disabled", () => __awaiter(this, void 0, void 0, function* () {
        const server = express();
        server.get('/error', (_request, _response, _next) => {
            throw new Error('Error message');
        });
        server.use(index_1.default({
            showDetails: false,
        }));
        app = supertest(server);
        const response = yield app
            .get('/error')
            .set('X-Requested-With', 'XMLHttpRequest')
            .send();
        expect(response.status).toEqual(500);
        expect(response.body.error).toEqual('Internal error occurred');
        expect(response.body.stack).toBeUndefined();
    }));
    it('provides generic method for rendering a simple error with default title and message', () => __awaiter(this, void 0, void 0, function* () {
        const error = index_1.renderError();
        expect(error).toMatchSnapshot();
    }));
    it('provides generic method for rendering a simple error, one can provide custom title and message', () => __awaiter(this, void 0, void 0, function* () {
        const error = index_1.renderError({
            title: 'Custom title',
            message: 'Custom message',
        });
        expect(error).toMatchSnapshot();
    }));
    it('error can include additional information', () => __awaiter(this, void 0, void 0, function* () {
        const server = express();
        server.get('/error', (_request, _response, _next) => {
            throw new DetailedError('Detailed error message', {
                user: {
                    name: 'Jack Daniels',
                },
            });
        });
        server.use(index_1.default());
        app = supertest(server);
        const response = yield app.get('/error');
        expect(response.status).toEqual(500);
        expect(response.text).toContain('Jack Daniels');
        expect(response.text).toMatchSnapshot();
    }));
    it('xhr error formatter accepts error without stack', () => __awaiter(this, void 0, void 0, function* () {
        const error = index_1.formatXhrError({
            name: 'Error',
            message: 'Error message',
        }, {
            basePath: '',
            showDetails: true,
        });
        expect(error).toMatchSnapshot();
    }));
    it('renders errors from anonymous functions', () => __awaiter(this, void 0, void 0, function* () {
        const server = express();
        server.get('/error', (_request, _response, _next) => {
            (() => {
                throw new Error('Error message');
            })();
        });
        server.use(index_1.default());
        app = supertest(server);
        const response = yield app.get('/error');
        expect(response.status).toEqual(500);
        expect(response.text).toMatchSnapshot();
    }));
});
//# sourceMappingURL=index.test.js.map