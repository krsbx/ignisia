import type { ApiMethod } from '../../app/constants';
import type { MatchResult } from '../../app/types';
import type { Route } from '../types';

const EMPTY_PARAMS: Record<string, string> = Object.freeze({});

export class TrieRouteNode {
  public children: Record<string, TrieRouteNode>;
  public paramChild: TrieRouteNode | null;
  public wildcardChild: TrieRouteNode | null;
  public paramName: string | null;
  public wildcardName: string | null;
  public routes: Partial<Record<ApiMethod, Route>>;

  public constructor() {
    this.children = {};
    this.paramChild = null;
    this.wildcardChild = null;
    this.paramName = null;
    this.wildcardName = null;
    this.routes = {};
  }

  public collectRoutes(path = '') {
    const routes: Route[] = [];

    for (const method in this.routes) {
      const route = this.routes[method as ApiMethod]!;

      route.path = path;
      routes.push(route);
    }

    for (const segment in this.children) {
      routes.push(
        ...this.children[segment].collectRoutes(`${path}/${segment}`)
      );
    }

    if (this.paramChild) {
      const paramPath = `/:${this.paramChild.paramName}`;
      const fullPath = `${path}${paramPath}`;

      routes.push(...this.paramChild.collectRoutes(fullPath));
    }

    if (this.wildcardChild) {
      const fullPath = `${path}/*`;

      routes.push(...this.wildcardChild.collectRoutes(fullPath));
    }

    return routes;
  }

  public insert(parts: string[], route: Route) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: TrieRouteNode = this;
    let wildcardIndex = 0;

    for (const part of parts) {
      if (part === '*') {
        if (!node.wildcardChild) node.wildcardChild = new TrieRouteNode();

        node.wildcardChild.wildcardName = `wildcard${wildcardIndex}`;
        wildcardIndex++;

        node = node.wildcardChild;
      } else if (part.startsWith(':')) {
        if (!node.paramChild) node.paramChild = new TrieRouteNode();

        node.paramChild.paramName = part.slice(1);

        node = node.paramChild;
      } else {
        if (!node.children[part]) node.children[part] = new TrieRouteNode();

        node = node.children[part];
      }
    }

    node.routes[route.method] = route;
  }

  public match(parts: string[], method: ApiMethod): MatchResult | null {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: TrieRouteNode = this;
    let params: Record<string, string> | null = null;

    for (const part of parts) {
      if (node.children[part]) {
        node = node.children[part];
      } else if (node.paramChild) {
        if (!params) params = {};
        params[node.paramChild.paramName!] = part;
        node = node.paramChild;
      } else if (node.wildcardChild) {
        if (!params) params = {};
        params[node.wildcardChild.wildcardName!] = part;
        node = node.wildcardChild;
      } else {
        return null;
      }
    }

    const route = node.routes[method];

    if (!route) return null;

    return { route, params: params ?? EMPTY_PARAMS };
  }

  public matchUrl(url: string, method: ApiMethod): MatchResult | null {
    const start = url.indexOf('/', url.indexOf('://') + 3);
    let end = url.indexOf('?', start);

    if (end === -1) end = url.length;

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: TrieRouteNode = this;
    let params: Record<string, string> | null = null;
    let segmentStart = start + 1;

    for (let i = segmentStart; i <= end; i++) {
      if (i === end || url.charCodeAt(i) === 47 /* '/' */) {
        if (i > segmentStart) {
          const segment = url.slice(segmentStart, i);

          if (node.children[segment]) {
            node = node.children[segment];
          } else if (node.paramChild) {
            if (!params) params = {};

            params[node.paramChild.paramName!] = segment;
            node = node.paramChild;
          } else if (node.wildcardChild) {
            if (!params) params = {};

            params[node.wildcardChild.wildcardName!] = segment;
            node = node.wildcardChild;
          } else {
            return null;
          }
        }

        segmentStart = i + 1;
      }
    }

    const route = node.routes[method];

    if (!route) return null;

    return { route, params: params ?? EMPTY_PARAMS };
  }
}
