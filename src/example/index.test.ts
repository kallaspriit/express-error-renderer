import * as express from "express";
import * as HttpStatus from "http-status-codes";
import * as supertest from "supertest";
import expressErrorRenderer, { formatXhrError } from "../index";
import setupApp from "./app";

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
  it("should return valid index endpoint result", async () => {
    const app = supertest(await setupApp());
    const response = await app.get("/");

    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.text).toMatchSnapshot();
  });

  it("should render thrown error", async () => {
    const app = supertest(await setupApp());
    const response = await app.get("/throw-error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });

  it("should render forwarded error", async () => {
    const app = supertest(await setupApp());
    const response = await app.get("/next-error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });

  it("should handle cyclic errors", async () => {
    const app = supertest(await setupApp());
    const response = await app.get("/cyclic-error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });

  it("should return error info as json if requested with XHR", async () => {
    const app = supertest(await setupApp());
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

    const app = supertest(server);
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
        debug: false,
      }),
    );

    const app = supertest(server);
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

    const app = supertest(server);
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
        debug: false,
      }),
    );

    const app = supertest(server);
    const response = await app
      .get("/error")
      .set("X-Requested-With", "XMLHttpRequest")
      .send();

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body.error).toEqual("Internal error occurred");
    expect(response.body.stack).toBeUndefined();
  });

  it("error can include additional information", async () => {
    const server = express();

    server.get("/error", (_request, _response, _next) => {
      throw new DetailedError("Detailed error message", {
        user: {
          name: "Jack Daniels",
        },
      });
    });

    server.use(expressErrorRenderer());

    const app = supertest(server);
    const response = await app.get("/error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toContain("Jack Daniels");
    expect(response.text).toMatchSnapshot();
  });

  it("can be configured to show message", async () => {
    const server = express();

    server.get("/error", (_request, _response, _next) => {
      throw new Error("Test error");
    });

    server.use(
      expressErrorRenderer({
        debug: false,
        showMessage: true,
      }),
    );

    const app = supertest(server);
    const response = await app.get("/error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });

  it("can be configured not to show message", async () => {
    const server = express();

    server.get("/error", (_request, _response, _next) => {
      throw new Error("Test error");
    });

    server.use(
      expressErrorRenderer({
        debug: false,
        showMessage: false,
      }),
    );

    const app = supertest(server);
    const response = await app.get("/error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });

  it("xhr error formatter accepts error without stack", async () => {
    const error = formatXhrError(
      {
        name: "Error",
        message: "Error message",
      },
      {
        basePath: "",
        debug: true,
        showMessage: true,
      },
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

    const app = supertest(server);
    const response = await app.get("/error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });

  it("renders errors without trace", async () => {
    const server = express();

    server.get("/error", (_request, _response, _next) => {
      throw {
        message: "Error message",
      };
    });

    server.use(expressErrorRenderer());

    const app = supertest(server);
    const response = await app.get("/error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });

  it("renders errors without trace hiding message", async () => {
    const server = express();

    server.get("/error", (_request, _response, _next) => {
      // tslint:disable-next-line:no-string-throw
      throw "foo";
    });

    server.use(
      expressErrorRenderer({
        debug: true,
        showMessage: false,
      }),
    );

    const app = supertest(server);
    const response = await app.get("/error");

    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.text).toMatchSnapshot();
  });
});
