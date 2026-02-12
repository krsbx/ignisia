import type { QueryBuilder } from '.';
import type { Column } from '../column';
import type { Table } from '../table';
import type { AcceptedJoin } from './constants';
import type {
  ColumnSelector,
  QueryDefinition,
  StrictColumnSelector,
} from './types';

function addJoin<
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
  JoinType extends AcceptedJoin,
  JoinTable extends Table<string, Record<string, Column>>,
  JoinAlias extends string,
  BaseColName extends `${Alias}."${keyof TableRef['columns'] & string}"`,
  JoinColName extends `${JoinAlias}."${keyof JoinTable['columns'] & string}"`,
  FinalJoinedTables extends JoinedTables & { [K in JoinAlias]: JoinTable },
>(
  query: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  joinType: JoinType,
  alias: JoinAlias,
  joinTable: JoinTable,
  baseColumn: BaseColName,
  joinColumn: JoinColName
) {
  if (!query.definition.joins) query.definition.joins = [];

  query.definition.joins.push(
    `${joinType} JOIN ${joinTable.name} AS ${alias} ON ${
      baseColumn
    } = ${joinColumn}`
  );

  if (!query.definition.joinedTables) {
    query.definition.joinedTables = {} as JoinedTables;
  }

  (
    query.definition.joinedTables as unknown as Record<string, typeof joinTable>
  )[alias] = joinTable;

  return query as unknown as QueryBuilder<
    Alias,
    TableRef,
    FinalJoinedTables,
    Omit<Definition, 'joins' | 'joinedTables'> & {
      joins: string[];
      joinedTables: FinalJoinedTables;
    }
  >;
}

export function prepareJoin<
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
  JoinType extends AcceptedJoin,
  JoinTable extends Table<string, Record<string, Column>>,
  JoinAlias extends string,
>(
  query: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  joinType: JoinType,
  joinTable: JoinTable,
  alias: JoinAlias
) {
  return {
    on<
      BaseColName extends `${Alias}."${keyof TableRef['columns'] & string}"`,
      JoinColName extends
        `${JoinAlias}."${keyof JoinTable['columns'] & string}"`,
    >(baseColumn: BaseColName, joinColumn: JoinColName) {
      return addJoin(query, joinType, alias, joinTable, baseColumn, joinColumn);
    },
  };
}
