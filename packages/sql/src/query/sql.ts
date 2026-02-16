import type { TransactionSQL } from 'bun';
import type { QueryBuilder } from '.';
import type { Column } from '../column';
import type { Table } from '../table';
import { Dialect } from '../table/constants';
import {
  buildDeleteQuery,
  buildInsertQuery,
  buildSelectQuery,
  buildUpdateQuery,
} from './builder';
import { compileAst, compileJoin } from './compiler';
import { QueryHooksType, QueryType } from './constants';
import { buildExplainQuery } from './explain';
import type {
  ColumnSelector,
  ExplainOptions,
  QueryDefinition,
  StrictColumnSelector,
} from './types';
import {
  getGroupByConditions,
  parseAliasedRow,
  sanitizeParams,
} from './utilities';

export function buildQuery(query: string) {
  let index = 0;

  return query.replace(/\?/g, () => {
    index++;

    return `$${index}`;
  });
}

export function toQuery<
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
  Query extends QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
>(this: Query, dialect: Dialect | null = this.table.dialect) {
  const params: unknown[] = [];
  const parts: string[] = [];

  switch (this.definition.queryType) {
    case QueryType.SELECT:
      parts.push(buildSelectQuery(this));
      break;

    case QueryType.INSERT:
      parts.push(buildInsertQuery(this, params));
      break;

    case QueryType.UPDATE:
      parts.push(buildUpdateQuery(this, params));
      break;

    case QueryType.DELETE:
      parts.push(buildDeleteQuery(this));
      break;

    default:
      throw new Error('No query type defined');
  }

  if (this.definition?.joins?.length) {
    const joinParts: string[] = this.definition.joins.map((join) =>
      compileJoin(dialect, join, params)
    );

    parts.push(...joinParts);
  }

  if (this.definition.where) {
    const whereConditions = compileAst(dialect, this.definition.where, params);

    parts.push(`WHERE ${whereConditions}`);
  }

  const groupByConditions = getGroupByConditions(this);

  if (groupByConditions.length) {
    parts.push(`GROUP BY ${groupByConditions.join(', ')}`);
  }

  if (this.definition?.having) {
    const havingConditions = compileAst(
      dialect,
      this.definition.having,
      params
    );

    parts.push(`HAVING ${havingConditions}`);
  }

  if (this.definition?.orderBy?.length) {
    parts.push(
      `ORDER BY ${this.definition.orderBy
        .map((order) => `${order.column} ${order.direction}`)
        .join(', ')}`
    );
  }

  if (this.definition?.limit != null) {
    parts.push('LIMIT ?');

    params.push(this.definition.limit);
  }

  if (this.definition?.offset != null) {
    parts.push('OFFSET ?');

    params.push(this.definition.offset);
  }

  if (
    this.definition.queryType === QueryType.UPDATE ||
    this.definition.queryType === QueryType.DELETE
  ) {
    if (dialect !== Dialect.MYSQL) {
      parts.push('RETURNING *');
    }
  }

  const sql = buildQuery(parts.join(' '));

  return { query: `${sql};`, params: params };
}

export function toString<
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
  Query extends QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
>(this: Query) {
  return this.toQuery().query;
}

export function toDebugString<
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
  Query extends QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
>(this: Query) {
  const { query, params } = this.toQuery();

  if (!params || params.length === 0) {
    return query;
  }

  // Replace $1, $2, etc. with sanitized parameter values
  let debugQuery = query;

  sanitizeParams(params).forEach((param, index) => {
    const value =
      param === null ? 'NULL' : `'${String(param).replace(/'/g, "''")}'`;

    debugQuery = debugQuery.replace(
      new RegExp(`\\$${index + 1}\\b`, 'g'),
      value
    );
  });

  return debugQuery;
}

export function explain<
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
  Query extends QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
>(this: Query, options: ExplainOptions = {}) {
  const { query, params } = this.toQuery();

  const explainPrefix = buildExplainQuery(this, options);

  if (!this.table.client) {
    throw new Error('Database client not defined');
  }

  return this.table.client.exec({
    sql: `${explainPrefix}${query}`,
    params,
  });
}

export async function exec<
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
  Query extends QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  Output extends Query['_output'] = Query['_output'],
>(this: Query, tx?: TransactionSQL | null) {
  const client = this.table.client;
  const dialect = this.table.dialect;
  const queryType = this.definition.queryType;
  const isUpdate = queryType === QueryType.UPDATE;
  const isDelete = queryType === QueryType.DELETE;
  const isReturning = isUpdate || isDelete;
  const isMySQL = dialect === Dialect.MYSQL;

  if (!client) {
    throw new Error('Database client not defined');
  }

  if (!queryType) {
    throw new Error('No query type defined');
  }

  const { query, params } = this.toQuery(dialect);

  if (this.hooks?.before?.size) {
    for (const hook of this.hooks.before.values()) {
      hook({
        query,
        params,
        type: queryType,
        hook: QueryHooksType.BEFORE,
      });
    }
  }

  let result: never[] = [];
  let mySqlResult: never[] = [];

  // Workaround for MySQL to make DELETE queries behave the same across dialects
  if (isMySQL && isDelete) {
    const query = this.clone().select(`${this.table.name}.*` as AllowedColumn);

    mySqlResult = await client.exec({
      sql: query.toQuery().query,
      params,
      tx,
    });
  }

  result = await client.exec<never[]>({
    sql: query,
    params,
    tx,
  });

  // Workaround for MySQL to make UPDATE queries behave the same across dialects
  if (isMySQL && isUpdate) {
    const query = this.clone().select(`${this.table.name}.*` as AllowedColumn);

    mySqlResult = await client.exec({
      sql: query.toQuery().query,
      params,
      tx,
    });
  }

  if (this.hooks?.after?.size) {
    for (const hook of this.hooks.after.values()) {
      hook({
        query,
        params,
        type: queryType,
        hook: QueryHooksType.AFTER,
      });
    }
  }

  return (isMySQL && isReturning ? mySqlResult : result).map((r) =>
    parseAliasedRow({
      row: r,
      selects: this.definition.select ?? [],
      root: this.definition?.baseAlias ?? this.table.name,
    })
  ) as Output;
}
