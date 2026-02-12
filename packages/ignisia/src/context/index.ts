import { generateHeaderEntries } from '../utilities';
import { HTML_INIT, NotFound, StatusCode } from './constants';
import { ContextCookie } from './cookie';
import { ContextRequest } from './request';

const EMPTY_PARAMS = Object.freeze({});

export class Context<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-constraint
  Values extends any = any,
  Params extends Record<string, string> = NonNullable<unknown>,
  Query extends Record<string, string> = NonNullable<unknown>,
  State extends Record<string, unknown> = NonNullable<unknown>,
> {
  private _state?: State;
  private _status: StatusCode;
  private _headers?: Record<string, string[]>;
  private _cookie?: ContextCookie;
  private _params: Params;
  private _request: Request;
  private _req?: ContextRequest<Values, Params, Query>;
  private _res?: Response;

  public constructor(
    request: Request,
    params: Params = EMPTY_PARAMS as Params
  ) {
    this._status = StatusCode.OK;
    this._request = request;
    this._params = params;
  }

  public get rawRequest() {
    return this._request;
  }

  /** Do not call this method, it is for internal use only */
  public setParams(params: Params) {
    this._params = params;

    if (this._req) {
      this._req.setParams(params);
    }

    return this;
  }

  public get req() {
    if (!this._req) {
      this._req = new ContextRequest(this._request, this._params);
    }

    return this._req;
  }

  public get cookie() {
    if (!this._cookie) {
      this._cookie = new ContextCookie(this);
    }

    return this._cookie;
  }

  public set res(res: Response | undefined) {
    this._res = res;
  }

  public get res() {
    if (!this._res) this._res = NotFound;

    return this._res;
  }

  /**
   * Append response headers by default
   */
  public header(
    key: string,
    value: string
  ): Context<Values, Params, Query, State>;
  /**
   * Specify to append the response headers
   */
  public header(
    key: string,
    value: string,
    append: true
  ): Context<Values, Params, Query, State>;
  /**
   * Prevent appending the response headers
   */
  public header(
    key: string,
    value: string,
    append: false
  ): Context<Values, Params, Query, State>;
  public header(key: string, value: string, append = true) {
    if (!this._headers) {
      this._headers = {};
    }

    if (append) {
      if (!this._headers[key]) this._headers[key] = [];

      this._headers[key].push(value);
    } else {
      this._headers[key] = [value];
    }

    return this;
  }

  public status(status: StatusCode) {
    this._status = status;

    return this;
  }

  public set<
    Key extends string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-constraint
    Value extends any = any,
    FinalState extends State & { [K in Key]: Value } = State & {
      [K in Key]: Value;
    },
  >(key: Key, value: Value) {
    if (!this._state) this._state = {} as State;

    (this._state as Record<string, unknown>)[key] = value;

    return this as unknown as Context<Values, Params, Query, FinalState>;
  }

  public get<Key extends keyof State, Value extends State[Key]>(key: Key) {
    if (!this._state) return undefined;

    return this._state[key] as Value;
  }

  public body(value: BodyInit | null): Response;
  public body(value: BodyInit | null, contentType: string): Response;
  public body(value: BodyInit | null, contentType?: string) {
    if (contentType) {
      this.header('Content-Type', contentType, false);
    }

    return new Response(value, {
      status: this._status,
      headers: this._headers ? generateHeaderEntries(this._headers) : undefined,
    });
  }

  public text(value: string) {
    if (!this._headers && this._status === StatusCode.OK) {
      return new Response(value);
    }

    return this.body(value, 'text/plain');
  }

  public json<Value>(value: Value) {
    if (!this._headers && this._status === StatusCode.OK) {
      return Response.json(value);
    }

    return this.body(JSON.stringify(value), 'application/json');
  }

  public html(value: string) {
    if (!this._headers && this._status === StatusCode.OK) {
      return new Response(value, HTML_INIT);
    }

    return this.body(value, 'text/html');
  }

  public noContent() {
    return this.status(StatusCode.NO_CONTENT).body(null);
  }

  public notFound(): Response;
  public notFound(message: string): Response;
  public notFound(message?: string) {
    return this.status(StatusCode.NOT_FOUND).json({
      message: message ?? 'Not Found',
    });
  }

  public forbidden(): Response;
  public forbidden(message: string): Response;
  public forbidden(message?: string) {
    return this.status(StatusCode.FORBIDDEN).json({
      message: message ?? 'Forbidden',
    });
  }

  public redirect(url: string): Response;
  public redirect(url: string, statusCode: StatusCode): Response;
  public redirect(url: string, statusCode?: StatusCode) {
    return this.status(statusCode ?? StatusCode.MOVED_PERMANENTLY)
      .header('Location', url)
      .body(null);
  }
}
