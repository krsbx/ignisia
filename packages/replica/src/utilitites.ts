import type { WebSocket } from 'bun';
import type {
  AcceptedPrimaryInstance,
  PrimaryDatabaseQueryRequest,
} from './types';

export function onPrimaryQueryListener(
  ws: WebSocket,
  db: AcceptedPrimaryInstance
) {
  ws.addEventListener('message', async (event) => {
    try {
      if (typeof event.data !== 'string') return;

      const data = JSON.parse(event.data) as PrimaryDatabaseQueryRequest;

      if (data.action !== '@ignisia/replica' || data.payload.type === 'SELECT')
        return;

      await db.client.exec({
        sql: data.payload.query,
        params: data.payload.params,
      });
    } catch {
      // Ignore the JSON parsing error or other errors
    }
  });
}
