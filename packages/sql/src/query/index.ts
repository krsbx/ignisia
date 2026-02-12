import type { Column } from '../column';
import type { Table } from '../table';
import { quoteIdentifier } from '../utilities';
import {
  having,
  or,
  orGroup,
  rawHaving,
  rawOr,
  rawWhere,
  where,
  whereGroup,
} from './condition';
import { AcceptedJoin, QueryType } from './constants';
import type {
  QueryConditionContract,
  QueryTransformerContract,
} from './contract';
import { aggregateCol, alias, clone, col } from './helper';
import { addJoin } from './join';
import { exec, toQuery, toString } from './sql';
import type {
  AcceptedInsertValues,
  AcceptedOrderBy,
  AcceptedUpdateValues,
  AggregateColumn,
  AliasedColumn,
  ColumnSelector,
  QuerHooks,
  QueryDefinition,
  QueryOutput,
  RawColumn,
  StrictColumnSelector,
} from './types';
import { getParanoid, getTimestamp } from './utilities';

export class QueryBuilder<
  Alias extends TableRef['name'],
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<
    string,
    Table<string, Record<string, Column>>
  > = NonNullable<unknown>,
  Definition extends Partial<
    QueryDefinition<Alias, TableRef, JoinedTables>
  > = NonNullable<unknown>,
  AllowedColumn extends ColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  > = ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  > = StrictColumnSelector<Alias, TableRef, JoinedTables>,
