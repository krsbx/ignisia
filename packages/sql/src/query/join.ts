import { QueryBuilder } from '.';
import type { Column } from '../column';
import type { Table } from '../table';
import type { AstNode, JoinNode } from './ast';
import { AstType, type AcceptedJoin } from './constants';
import type {
  ColumnSelector,
  QueryDefinition,
  StrictColumnSelector,
} from './types';

export function addNoOnJoin<
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
  joinTable: JoinTable,
  alias: JoinAlias
) {
  if (!query.definition.joins) query.definition.joins = [];

  query.definition.joins.push({
    type: AstType.JOIN,
    alias,
    join: joinType as never,
    table: joinTable,
  });

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
      joins: JoinNode[];
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
      FinalJoinedTables extends JoinedTables & {
        [K in JoinAlias]: JoinTable;
      },
      ReturnedJoinedTables extends FinalJoinedTables = FinalJoinedTables,
    >(
      callback: (
        q: QueryBuilder<Alias, TableRef, FinalJoinedTables>
      ) => QueryBuilder<Alias, TableRef, ReturnedJoinedTables>
    ) {
      const sub = callback(new QueryBuilder(query.table));

      const subDef = sub.definition as Partial<
        QueryDefinition<Alias, TableRef, ReturnedJoinedTables>
      >;

      if (!subDef.where) {
        return query as unknown as QueryBuilder<
          Alias,
          TableRef,
          ReturnedJoinedTables,
          Omit<Definition, 'joins' | 'joinedTables'> & {
            joins: JoinNode[];
            joinedTables: ReturnedJoinedTables;
          }
        >;
      }

      if (!query.definition.joins) {
        query.definition.joins = [];
      }

      const on: AstNode = subDef.where;

      query.definition.joins.push({
        type: AstType.JOIN,
        alias,
        join: joinType as never,
        table: joinTable,
        on,
      });

      if (subDef.joins?.length) {
        query.definition.joins.push(...subDef.joins);
      }

      if (!query.definition.joinedTables) {
        query.definition.joinedTables = {} as JoinedTables;
      }

      (
        query.definition.joinedTables as unknown as Record<
          string,
          typeof joinTable
        >
      )[alias] = joinTable;

      if (subDef.joinedTables) {
        Object.assign(query.definition.joinedTables, subDef.joinedTables);
      }

      return query as unknown as QueryBuilder<
        Alias,
        TableRef,
        ReturnedJoinedTables,
        Omit<Definition, 'joins' | 'joinedTables'> & {
          joins: JoinNode[];
          joinedTables: ReturnedJoinedTables;
        }
      >;
    },
  };
}
