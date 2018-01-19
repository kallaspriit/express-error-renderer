import * as express from "express";
import * as HttpStatus from "http-status-codes";
import * as supertest from "supertest";
import expressErrorRenderer, { formatXhrError, renderError } from "../index";
import setupApp from "./app";

let app: supertest.SuperTest<supertest.Test>;

export interface IErrorDetails {
  // tslint:disable-next-line:no-any
  [x: string]: any;
}

export class DetailedError extends Error {
  // tslint:disable-next-line:no-null-keyword
  public constructor(message: string, public details?: IErrorDetails) {
    super(message);

    this.name = "DetailedError";
  }
}

describe("create-user-route", () => {
  beforeEach(async () => {
    app = supertest(await setupApp());
  });

  it("should return valid index endpoint result", async () => {
    const response = await app.get("/");

    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.text).toMatchSnapshot();
  });

  it("should render thrown error", async () => {
    const response = await app.get("/throw-error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });

  it("should render forwarded error", async () => {
    const response = await app.get("/next-error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });

  it("should return error info as json if requested with XHR", async () => {
    const response = await app
      .get("/throw-error")
      .set("X-Requested-With", "XMLHttpRequest")
      .send();

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body.error).toEqual("Thrown error message");
    expect(response.body.stack).toBeInstanceOf(Array);
    expect(response.body.stack.length).toBeGreaterThan(0);
  });

  it("can use default config", async () => {
    const server = express();

    server.get("/error", (_request, _response, _next) => {
      throw new Error("Error message");
    });

    server.use(expressErrorRenderer());

    app = supertest(server);
    const response = await app.get("/error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });

  it("can be configured not to show error details", async () => {
    const server = express();

    server.get("/error", (_request, _response, _next) => {
      throw new Error("Error message");
    });

    server.use(
      expressErrorRenderer({
        showDetails: false
      })
    );

    app = supertest(server);
    const response = await app.get("/error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });

  it("uses default XHR error formatter by default", async () => {
    const server = express();

    server.get("/error", (_request, _response, _next) => {
      throw new Error("Error message");
    });

    server.use(expressErrorRenderer());

    app = supertest(server);
    const response = await app
      .get("/error")
      .set("X-Requested-With", "XMLHttpRequest")
      .send();

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body.error).toEqual("Error message");
    expect(response.body.stack).toBeInstanceOf(Array);
    expect(response.body.stack.length).toBeGreaterThan(0);
  });

  it("doesn't return XHR error stack if details are disabled", async () => {
    const server = express();

    server.get("/error", (_request, _response, _next) => {
      throw new Error("Error message");
    });

    server.use(
      expressErrorRenderer({
        showDetails: false
      })
    );

    app = supertest(server);
    const response = await app
      .get("/error")
      .set("X-Requested-With", "XMLHttpRequest")
      .send();

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body.error).toEqual("Internal error occurred");
    expect(response.body.stack).toBeUndefined();
  });

  it("provides generic method for rendering a simple error with default title and message", async () => {
    const error = renderError();

    expect(error).toMatchSnapshot();
  });

  it("provides generic method for rendering a simple error, one can provide custom title and message", async () => {
    const error = renderError({
      title: "Custom title",
      message: "Custom message"
    });

    expect(error).toMatchSnapshot();
  });

  it("error can include additional information", async () => {
    const server = express();

    server.get("/error", (_request, _response, _next) => {
      throw new DetailedError("Detailed error message", {
        user: {
          name: "Jack Daniels"
        }
      });
    });

    server.use(expressErrorRenderer());

    app = supertest(server);
    const response = await app.get("/error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toContain("Jack Daniels");
    expect(response.text).toMatchSnapshot();
  });

  it("xhr error formatter accepts error without stack", async () => {
    const error = formatXhrError(
      {
        name: "Error",
        message: "Error message"
      },
      {
        basePath: "",
        showDetails: true
      }
    );

    expect(error).toMatchSnapshot();
  });

  it("renders errors from anonymous functions", async () => {
    const server = express();

    server.get("/error", (_request, _response, _next) => {
      (() => {
        throw new Error("Error message");
      })();
    });

    server.use(expressErrorRenderer());

    app = supertest(server);
    const response = await app.get("/error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });

  it("renders errors without trace", async () => {
    const server = express();

    server.get("/error", (_request, _response, _next) => {
      throw {
        message: "Error message"
      };
    });

    server.use(expressErrorRenderer());

    app = supertest(server);
    const response = await app.get("/error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });
});
