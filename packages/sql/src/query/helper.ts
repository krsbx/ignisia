import { QueryBuilder } from '.';
import type { Column } from '../column';
import type { Table } from '../table';
import { cloneDefinition } from '../utilities';
import type { AggregationFunction } from './constants';
import type {
  ColumnSelector,
  QueryDefinition,
  StrictColumnSelector,
} from './types';

export function alias<
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
  NewAlias extends string,
>(
  this: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  alias: NewAlias
) {
  this.definition.baseAlias = alias as unknown as Alias;

  return this as unknown as QueryBuilder<
    NewAlias,
    TableRef,
    JoinedTables,
    Omit<Definition, 'baseAlias'> & { baseAlias: NewAlias }
  >;
}

export function clone<
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
  >
) {
  const query = new QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >(this.table);

  Object.assign(query.definition, cloneDefinition(this.definition));

  return query;
}

export function rawCol<
  StrictAllowedColumn extends string,
  ColName extends StrictAllowedColumn = StrictAllowedColumn,
>(column: ColName) {
  return column;
}

export function col<
  StrictAllowedColumn extends string,
  ColName extends StrictAllowedColumn = StrictAllowedColumn,
  ColAlias extends string = string,
>(column: ColName, alias: ColAlias) {
  return {
    column,
    as: alias,
  } as const;
}

export function aggregateCol<
  StrictAllowedColumn extends string,
  Aggregate extends AggregationFunction = AggregationFunction,
  ColName extends StrictAllowedColumn = StrictAllowedColumn,
>(
  fn: Aggregate,
  column: ColName
): {
  column: ColName;
  as: Lowercase<Aggregate>;
  fn: Aggregate;
};
export function aggregateCol<
  StrictAllowedColumn extends string,
  Aggregate extends AggregationFunction = AggregationFunction,
  ColName extends StrictAllowedColumn = StrictAllowedColumn,
  ColAlias extends string = string,
>(
  fn: Aggregate,
  column: ColName,
  alias: ColAlias
): {
  column: ColName;
  as: ColAlias;
  fn: Aggregate;
};
export function aggregateCol<
  StrictAllowedColumn extends string,
  Aggregate extends AggregationFunction = AggregationFunction,
  ColName extends StrictAllowedColumn = StrictAllowedColumn,
  ColAlias extends string = string,
>(fn: Aggregate, column: ColName, alias?: ColAlias) {
  return {
    column,
    as: alias ?? fn.toLowerCase(),
    fn,
  };
}
