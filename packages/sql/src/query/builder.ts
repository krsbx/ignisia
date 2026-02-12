import type { QueryBuilder } from '.';
import type { Column } from '../column';
import type { Table } from '../table';
import { quoteIdentifier } from '../utilities';
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
  q: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >
) {
  const from = getTableSelectName(q);
  const columns: string[] = [];

  if (q.definition.select?.length) {
    for (const col of q.definition.select) {
      if (typeof col === 'object') {
        const alias = quoteIdentifier(col.as.replace(/"/g, ''));

        columns.push(`${col.column} AS ${alias}`);
        continue;
      }

      if (!col.endsWith('*')) {
        const alias = quoteIdentifier(col.replace(/"/g, ''));

        columns.push(`${col} AS ${alias}`);
        continue;
      }

      columns.push(col);
    }
  }

  if (q.definition?.aggregates) {
    for (const aggregate of q.definition.aggregates) {
      columns.push(
        `${aggregate.fn}(${aggregate.column}) AS ${quoteIdentifier(aggregate.as as string)}`
      );
    }
  }

  const distinct = q.definition.distinct ? 'DISTINCT ' : '';

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
  q: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >
) {
  const rows = q.definition?.insertValues;

  if (!rows?.length) {
    throw new Error(`INSERT requires values`);
  }

  const keys = Object.keys(rows[0]);

  const columns = keys.map(quoteIdentifier).join(', ');
  const rowPlaceholders = `(${keys.map(() => '?').join(', ')})`;
  const placeholders = rows.map(() => rowPlaceholders).join(', ');

  q.definition.params = rows.flatMap((row) =>
    keys.map((key) => (row as TableRef['columns'])[key])
  );

  return `INSERT INTO ${q.table.name} (${columns}) VALUES ${placeholders} RETURNING *`;
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
  q: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >
) {
  if (!q.definition?.updateValues) {
    throw new Error(`UPDATE requires values`);
  }

  let keys = Object.keys(q.definition.updateValues);
  const updateParams = keys.map(
    (key) => q.definition.updateValues![key] as unknown
  );

  keys = keys.map(quoteIdentifier);

  if (q.definition?.params) {
    q.definition.params = [...updateParams, ...q.definition.params];
  } else {
    q.definition.params = updateParams;
  }

  return `UPDATE ${q.table.name} SET ${keys.map((key) => `${key} = ?`).join(', ')}`;
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
  q: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >
) {
  return `DELETE FROM ${q.table.name}`;
}
