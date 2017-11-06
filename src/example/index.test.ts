import * as supertest from 'supertest';
import 'ts-jest';
import setupApp from './app';

let app: supertest.SuperTest<supertest.Test>;

describe('create-user-route', () => {
	beforeEach(async () => {
		app = supertest(await setupApp());
	});

	it('should return valid index endpoint result', async () => {
		const response = await app.get('/');

		expect(response.status).toEqual(200);
		expect(response.text).toMatchSnapshot();
	});

	it('should render thrown error', async () => {
		const response = await app.get('/throw-error');

		expect(response.status).toEqual(500);
		expect(response.text).toMatchSnapshot();
	});

	it('should render forwarded error', async () => {
		const response = await app.get('/next-error');

		expect(response.status).toEqual(500);
		expect(response.text).toMatchSnapshot();
	});

	it('should return error info as json if requested with XHR', async () => {
		const response = await app
			.get('/throw-error')
			.set('X-Requested-With', 'XMLHttpRequest')
			.send();

		expect(response.status).toEqual(500);
		expect(response.body).toMatchSnapshot();
	});
});
