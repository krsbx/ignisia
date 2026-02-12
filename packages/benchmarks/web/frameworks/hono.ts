import { Hono } from 'hono';
import { PORT_ALLOCATION } from '../utilities/config';

const app = new Hono()
  .get('/', (c) => c.text(''))
  .get('/user/:id', (c) => c.text(c.req.param('id')))
  .post('/user', (c) => c.text(''));

const config = {
  fetch: app.fetch as never,
  port: PORT_ALLOCATION.HONO,
};

console.log(`Hono server listening on port ${PORT_ALLOCATION.HONO}`);

export default config;
