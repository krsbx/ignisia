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
  LIKE: 'like',
  ILIKE: 'ilike',
  IS_NULL: 'isNull',
  BETWEEN: 'between',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
  REG_EXP: 'regExp',
  RLIKE: 'rlike',
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

export const QueryHooksType = {
  AFTER: 'after',
  BEFORE: 'before',
} as const;

export type QueryHooksType =
  (typeof QueryHooksType)[keyof typeof QueryHooksType];

export const ExplainFormat = {
  JSON: 'JSON',
  TEXT: 'TEXT',
  YAML: 'YAML',
  XML: 'XML',
} as const;

export type ExplainFormat = (typeof ExplainFormat)[keyof typeof ExplainFormat];

export const ExplainClause = {
  FORMAT: 'FORMAT',
  ANALYZE: 'ANALYZE',
  VERBOSE: 'VERBOSE',
  COSTS: 'COSTS',
  BUFFERS: 'BUFFERS',
  SUMMARY: 'SUMMARY',
  TIMING: 'TIMING',
} as const;

export type ExplainClause = (typeof ExplainClause)[keyof typeof ExplainClause];
