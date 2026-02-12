import { QueryBuilder } from '.';
import type { Column } from '../column';
import type { Table } from '../table';
import {
  AcceptedOperator,
  ConditionClause,
  LogicalOperator,
} from './constants';
import { rawCol } from './helper';
import type {
  ColumnSelector,
  QueryDefinition,
  StrictColumnSelector,
  WhereValue,
} from './types';
import { getCondition } from './utilities';

export function addRawCondition<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
  Clause extends ConditionClause,
  Logical extends LogicalOperator,
  ValidClause extends Lowercase<Clause>,
>(
  query: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  clause: Clause,
  column: (c: typeof rawCol) => string,
  logical: Logical,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any
) {
  const validClause = clause.toLowerCase() as ValidClause;

  if (!query.definition[validClause]) query.definition[validClause] = [];

  const condition = column(rawCol);

  const logicalPrefix = query.definition[validClause].length > 0 ? logical : '';

  query.definition[validClause].push(`${logicalPrefix} ${condition}`.trim());

  if (!query.definition.params) query.definition.params = [];

  if (typeof params === 'undefined') {
    return query;
  }

  if (Array.isArray(params)) {
    query.definition.params.push(...params);
  } else {
    query.definition.params.push(params);
  }

  return query as unknown as QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Omit<Definition, typeof validClause | 'params'> & {
      [Key in typeof validClause]: string[];
    } & {
      params: unknown[];
    }
  >;
}

export function rawWhere<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
>(
  this: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  column: (c: typeof rawCol) => string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any
) {
  return addRawCondition(
    this,
    ConditionClause.WHERE,
    column,
    LogicalOperator.AND,
    params
  );
}

export function rawOr<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
>(
  this: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  column: (c: typeof rawCol) => string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any
) {
  return addRawCondition(
    this,
    ConditionClause.WHERE,
    column,
    LogicalOperator.OR,
    params
  );
}

export function rawHaving<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
>(
  this: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  column: (c: typeof rawCol) => string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any
) {
  return addRawCondition(
    this,
    ConditionClause.HAVING,
    column,
    LogicalOperator.AND,
    params
  );
}

export function addCondition<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
  Clause extends ConditionClause,
  ColName extends StrictAllowedColumn,
  Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
    ? TableAlias extends Alias
      ? TableRef['columns'][TableColumn]
      : JoinedTables[TableAlias]['columns'][TableColumn]
    : never,
  Operator extends AcceptedOperator,
  Value extends WhereValue<Col>[Operator],
  Logical extends LogicalOperator,
  ValidClause extends Lowercase<Clause>,
>(
  query: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  clause: Clause,
  column: ColName,
  operator: Operator,
  value: Value,
  logical: Logical
) {
  if (!query.table.dialect) {
    throw new Error('No DB Dialect defined');
  }

  const validClause = clause.toLowerCase() as ValidClause;
  const condition = getCondition(query.table.dialect, column, operator, value);

  if (!query.definition[validClause]) query.definition[validClause] = [];

  const logicalPrefix = query.definition[validClause].length > 0 ? logical : '';

  query.definition[validClause].push(`${logicalPrefix} ${condition}`.trim());

  if (
    operator === AcceptedOperator.IS_NULL ||
    operator === AcceptedOperator.IS_NOT_NULL
  ) {
    return query as unknown as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Omit<Definition, typeof validClause> & {
        [Key in typeof validClause]: string[];
      }
    >;
  }

  if (!query.definition.params) query.definition.params = [];

  if (operator === AcceptedOperator.STARTS_WITH) {
    query.definition.params.push(`${value}%`);
  } else if (operator === AcceptedOperator.ENDS_WITH) {
    query.definition.params.push(`%${value}`);
  } else if (Array.isArray(value)) {
    query.definition.params.push(...value);
  } else {
    query.definition.params.push(value);
  }

  return query as unknown as QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Omit<Definition, typeof validClause | 'params'> & {
      [Key in typeof validClause]: string[];
    } & {
      params: unknown[];
    }
  >;
}

export function where<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
  ColName extends StrictAllowedColumn,
  Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
    ? TableAlias extends Alias
      ? TableRef['columns'][TableColumn]
      : JoinedTables[TableAlias]['columns'][TableColumn]
    : never,
  Operator extends AcceptedOperator,
  Value extends WhereValue<Col>[Operator],
>(
  this: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  column: ColName,
  operator: Operator,
  value?: Value
) {
  return addCondition(
    this,
    ConditionClause.WHERE,
    column,
    operator,
    (value || null) as Value,
    LogicalOperator.AND
  );
}

export function or<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
  ColName extends StrictAllowedColumn,
  Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
    ? TableAlias extends Alias
      ? TableRef['columns'][TableColumn]
      : JoinedTables[TableAlias]['columns'][TableColumn]
    : never,
  Operator extends AcceptedOperator,
  Value extends WhereValue<Col>[Operator],
>(
  this: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  column: ColName,
  operator: Operator,
  value?: Value
) {
  return addCondition(
    this,
    ConditionClause.WHERE,
    column,
    operator,
    (value || null) as Value,
    LogicalOperator.OR
  );
}

export function having<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
  ColName extends StrictAllowedColumn,
  Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
    ? TableAlias extends Alias
      ? TableRef['columns'][TableColumn]
      : JoinedTables[TableAlias]['columns'][TableColumn]
    : never,
  Operator extends AcceptedOperator,
  Value extends WhereValue<Col>[Operator],
>(
  this: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  column: ColName,
  operator: Operator,
  value: Value
) {
  return addCondition(
    this,
    ConditionClause.HAVING,
    column,
    operator,
    value,
    LogicalOperator.AND
  );
}

export function addGroupCondition<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
  Logical extends LogicalOperator,
>(
  query: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  logical: Logical,
  callback: (
    q: QueryBuilder<Alias, TableRef, JoinedTables>
  ) => QueryBuilder<Alias, TableRef, JoinedTables>
) {
  const sub = callback(
    new QueryBuilder<Alias, TableRef, JoinedTables>(query.table)
  );

  const subDef = sub.definition as Partial<
    QueryDefinition<Alias, TableRef, JoinedTables>
  >;

  if (!subDef.where?.length) return query;

  const grouped = `(${subDef.where.join(' ')})`;

  if (!query.definition.where) query.definition.where = [];

  const logicalPrefix = query.definition.where.length > 0 ? logical : '';

  query.definition.where.push(`${logicalPrefix} ${grouped}`.trim());

  if (subDef.params?.length) {
    if (!query.definition.params) query.definition.params = [];
    query.definition.params.push(...subDef.params);
  }

  return query as unknown as QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Omit<Definition, 'where' | 'params'> & {
      where: string[];
      params: unknown[];
    }
  >;
}

export function whereGroup<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
>(
  this: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  callback: (
    q: QueryBuilder<Alias, TableRef, JoinedTables>
  ) => QueryBuilder<Alias, TableRef, JoinedTables>
) {
  return addGroupCondition(this, LogicalOperator.AND, callback);
}

export function orGroup<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
>(
  this: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  callback: (
    q: QueryBuilder<Alias, TableRef, JoinedTables>
  ) => QueryBuilder<Alias, TableRef, JoinedTables>
) {
  return addGroupCondition(this, LogicalOperator.OR, callback);
}
