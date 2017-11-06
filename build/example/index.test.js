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
const supertest = require("supertest");
require("ts-jest");
const app_1 = require("./app");
let app;
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
        expect(response.body).toMatchSnapshot();
    }));
});
//# sourceMappingURL=index.test.js.map