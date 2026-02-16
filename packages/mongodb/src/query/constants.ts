export const LogicalOperator = {
  AND: 'AND',
  OR: 'OR',
} as const;

export type LogicalOperator =
  (typeof LogicalOperator)[keyof typeof LogicalOperator];

export const AstType = {
  GROUP: 'GROUP',
  COMPARISON: 'COMPARISON',
  NOT: 'NOT',
  JOIN: 'JOIN',
} as const;

export type AstType = (typeof AstType)[keyof typeof AstType];

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
  BETWEEN: 'between',
  LIKE: 'like',
  REG_EXP: 'regExp',
  IS_NULL: 'isNull',
} as const;

export type AcceptedOperator =
  (typeof AcceptedOperator)[keyof typeof AcceptedOperator];

export const OperatorConversion = {
  [AcceptedOperator.EQ]: '$eq',
  [AcceptedOperator.NE]: '$ne',
  [AcceptedOperator.GT]: '$gt',
  [AcceptedOperator.LT]: '$lt',
  [AcceptedOperator.GTE]: '$gte',
  [AcceptedOperator.LTE]: '$lte',
  [AcceptedOperator.IN]: '$in',
  [AcceptedOperator.LIKE]: '$regex',
  [AcceptedOperator.REG_EXP]: '$regex',
  [AcceptedOperator.IS_NULL]: '$exists',
} as const;

export type OperatorConversion =
  (typeof OperatorConversion)[keyof typeof OperatorConversion];

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
} as const;

export type AcceptedJoin = (typeof AcceptedJoin)[keyof typeof AcceptedJoin];