> {
  public readonly hooks: Partial<QuerHooks>;
  public readonly table: TableRef;
  public readonly definition: Definition;
  public readonly _output!: QueryOutput<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn
  >;

  public alias: QueryTransformerContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['alias'];
  public clone: QueryTransformerContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['clone'];

  public toQuery: QueryTransformerContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['toQuery'];
  public toString: QueryTransformerContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['toString'];
  public exec: QueryTransformerContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['exec'];

  public rawWhere: QueryConditionContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['rawWhere'];
  public rawAnd: QueryConditionContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['rawWhere'];
  public rawOr: QueryConditionContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['rawOr'];
  public rawHaving: QueryConditionContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['rawHaving'];

  public where: QueryConditionContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['where'];
  public and: QueryConditionContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['where'];
  public or: QueryConditionContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['or'];
  public having: QueryConditionContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['having'];

  public whereGroup: QueryConditionContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['whereGroup'];
  public orGroup: QueryConditionContract<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >['orGroup'];

  constructor(table: TableRef) {
    this.hooks = {};
    this.table = table;
    this.definition = {
      queryType: null,
      select: null,
      having: null,
      where: null,
      params: null,
      limit: null,
      offset: null,
      groupBy: null,
      insertValues: null,
      updateValues: null,
      orderBy: null,
      aggregates: null,
      joins: null,
      distinct: null,
      baseAlias: table.name,
      joinedTables: null,
      withDeleted: null,
    } as Definition;

    this.alias = alias.bind(this) as this['alias'];
    this.clone = clone.bind(this) as this['clone'];

    this.toQuery = toQuery.bind(this) as this['toQuery'];
    this.toString = toString.bind(this) as this['toString'];
    this.exec = exec.bind(this) as this['exec'];

    this.rawWhere = rawWhere.bind(this) as this['rawWhere'];
    this.rawHaving = rawHaving.bind(this) as this['rawHaving'];

    this.rawAnd = this.rawWhere;
    this.rawOr = rawOr.bind(this) as this['rawOr'];

    this.where = where.bind(this) as this['where'];
    this.having = having.bind(this) as this['having'];

    this.and = this.where as this['and'];
    this.or = or.bind(this) as this['or'];

    this.whereGroup = whereGroup.bind(this) as unknown as this['whereGroup'];
    this.orGroup = orGroup.bind(this) as unknown as this['orGroup'];
  }

  public leftJoin<
    JoinTable extends Table<string, Record<string, Column>>,
    JoinAlias extends string,
    BaseColName extends `${Alias}."${keyof TableRef['columns'] & string}"`,
    JoinColName extends `${JoinAlias}."${keyof JoinTable['columns'] & string}"`,
  >(
    joinTable: JoinTable,
    alias: JoinAlias,
    baseColumn: BaseColName,
    joinColumn: JoinColName
  ) {
    return addJoin(
      this,
      AcceptedJoin.LEFT,
      alias,
      joinTable,
      baseColumn,
      joinColumn
    );
  }

  public rightJoin<
    JoinTable extends Table<string, Record<string, Column>>,
    JoinAlias extends string,
    BaseColName extends `${Alias}."${keyof TableRef['columns'] & string}"`,
    JoinColName extends `${JoinAlias}."${keyof JoinTable['columns'] & string}"`,
  >(
    joinTable: JoinTable,
    alias: JoinAlias,
    baseColumn: BaseColName,
    joinColumn: JoinColName
  ) {
    return addJoin(
      this,
      AcceptedJoin.RIGHT,
      alias,
      joinTable,
      baseColumn,
      joinColumn
    );
  }

  public innerJoin<
    JoinTable extends Table<string, Record<string, Column>>,
    JoinAlias extends string,
    BaseColName extends `${Alias}."${keyof TableRef['columns'] & string}"`,
    JoinColName extends `${JoinAlias}."${keyof JoinTable['columns'] & string}"`,
  >(
    joinTable: JoinTable,
    alias: JoinAlias,
    baseColumn: BaseColName,
    joinColumn: JoinColName
  ) {
    return addJoin(
      this,
      AcceptedJoin.INNER,
      alias,
      joinTable,
      baseColumn,
      joinColumn
    );
  }

  public naturalJoin<
    JoinTable extends Table<string, Record<string, Column>>,
    JoinAlias extends string,
    BaseColName extends `${Alias}."${keyof TableRef['columns'] & string}"`,
    JoinColName extends `${JoinAlias}."${keyof JoinTable['columns'] & string}"`,
  >(
    joinTable: JoinTable,
    alias: JoinAlias,
    baseColumn: BaseColName,
    joinColumn: JoinColName
  ) {
    return addJoin(
      this,
      AcceptedJoin.NATURAL,
      alias,
      joinTable,
      baseColumn,
      joinColumn
    );
  }

  public distinct() {
    this.definition.distinct = true;

    return this as unknown as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition & { distinct: true }
    >;
  }

  public aggregate<
    Aggregates extends Array<
      (c: typeof aggregateCol) => AggregateColumn<AllowedColumn>
    >,
  >(...aggregates: Aggregates) {
    this.definition.aggregates = aggregates.map((aggregate) =>
      aggregate(aggregateCol)
    );

    return this as unknown as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Omit<Definition, 'aggregates'> & {
        aggregates: {
          [K in keyof Aggregates]: Aggregates[K] extends (col: never) => infer R
            ? R
            : Aggregates[K];
        };
      }
    >;
  }

  public groupBy<
    Groupable extends NonNullable<Definition['select']>,
    Columns extends Groupable extends readonly (infer Col)[]
      ? Col extends RawColumn<StrictAllowedColumn>
        ? Col[]
        : Col extends AliasedColumn<StrictAllowedColumn, infer Alias>
          ? Alias[]
          : StrictAllowedColumn[]
      : StrictAllowedColumn[],
  >(...columns: Columns) {
    this.definition.groupBy = columns as Columns;

    return this as unknown as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition & { groupBy: Columns }
    >;
  }

  public limit<Limit extends number | null>(limit: Limit) {
    this.definition.limit = limit;

    return this as unknown as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition & { limit: Limit }
    >;
  }

  public offset<Offset extends number | null>(offset: Offset) {
    this.definition.offset = offset;

    return this as unknown as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition & { offset: Offset }
    >;
  }

  public orderBy<OrderBy extends AcceptedOrderBy<StrictAllowedColumn>>(
    ...orderBy: OrderBy[]
  ) {
    if (!this.definition.orderBy) this.definition.orderBy = [];

    this.definition.orderBy.push(...orderBy);

    return this as unknown as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition & { orderBy: OrderBy }
    >;
  }

  public withDeleted() {
    this.definition.withDeleted = true;

    return this as unknown as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition & { withDeleted: true }
    >;
  }

  public select<
    Base extends Definition['baseAlias'] extends string
      ? Definition['baseAlias']
      : TableRef['name'],
    Columns extends TableRef['columns'],
  >(): QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Omit<Definition, 'queryType' | 'select'> & {
      queryType: typeof QueryType.SELECT;
      select: Array<`${Base}."${keyof Columns & string}"`>;
    }
  >;
  public select<
    Columns extends Array<
      | RawColumn<AllowedColumn>
      | ((c: typeof col) => AliasedColumn<AllowedColumn, string>)
    >,
  >(
    ...columns: Columns
  ): QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition & {
      queryType: typeof QueryType.SELECT;
      select: {
        [K in keyof Columns]: Columns[K] extends (col: never) => infer R
          ? R
          : Columns[K];
      };
    }
  >;
  public select(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...columns: any[]
  ) {
    if (!columns.length) {
      const base = this.definition.baseAlias ?? this.table.name;

      columns = Object.keys(this.table.columns).map(
        (colName) => `${base}.${quoteIdentifier(colName)}`
      );
    } else {
      columns = columns.map((column) => {
        if (typeof column === 'function') {
          return column(col);
        }

        return column;
      });
    }

    this.definition.select = columns;
    this.definition.queryType = QueryType.SELECT;

    return this as never;
  }

  public insert(...values: AcceptedInsertValues<TableRef['columns']>) {
    this.definition.queryType = QueryType.INSERT;

    if (!this.definition.insertValues) this.definition.insertValues = [];

    const {
      isWithTimestamp,
      isHasCreatedAt,
      isHasUpdatedAt,
      createdAt,
      updatedAt,
      timestamp,
    } = getTimestamp(this.table);

    values = values.map((row) => {
      const fields: Record<string, unknown> = {};

      for (const key in this.table.columns) {
        fields[key] = row[key as keyof typeof row] ?? null;
      }

      if (isWithTimestamp && isHasCreatedAt) {
        fields[createdAt] = row[createdAt as keyof typeof row] ?? timestamp;
      }

      if (isWithTimestamp && isHasUpdatedAt) {
        fields[updatedAt] = row[updatedAt as keyof typeof row] ?? timestamp;
      }

      return fields;
    }) as AcceptedInsertValues<TableRef['columns']>;

    this.definition.insertValues = values as AcceptedInsertValues<
      TableRef['columns']
    >;

    return this as unknown as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Omit<Definition, 'queryType' | 'insertValues'> & {
        queryType: typeof QueryType.INSERT;
        insertValues: AcceptedInsertValues<TableRef['columns']>;
      }
    >;
  }

  public update<Values extends AcceptedUpdateValues<TableRef['columns']>>(
    values: Values
  ) {
    const { isWithTimestamp, isHasUpdatedAt, updatedAt, timestamp } =
      getTimestamp(this.table);

    if (isWithTimestamp && isHasUpdatedAt) {
      values = {
        ...values,
        [updatedAt]: values[updatedAt as keyof typeof values] ?? timestamp,
      };
    }

    this.definition.queryType = QueryType.UPDATE;
    this.definition.updateValues = values;

    return this as unknown as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Omit<Definition, 'queryType' | 'updateValues'> & {
        queryType: typeof QueryType.UPDATE;
        updateValues: Values;
      }
    >;
  }

  public delete() {
    const { isWithParanoid, deletedAt, timestamp } = getParanoid(this.table);

    if (isWithParanoid) {
      return this.update({
        [deletedAt]: timestamp,
      } as AcceptedUpdateValues<TableRef['columns']>);
    }

    this.definition.queryType = QueryType.DELETE;

    return this as unknown as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Omit<Definition, 'queryType'> & { queryType: typeof QueryType.DELETE }
    >;
  }

  public infer(): this['_output'] {
    return null as never;
  }
}
