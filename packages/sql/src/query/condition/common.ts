import type { QueryBuilder } from '..';
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
import { addCondition, addGroupCondition } from './core';

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
    LogicalOperator.AND,
    false
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
    LogicalOperator.OR,
    false
  );
}

export function on<
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
  Operator extends typeof AcceptedOperator.EQ | typeof AcceptedOperator.NE,
>(
  this: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  columnA: ColName,
  operator: Operator,
  columnB: ColName
) {
  return addCondition(
    this,
    ConditionClause.WHERE,
    columnA,
    operator,
    columnB,
    LogicalOperator.ON,
    false
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
    LogicalOperator.AND,
    false
  );
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
  return addGroupCondition(this, LogicalOperator.AND, callback, false);
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
  return addGroupCondition(this, LogicalOperator.OR, callback, false);
}
