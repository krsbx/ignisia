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
  getWhereConditions,
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
>(this: Query, dialect?: Dialect | null) {
  const parts: string[] = [];

  switch (this.definition.queryType) {
    case QueryType.SELECT:
      parts.push(buildSelectQuery(this));
      break;

    case QueryType.INSERT:
      parts.push(buildInsertQuery(this));
      break;

    case QueryType.UPDATE:
      parts.push(buildUpdateQuery(this));
      break;

    case QueryType.DELETE:
      parts.push(buildDeleteQuery(this));
      break;

    default:
      throw new Error('No query type defined');
  }

  if (this.definition?.joins?.length) {
    parts.push(this.definition.joins.join(' '));
  }

  const whereConditions = getWhereConditions(this);

  if (whereConditions.length) {
    parts.push(`WHERE ${whereConditions.join(' ')}`);
  }

  const groupByConditions = getGroupByConditions(this);

  if (groupByConditions.length) {
    parts.push(`GROUP BY ${groupByConditions.join(', ')}`);
  }

  if (this.definition?.having?.length) {
    parts.push(`HAVING ${this.definition.having.join(' ')}`);
  }

  if (this.definition?.orderBy?.length) {
    parts.push(
      `ORDER BY ${this.definition.orderBy
        .map((order) => `${order.column} ${order.direction}`)
        .join(', ')}`
    );
  }

  if (this.definition?.limit !== null) {
    parts.push('LIMIT ?');

    if (!this.definition.params) this.definition.params = [];

    this.definition.params.push(this.definition.limit);
  }

  if (this.definition?.offset !== null) {
    parts.push('OFFSET ?');

    if (!this.definition.params) this.definition.params = [];

    this.definition.params.push(this.definition.offset);
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

  return { query: `${sql};`, params: this.definition.params };
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

  let result = await client.exec<never[]>({
    sql: query,
    params,
    tx,
  });

  // Workaround for MySQL to make UPDATE and DELETE queries behave the same across dialects
  if (isMySQL && isReturning) {
    // Clone the query object
    const query = this.clone();
    query.definition.queryType = QueryType.SELECT;

    result = await client.exec({
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

  return result.map((r) =>
    parseAliasedRow({
      row: r,
      selects: this.definition.select ?? [],
      root: this.definition?.baseAlias ?? this.table.name,
    })
  ) as Output;
}
