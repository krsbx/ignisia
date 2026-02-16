export type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

export type BuildTuple<
  N extends number,
  T extends unknown[] = [],
> = T['length'] extends N ? T : BuildTuple<N, [...T, unknown]>;

export type Add<
  A extends number,
  B extends number,
  Result extends unknown[] = [...BuildTuple<A>, ...BuildTuple<B>],
> = Result['length'] extends number ? Result['length'] : never;

export type Subtract<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Rest]
    ? Rest['length']
    : never;

export type Multiply<
  A extends number,
  B extends number,
  Result extends unknown[] = [],
> = B extends 0
  ? Result['length']
  : Multiply<A, Subtract<B, 1>, [...Result, ...BuildTuple<A>]>;
