import * as bodyParser from "body-parser";
import * as express from "express";
import * as path from "path";
import expressErrorRenderer from "../";

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

export default async function setupApp(): Promise<express.Express> {
  // create a new express app
  const app = express();

  // add json body parser
  app.use(bodyParser.json());

  // index endpoint
  app.get("/", (_request, response, _next) => {
    response.send(`
      <ul>
        <li><a href="/throw-error">Throw error</a></li>
        <li><a href="/next-error">Next error</a></li>
        <li><a href="/object-error">Object error</a></li>
        <li><a href="/detailed-error">Detailed error</a></li>
        <li><a href="/cyclic-error">Cyclic error</a></li>
      </ul>
    `);
  });

  // throws an error
  app.get("/throw-error", (_request, _response, _next) => {
    throw new Error("Thrown error message");
  });

  // forwards an error
  app.get("/next-error", (_request, _response, next) => {
    next(new Error("Forwarded error message"));
  });

  // object error
  app.get("/object-error", (_request, _response, next) => {
    next({
      message: "Test message",
    });
  });

  // detailed error
  app.get("/detailed-error", (_request, _response, next) => {
    next(
      new DetailedError("Cyclic error", {
        foo: "bar",
      }),
    );
  });

  // error contains cyclic data
  app.get("/cyclic-error", (_request, _response, next) => {
    const a: { [x: string]: any } = { child: null };
    const b = { child: a };
    a.child = b;

    next(
      new DetailedError("Cyclic error", {
        a,
      }),
    );
  });

  // render express errors, add this as the last middleware
  app.use(
    expressErrorRenderer({
      // application base path, used to decide which stack frames to include and for formatting the error source location
      basePath: path.join(__dirname, "..", ".."),

      // should error details and stack traces be shown
      debug: true,

      // will the error message be displayed in non-debug mode
      showMessage: true,

      // returns JSON payload for XHR requests, configure the output here
      formatXhrError: (error, options) => {
        // only show actual error message and stack trace if showing details is enabled
        if (options.debug) {
          return {
            // tslint:disable-next-line:no-null-keyword
            payload: null,
            success: false,
            error: error.message,
            stack: typeof error.stack === "string" ? error.stack.split("\n").map(line => line.trim()) : [],
          };
        } else {
          return {
            // tslint:disable-next-line:no-null-keyword
            payload: null,
            success: false,
            error: "Internal error occurred",
          };
        }
      },
    }),
  );

  return app;
}
