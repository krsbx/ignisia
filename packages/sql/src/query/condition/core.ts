import { QueryBuilder } from '..';
import type { Column } from '../../column';
import type { Table } from '../../table';
import {
  AcceptedOperator,
  ConditionClause,
  LogicalOperator,
} from '../constants';
import type {
  ColumnSelector,
  QueryDefinition,
  StrictColumnSelector,
  WhereValue,
} from '../types';
import { getCondition } from '../utilities';

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
  logical: Logical,
  negate: boolean
) {
  if (!query.table.dialect) {
    throw new Error('No DB Dialect defined');
  }

  const isOn = logical === LogicalOperator.ON;

  const validClause = clause.toLowerCase() as ValidClause;
  let condition = getCondition(query.table.dialect, column, operator, value);

  if (isOn) {
    condition = condition.replace('?', value as string);
  }

  if (!query.definition[validClause]) query.definition[validClause] = [];

  const logicalPrefix =
    query.definition[validClause].length > 0
      ? isOn
        ? LogicalOperator.AND
        : logical
      : '';
  const not = negate ? 'NOT ' : '';

  query.definition[validClause].push(
    `${logicalPrefix} ${not}${condition}`.trim()
  );

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

  if (!isOn) {
    if (operator === AcceptedOperator.STARTS_WITH) {
      query.definition.params.push(`${value}%`);
    } else if (operator === AcceptedOperator.ENDS_WITH) {
      query.definition.params.push(`%${value}`);
    } else if (Array.isArray(value)) {
      query.definition.params.push(...value);
    } else {
      query.definition.params.push(value);
    }
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
  ) => QueryBuilder<Alias, TableRef, JoinedTables>,
  negate: boolean
) {
  const sub = callback(new QueryBuilder(query.table));

  const subDef = sub.definition as Partial<
    QueryDefinition<Alias, TableRef, JoinedTables>
  >;

  if (!subDef.where?.length) return query;

  const not = negate ? 'NOT ' : '';
  const grouped = `${not}(${subDef.where.join(' ')})`;

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
