import { Context } from '../context';
import { InternalServerError, NotFound } from '../context/constants';
import { Router } from '../router';
import type { Middleware } from '../router/types';
import { MwComposer } from './composer';
import type { ApiMethod } from './constants';
import type { ListenOptions, MatchResult, OnError, OnNotFound } from './types';

export class Ignisia<BasePath extends string> extends Router<BasePath> {
  protected _onError: OnError | null;
  protected _onNotFound: OnNotFound | null;

  public constructor(basePath: BasePath = '' as BasePath) {
    super(basePath);

    this._onError = null;
    this._onNotFound = null;
  }

  public match(method: ApiMethod, parts: string[]) {
    return this.routesTree.match(parts, method);
  }

  public onError(onError: OnError) {
    this._onError = onError;
  }

  private handleError(error: unknown, ctx: Context) {
    if (this._onError) return this._onError(error, ctx);

    return InternalServerError;
  }

  public onNotFound(onNotFound: OnNotFound) {
    this._onNotFound = onNotFound;
  }

  private handleNotFound(ctx: Context) {
    if (this._onNotFound) return this._onNotFound(ctx);

    return NotFound;
  }

  /**
   * If middleware returned a Response (sync or async), use it.
   * Otherwise, continue to the next step.
   */
  private continueWith(
    ctx: Context,
    middlewares: Middleware[],
    next: () => Response | Promise<Response>
  ) {
    const mwResult = MwComposer.compose(ctx, middlewares);

    if (mwResult instanceof Response) return mwResult;

    if (mwResult instanceof Promise) {
      return mwResult
        .then((res) => (res instanceof Response ? res : next()))
        .catch((error) => this.handleError(error, ctx));
    }

    return next();
  }

  public handle(req: Request) {
    try {
      // When global middlewares exist, Context must be created first
      if (this.middlewares.length > 0) {
        const ctx = new Context(req);

        return this.continueWith(ctx, this.middlewares, () =>
          this.processRoute(ctx)
        );
      }

      // Fast path: match route first, then create Context with params
      return this.processRouteFast(req);
    } catch (error) {
      if (this._onError) return this._onError(error, new Context(req));

      return InternalServerError;
    }
  }

  /**
   * Fast path: no global middlewares.
   * Match route first, then create Context with params already set.
   */
  private processRouteFast(req: Request): Response | Promise<Response> {
    const found = this.routesTree.matchUrl(req.url, req.method as ApiMethod);

    if (!found) {
      if (this._onNotFound) return this._onNotFound(new Context(req));

      return NotFound;
    }

    const ctx = new Context(req, found.params);

    if (found.route.middlewares.length > 0) {
      return this.continueWith(ctx, found.route.middlewares, () =>
        this.invokeHandler(ctx, found)
      );
    }

    return this.invokeHandler(ctx, found);
  }

  /**
   * Slow path: global middlewares exist.
   * Context was created before route matching.
   */
  private processRoute(ctx: Context): Response | Promise<Response> {
    const found = this.routesTree.matchUrl(
      ctx.rawRequest.url,
      ctx.rawRequest.method as ApiMethod
    );

    if (!found) {
      return this.handleNotFound(ctx);
    }

    ctx.setParams(found.params);

    if (found.route.middlewares.length > 0) {
      return this.continueWith(ctx, found.route.middlewares, () =>
        this.invokeHandler(ctx, found)
      );
    }

    return this.invokeHandler(ctx, found);
  }

  private invokeHandler(ctx: Context, found: MatchResult) {
    const res = found.route.handler(ctx);

    if (res instanceof Promise) return res;

    ctx.res = res;

    return res;
  }

  public fetch = (req: Request) => {
    return this.handle(req);
  };

  /**
   * Listen on the specified port, defaulting to 3000
   * By default will use Bun's routes instead of fetch
   */
  public listen(options: ListenOptions = {}) {
    return Bun.serve({
      fetch: this.fetch,
      ...options,
    } as Bun.Serve.Options<undefined, never>);
  }
}
