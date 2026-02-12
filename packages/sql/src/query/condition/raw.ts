import type { QueryBuilder } from '..';
import type { Column } from '../../column';
import type { Table } from '../../table';
import { ConditionClause, LogicalOperator } from '../constants';
import { rawCol } from '../helper';
import type {
  ColumnSelector,
  QueryDefinition,
  StrictColumnSelector,
} from '../types';

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
