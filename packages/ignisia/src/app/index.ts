import { Context } from '../context';
import { InternalServerError, NotFound } from '../context/constants';
import { Router } from '../router';
import type { Handler, Middleware } from '../router/types';
import { composeMw } from './composer';
import type { ApiMethod } from './constants';
import type {
  CompiledRoutes,
  ListenOptions,
  MatchResult,
  OnError,
  OnNotFound,
} from './types';

export class Ignisia<BasePath extends string> extends Router<BasePath> {
  protected _onError?: OnError;
  protected _onNotFound?: OnNotFound;

  public constructor(basePath: BasePath = '' as BasePath) {
    super(basePath);
  }

  public match(method: ApiMethod, parts: string[]) {
    return this.routesTree.match(parts, method);
  }

  public onError(onError: OnError) {
    this._onError = onError;
  }

  public onNotFound(onNotFound: OnNotFound) {
    this._onNotFound = onNotFound;
  }

  public fetch = (req: Request) => {
    return this.handle(req);
  };

  public listen(options: ListenOptions = {}) {
    return Bun.serve({
      routes: this.compileRoutes(),
      fetch: (req: Request) => this.handleNotFound(new Context(req)),
      ...options,
    } as Bun.Serve.Options<undefined, never>);
  }

  // ── Request Handling (hot path, called per-request) ──

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
    return found.route.handler(ctx);
  }

  private continueWith(
    ctx: Context,
    middlewares: Middleware[],
    next: () => Response | Promise<Response>
  ) {
    const mwResult = composeMw(ctx, middlewares);

    if (mwResult instanceof Response) return mwResult;

    if (mwResult instanceof Promise) {
      return mwResult
        .then((res) => (res instanceof Response ? res : next()))
        .catch((error) => this.handleError(error, ctx));
    }

    return next();
  }

  private handleError(error: unknown, ctx: Context) {
    if (this._onError) return this._onError(error, ctx);

    return InternalServerError;
  }

  private handleNotFound(ctx: Context) {
    if (this._onNotFound) return this._onNotFound(ctx);

    return NotFound;
  }

  // ── Route Compilation (cold path, called once at startup) ──

  private compileRoutes() {
    const routes = this.routesTree.collectRoutes(this.basePath);
    const compiled: CompiledRoutes = {};
    const globalMws = this.middlewares;
    const hasGlobalMws = globalMws.length > 0;

    for (const route of routes) {
      const path = route.path || '/';

      if (!compiled[path]) compiled[path] = {};

      const { handler, middlewares: routeMws } = route;

      // Build the execution chain at compile time:
      // handler ← routeMws ← globalMws
      let invoke: Handler = handler;

      if (routeMws.length > 0) {
        const next = invoke;
        invoke = (ctx) => this.continueWith(ctx, routeMws, () => next(ctx));
      }

      if (hasGlobalMws) {
        const next = invoke;
        invoke = (ctx) => this.continueWith(ctx, globalMws, () => next(ctx));
      }

      compiled[path][route.method] = this.wrapCompiledHandler(invoke);
    }

    return compiled;
  }

  private wrapCompiledHandler(invoke: Handler) {
    // Pre-allocate a reusable Context for this route.
    // Sync handlers reuse it (0 allocation).
    // On Async handlers re-create the context for the next request.
    //  > Use null as a placeholder
    let ctx = new Context(null!);

    return (req: Request) => {
      try {
        ctx.reset(req, (req as unknown as Bun.BunRequest).params);

        const result = invoke(ctx);

        if (result instanceof Promise) ctx = new Context(null!);

        return result;
      } catch (error) {
        return this.handleError(error, ctx);
      }
    };
  }
}
