import type { Context } from '../context';
import type { Middleware } from '../router/types';

export function composeMw(ctx: Context, middlewares: Middleware[]) {
  let index = 0;
  let nextCalled = false;

  const next = () => {
    nextCalled = true;
  };

  while (index < middlewares.length) {
    nextCalled = false;

    const result = middlewares[index](ctx, next);

    if (result instanceof Promise) {
      return (async () => {
        const res = await result;

        if (res instanceof Response) return res;
        if (!nextCalled) return;

        index++;

        while (index < middlewares.length) {
          nextCalled = false;

          const result = middlewares[index](ctx, next);

          if (result instanceof Promise) {
            const res = await result;

            if (res instanceof Response) return res;
            if (!nextCalled) return;

            index++;
            continue;
          }

          if (result instanceof Response) return result;
          if (!nextCalled) break;

          index++;
        }
      })();
    }

    if (result instanceof Response) return result;
    if (!nextCalled) break;

    index++;
  }
}
