import { Ignisia } from '../../../ignisia/src';
import { PORT_ALLOCATION } from '../utilities/config';

new Ignisia()
  .get('/', (c) => c.text(''))
  .get('/user/:id', (c) => c.text(c.req.param('id')))
  .post('/user', (c) => c.text(''))
  .listen({
    port: PORT_ALLOCATION.IGNISIA,
  });

console.log(`Ignisia server listening on port ${PORT_ALLOCATION.IGNISIA}`);
