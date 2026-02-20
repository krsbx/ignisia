import type { QueryBuilder } from '.';
import type { Column } from '../column';
import type { Table } from '../table';
import type { Dialect } from '../table/constants';
import { escapeTableColumn } from '../utilities';
import type {
  ColumnSelector,
  QueryDefinition,
  StrictColumnSelector,
} from './types';
import { getTableSelectName } from './utilities';

export function buildSelectQuery<
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
  dialect: Dialect
) {
  const from = getTableSelectName(dialect, this);
  const columns: string[] = [];

  if (this.definition.select?.length) {
    for (const col of this.definition.select) {
      if (typeof col === 'object') {
        const column = escapeTableColumn(dialect, col.column.replace(/"/g, ''));
        const alias = escapeTableColumn(dialect, col.as.replace(/"/g, ''));

        columns.push(`${column} AS ${alias}`);
        continue;
      }

      if (!col.endsWith('*')) {
        const column = escapeTableColumn(dialect, col.replace(/"/g, ''));
        const alias = column;

        columns.push(`${column} AS ${alias}`);
        continue;
      }

      const [table] = escapeTableColumn(dialect, col.split('.')[0]);

      columns.push(`${table}.*`);
    }
  }

  if (this.definition?.aggregates) {
    for (const aggregate of this.definition.aggregates) {
      const column = escapeTableColumn(
        dialect,
        aggregate.column.replace(/"/g, '')
      );
      const alias = escapeTableColumn(dialect, aggregate.as!.replace(/"/g, ''));

      columns.push(`${aggregate.fn}(${column}) AS ${alias}`);
    }
  }

  const distinct = this.definition.distinct ? 'DISTINCT ' : '';

  return `SELECT ${distinct}${columns.join(', ')} FROM ${from}`;
}

export function buildInsertQuery<
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
  dialect: Dialect,
  params: unknown[]
) {
  const rows = this.definition?.insertValues;

  if (!rows?.length) {
    throw new Error(`INSERT requires values`);
  }

  const keys = Object.keys(rows[0]);

  const columns = keys.map((key) => escapeTableColumn(dialect, key)).join(', ');
  const rowPlaceholders = `(${keys.map(() => '?').join(', ')})`;
  const placeholders = rows.map(() => rowPlaceholders).join(', ');

  params.push(
    ...rows.flatMap((row) =>
      keys.map((key) => (row as TableRef['columns'])[key])
    )
  );

  return `INSERT INTO ${escapeTableColumn(dialect, this.table.name)} (${columns}) VALUES ${placeholders}`;
}

export function buildUpdateQuery<
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
  dialect: Dialect,
  params: unknown[]
) {
  if (!this.definition?.updateValues) {
    throw new Error(`UPDATE requires values`);
  }

  let keys = Object.keys(this.definition.updateValues);
  const updateParams = keys.map(
    (key) => this.definition.updateValues![key] as unknown
  );

  keys = keys.map((key) => escapeTableColumn(dialect, key));
  params.unshift(...updateParams);

  return `UPDATE ${escapeTableColumn(dialect, this.table.name)} SET ${keys.map((key) => `${key} = ?`).join(', ')}`;
}

export function buildDeleteQuery<
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
  dialect: Dialect
) {
  return `DELETE FROM ${escapeTableColumn(dialect, this.table.name)}`;
}
