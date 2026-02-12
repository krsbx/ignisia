import type { Column } from '../column';
import type { AcceptedColumnTypes } from '../column/constants';
import type { Table } from '../table';
import type { UnionToIntersection } from '../types';
import type {
  AcceptedOperator,
  AggregationFunction,
  OrderBy,
  QueryHooksType,
  QueryType,
} from './constants';

export type ColumnSelector<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
> =
  | `${Alias}."${keyof TableRef['columns'] & string}"`
  | `${Alias}.*`
  | {
      [A in keyof JoinedTables]:
        | `${A & string}."${keyof JoinedTables[A]['columns'] & string}"`
        | `${A & string}.*`;
    }[keyof JoinedTables];

export type StrictColumnSelector<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
> =
  | `${Alias}."${keyof TableRef['columns'] & string}"`
  | {
      [A in keyof JoinedTables]: `${A & string}."${keyof JoinedTables[A]['columns'] & string}"`;
    }[keyof JoinedTables];

export type WhereValue<T extends Column> = {
  [K in AcceptedOperator]: K extends
    | typeof AcceptedOperator.BETWEEN
    | typeof AcceptedOperator.NOT_BETWEEN
    ? [T['_output'], T['_output']]
    : K extends typeof AcceptedOperator.IN | typeof AcceptedOperator.NOT_IN
      ? T['_output'][]
      : K extends
            | typeof AcceptedOperator.IS_NULL
            | typeof AcceptedOperator.IS_NOT_NULL
        ? never
        : K extends
              | typeof AcceptedOperator.STARTS_WITH
              | typeof AcceptedOperator.ENDS_WITH
          ? T['_output']
          : T['_output'];
};

export type AcceptedOrderBy<Columns extends string> = {
  column: Columns;
  direction: OrderBy;
};

type InsertValuesParser<Columns extends Record<string, Column>> = {
  [ColName in keyof Columns]: {
    output: Columns[ColName]['_output'];
    required: Columns[ColName]['type'] extends typeof AcceptedColumnTypes.SERIAL
      ? false
      : Columns[ColName]['definition'] extends { autoIncrement: true }
        ? false
        : Columns[ColName]['definition'] extends { default: unknown }
          ? false
          : Columns[ColName]['definition'] extends { notNull: true }
            ? true
            : false;
  };
};

type InsertValuesParserRequired<
  Parsed extends InsertValuesParser<Record<string, Column>>,
> = {
  [ColName in keyof Parsed as Parsed[ColName]['required'] extends true
    ? ColName
    : never]: Parsed[ColName]['output'];
};

type InsertValuesParserOptional<
  Parsed extends InsertValuesParser<Record<string, Column>>,
> = {
  [ColName in keyof Parsed as Parsed[ColName]['required'] extends false
    ? ColName
    : never]?: Parsed[ColName]['output'];
};

export type AcceptedInsertValues<
  Columns extends Record<string, Column>,
  Parsed extends InsertValuesParser<Columns> = InsertValuesParser<Columns>,
  Required extends
    InsertValuesParserRequired<Parsed> = InsertValuesParserRequired<Parsed>,
  Optional extends
    InsertValuesParserOptional<Parsed> = InsertValuesParserOptional<Parsed>,
> = Array<Required & Optional>;

export type AcceptedUpdateValues<Columns extends Record<string, Column>> = {
  [ColName in keyof Columns]?: Columns[ColName]['_output'];
};

export type RawColumn<AllowedColumn extends string> = AllowedColumn;

export type AliasedColumn<
  Allowed extends string,
  Alias extends string = string,
> = {
  column: Allowed;
  as: Alias;
};

export type SelectableColumn<Allowed extends string> =
  | RawColumn<Allowed>
  | AliasedColumn<Allowed>;

export type AggregateColumn<
  Allowed extends string,
  Fn extends AggregationFunction = AggregationFunction,
  Alias extends string = string,
> = {
  column: Allowed;
  as?: Alias | Fn;
  fn: AggregationFunction;
};

export interface QueryDefinition<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<
    string,
    Table<string, Record<string, Column>>
  > = NonNullable<unknown>,
  AllowedColumn extends ColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  > = ColumnSelector<Alias, TableRef, JoinedTables>,
> {
  queryType: QueryType | null;
  select: SelectableColumn<AllowedColumn>[] | null;
  where: string[] | null;
  having: string[] | null;
  params: unknown[] | null;
  limit: number | null;
  offset: number | null;
  groupBy: AllowedColumn[] | null;
  insertValues: AcceptedInsertValues<TableRef['columns']> | null;
  updateValues: AcceptedUpdateValues<TableRef['columns']> | null;
  orderBy: AcceptedOrderBy<AllowedColumn>[] | null;
  aggregates: AggregateColumn<AllowedColumn>[] | null;
  distinct: boolean | null;
  joins: string[] | null;
  baseAlias: Alias | null;
  withDeleted: boolean | null;
  joinedTables: JoinedTables | null;
}

type InsertUpdateDeleteQueryOutput<
  TableRef extends Table<string, Record<string, Column>>,
