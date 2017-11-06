import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as path from 'path';
import expressErrorRenderer from '../';

export default async function setupApp(): Promise<express.Express> {
	// create a new express app
	const app = express();

	// add json body parser
	app.use(bodyParser.json());

	// index endpoint
	app.get('/', (_request, response, _next) => {
		response.send('Hello!');
	});

	// throws an error
	app.get('/throw-error', (_request, _response, _next) => {
		throw new Error('Thrown error message');
	});

	// forwards an error
	app.get('/next-error', (_request, _response, next) => {
		next(new Error('Forwarded error message'));
	});

	// forwards an error
	app.get('/object-error', (_request, _response, next) => {
		next({
			message: 'Test message',
		});
	});

	// render express errors, add this as the last middleware
	app.use(
		expressErrorRenderer({
			// application base path, used to decide which stack frames to include and for formatting the error source location
			basePath: path.join(__dirname, '..', '..'),

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
						stack: error.stack ? error.stack.split('\n').map(line => line.trim()) : [],
					};
				} else {
					return {
						payload: null,
						success: false,
						error: 'Internal error occurred',
					};
				}
			},
		}),
	);

	return app;
}
