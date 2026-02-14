export const LogicalOperator = {
  AND: 'AND',
  OR: 'OR',
  ON: 'ON',
} as const;

export type LogicalOperator =
  (typeof LogicalOperator)[keyof typeof LogicalOperator];

export const ConditionClause = {
  WHERE: 'WHERE',
  HAVING: 'HAVING',
} as const;

export type ConditionClause =
  (typeof ConditionClause)[keyof typeof ConditionClause];

export const AcceptedOperator = {
  EQ: 'eq',
  NE: 'ne',
  GT: 'gt',
  LT: 'lt',
  GTE: 'gte',
  LTE: 'lte',
  IN: 'in',
  NOT_IN: 'notIn',
  LIKE: 'like',
  NOT_LIKE: 'notLike',
  ILIKE: 'ilike',
  NOT_ILIKE: 'notILike',
  IS_NULL: 'isNull',
  IS_NOT_NULL: 'isNotNull',
  BETWEEN: 'between',
  NOT_BETWEEN: 'notBetween',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
  REG_EXP: 'regExp',
  NOT_REG_EXP: 'notRegExp',
  RLIKE: 'rlike',
  NOT_RLIKE: 'notRlike',
} as const;

export type AcceptedOperator =
  (typeof AcceptedOperator)[keyof typeof AcceptedOperator];

export const QueryType = {
  SELECT: 'SELECT',
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;

export type QueryType = (typeof QueryType)[keyof typeof QueryType];

export const OrderBy = {
  ASC: 'ASC',
  DESC: 'DESC',
} as const;

export type OrderBy = (typeof OrderBy)[keyof typeof OrderBy];

export const AggregationFunction = {
  COUNT: 'COUNT',
  SUM: 'SUM',
  MIN: 'MIN',
  MAX: 'MAX',
  AVG: 'AVG',
} as const;

export type AggregationFunction =
  (typeof AggregationFunction)[keyof typeof AggregationFunction];

export const AcceptedJoin = {
  INNER: 'INNER',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  FULL: 'FULL OUTER',
  CROSS: 'CROSS',
  NATURAL: 'NATURAL',
} as const;

export type AcceptedJoin = (typeof AcceptedJoin)[keyof typeof AcceptedJoin];
