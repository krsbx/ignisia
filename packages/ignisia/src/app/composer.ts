import type { Context } from '../context';
import type { Middleware } from '../router/types';

export class MwComposer {
  private ctx: Context;
  private middlewares: Middleware[];
  private index: number;
  private nextCalled: boolean;

  public constructor(ctx: Context, middlewares: Middleware[]) {
    this.ctx = ctx;
    this.middlewares = middlewares;
    this.index = 0;
    this.nextCalled = false;
    this.next = this.next.bind(this);
  }

  public next() {
    this.nextCalled = true;
  }

  public async mwComposerAsync(
    promise: Promise<Response | void>
  ): Promise<Response | void> {
    const result = await promise;

    if (result instanceof Response) return result;
    if (!this.nextCalled) return;

    this.index++;

    while (this.index < this.middlewares.length) {
      this.nextCalled = false;

      const result = this.middlewares[this.index](this.ctx, this.next);

      if (result instanceof Promise) return this.mwComposerAsync(result);
      if (result instanceof Response) return result;
      if (!this.nextCalled) break;

      this.index++;
    }
  }

  public mwComposer(): Response | void | Promise<Response | void> {
    while (this.index < this.middlewares.length) {
      this.nextCalled = false;

      const result = this.middlewares[this.index](this.ctx, this.next);

      if (result instanceof Promise) return this.mwComposerAsync(result);
      if (result instanceof Response) return result;
      if (!this.nextCalled) break;

      this.index++;
    }
  }

  public static compose(ctx: Context, middlewares: Middleware[]) {
    const composer = new MwComposer(ctx, middlewares);

    return composer.mwComposer();
  }
}