> = {
  [K in keyof TableRef['columns']]: TableRef['columns'][K]['_output'];
};

type InferAliasedColumn<
  Current extends AliasedColumn<string, string>,
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
> = Current extends {
  column: `${infer TableAlias}."${infer ColName}"`;
  as: `${infer ColAlias}`;
}
  ? TableAlias extends keyof JoinedTables
    ? {
        [T in TableAlias]: {
          [K in ColAlias]: JoinedTables[T]['columns'][ColName]['_output'];
        };
      }
    : TableAlias extends Alias | TableRef['name']
      ? {
          [K in ColName as ColAlias]: TableRef['columns'][K]['_output'];
        }
      : NonNullable<unknown>
  : NonNullable<unknown>;

type InferRawColumn<
  Current extends string,
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
> = Current extends `${infer TableAlias}."${infer ColName}"`
  ? TableAlias extends keyof JoinedTables
    ? {
        [T in TableAlias]: {
          [K in ColName]: JoinedTables[T]['columns'][K]['_output'];
        };
      }
    : TableAlias extends Alias | TableRef['name']
      ? {
          [K in ColName]: TableRef['columns'][K]['_output'];
        }
      : NonNullable<unknown>
  : Current extends `${infer TableAlias}.${infer ColName}`
    ? ColName extends '*'
      ? TableAlias extends keyof JoinedTables
        ? {
            [T in TableAlias]: {
              [K in keyof JoinedTables[T]['columns']]: JoinedTables[T]['columns'][K]['_output'];
            };
          }
        : TableAlias extends Alias | TableRef['name']
          ? {
              [K in keyof TableRef['columns']]: TableRef['columns'][K]['_output'];
            }
          : NonNullable<unknown>
      : NonNullable<unknown>
    : NonNullable<unknown>;

type InferSelectQueryOutput<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
> = Definition extends { select: infer Select }
  ? Select extends Array<SelectableColumn<AllowedColumn>>
    ? UnionToIntersection<
        Select[number] extends infer Col
          ? Col extends RawColumn<AllowedColumn>
            ? InferRawColumn<Col, Alias, TableRef, JoinedTables>
            : Col extends AliasedColumn<AllowedColumn>
              ? InferAliasedColumn<Col, Alias, TableRef, JoinedTables>
              : NonNullable<unknown>
          : NonNullable<unknown>
      >
    : NonNullable<unknown>
  : NonNullable<unknown>;

type InferAggregateColumn<
  Current extends AggregateColumn<string>,
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
> = Current extends {
  column: `${infer TableAlias}."${infer ColName}"`;
  as: `${infer ColAlias}`;
  fn?: AggregationFunction;
}
  ? TableAlias extends keyof JoinedTables
    ? {
        [T in TableAlias]: {
          [K in ColAlias]:
            | JoinedTables[T]['columns'][ColName]['_output']
            | number;
        };
      }
    : TableAlias extends Alias | TableRef['name']
      ? {
          [K in ColName as ColAlias]:
            | TableRef['columns'][K]['_output']
            | number;
        }
      : NonNullable<unknown>
  : NonNullable<unknown>;

type InferAggregateQueryOutput<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
> = Definition extends { aggregates: infer Aggregates }
  ? Aggregates extends Array<AggregateColumn<AllowedColumn>>
    ? UnionToIntersection<
        Aggregates[number] extends infer Col
          ? Col extends RawColumn<AllowedColumn>
            ? InferRawColumn<Col, Alias, TableRef, JoinedTables>
            : Col extends AliasedColumn<AllowedColumn>
              ? InferAliasedColumn<Col, Alias, TableRef, JoinedTables>
              : Col extends AggregateColumn<AllowedColumn>
                ? InferAggregateColumn<Col, Alias, TableRef, JoinedTables>
                : NonNullable<unknown>
          : NonNullable<unknown>
      >
    : NonNullable<unknown>
  : NonNullable<unknown>;

export type SelectQueryOutput<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
> = InferSelectQueryOutput<
  Alias,
  TableRef,
  JoinedTables,
  Definition,
  AllowedColumn
> &
  InferAggregateQueryOutput<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn
  >;

export type QueryOutput<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
> = Definition extends { queryType: infer Type }
  ? Type extends null
    ? never
    : Type extends
          | typeof QueryType.INSERT
          | typeof QueryType.UPDATE
          | typeof QueryType.DELETE
      ? InsertUpdateDeleteQueryOutput<TableRef>[]
      : Type extends typeof QueryType.SELECT
        ? SelectQueryOutput<
            Alias,
            TableRef,
            JoinedTables,
            Definition,
            AllowedColumn
          >[]
        : never
  : never;

export interface QueryRunHooksOptions {
  query: string;
  hook: QueryHooksType;
  params: unknown[] | null | undefined;
  type: QueryType;
}

export interface QueryRunHooks {
  (options: QueryRunHooksOptions): void;
}

export interface QuerHooks {
  after: Set<QueryRunHooks>;
  before: Set<QueryRunHooks>;
}
