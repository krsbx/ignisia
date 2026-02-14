import type { QueryBuilder } from '.';
import type { Column } from '../column';
import type { Table } from '../table';
import { Dialect } from '../table/constants';
import { ExplainClause } from './constants';
import type {
  ColumnSelector,
  ExplainOptions,
  QueryDefinition,
  StrictColumnSelector,
} from './types';

function buildPostgresExplainQuery(options: Partial<ExplainOptions>) {
  const clauses: string[] = [];

  if (options?.format) {
    clauses.push(`${ExplainClause.FORMAT} ${options.format}`);
  }

  if (options?.analyze) {
    clauses.push(ExplainClause.ANALYZE);

    if (options?.summary != null) {
      clauses.push(
        `${ExplainClause.SUMMARY} ${options.summary ? 'ON' : 'OFF'}`
      );
    }

    if (options?.timing != null)
      clauses.push(`${ExplainClause.TIMING} ${options.timing ? 'ON' : 'OFF'}`);
  }

  if (options?.verbose) {
    clauses.push(`${ExplainClause.VERBOSE} ${options.verbose ? 'ON' : 'OFF'}`);
  }

  if (options?.costs != null) {
    clauses.push(`${ExplainClause.COSTS} ${options.costs ? 'ON' : 'OFF'}`);
  }

  if (options?.buffers != null) {
    clauses.push(`${ExplainClause.BUFFERS} ${options.buffers ? 'ON' : 'OFF'}`);
  }

  if (clauses.length === 0) {
    return 'EXPLAIN ';
  }

  return `EXPLAIN (${clauses.join(', ')})`;
}

function buildMySqlExplainQuery(options: Partial<ExplainOptions>) {
  const clauses: string[] = [];

  if (options.analyze) {
    clauses.push(ExplainClause.ANALYZE);
  }

  if (options.format) {
    clauses.push(`${ExplainClause.FORMAT}=${options.format}`);
  }

  if (clauses.length > 1) {
    throw new Error('Only one explain clause is allowed');
  }

  return `EXPLAIN ${clauses.join(' ')}`;
}

function buildSqliteExplainQuery() {
  const clauses: string[] = ['QUERY PLAN'];

  return `EXPLAIN ${clauses.join(' ')}`;
}

export function buildExplainQuery<
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
  q: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  options: Partial<ExplainOptions>
) {
  switch (q.table.dialect) {
    case Dialect.POSTGRES:
      return buildPostgresExplainQuery(options);

    case Dialect.MYSQL:
      return buildMySqlExplainQuery(options);

    case Dialect.SQLITE:
      return buildSqliteExplainQuery();

    default:
      throw new Error(`Dialect ${q.table.dialect} is not supported`);
  }
}
