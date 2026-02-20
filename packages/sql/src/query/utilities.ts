import { QueryBuilder } from '.';
import type { Column } from '../column';
import type { Table } from '../table';
import type { Dialect } from '../table/constants';
import { escapeTableColumn } from '../utilities';
import { QueryType } from './constants';
import type {
  AliasedColumn,
  ColumnSelector,
  QueryDefinition,
  SelectableColumn,
  StrictColumnSelector,
} from './types';

export function getTableColumnNames<
  ColName extends string,
  BaseAlias extends string,
  BaseTable extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
>(
  column: ColName,
  baseAlias: BaseAlias,
  baseTable: BaseTable,
  joinedTables: JoinedTables
) {
  const [tableAlias] = column.split('.');

  const isOnBase = tableAlias === baseAlias;
  const from = isOnBase ? baseAlias : tableAlias;
  const columns = isOnBase
    ? Object.keys(baseTable.columns)
    : Object.keys(joinedTables?.[from]?.columns ?? {});

  return {
    from,
    columns,
  };
}

export function getTimestamp<
  TableRef extends Table<string, Record<string, Column>>,
>(table: TableRef) {
  const isWithTimestamp = !!table.timestamp;
  const timestamp = new Date();
  let isHasCreatedAt = true;
  let isHasUpdatedAt = true;
  let createdAt = 'createdAt';
  let updatedAt = 'updatedAt';

  if (isWithTimestamp) {
    const isCustomTimestamp = typeof table.timestamp === 'object';

    if (isCustomTimestamp) {
      if (typeof table.timestamp.createdAt === 'string') {
        createdAt = table.timestamp.createdAt;
      }

      isHasCreatedAt = table.timestamp.createdAt !== false;
    }

    if (isCustomTimestamp) {
      if (typeof table.timestamp.updatedAt === 'string') {
        updatedAt = table.timestamp.updatedAt;
      }

      isHasUpdatedAt = table.timestamp.updatedAt !== false;
    }
  }

  return {
    isWithTimestamp,
    timestamp,
    createdAt,
    updatedAt,
    isHasUpdatedAt,
    isHasCreatedAt,
  };
}

export function getParanoid<
  TableRef extends Table<string, Record<string, Column>>,
>(table: TableRef) {
  const isWithParanoid = !!table.paranoid;
  const timestamp = new Date();
  let deletedAt = 'deletedAt';

  if (isWithParanoid) {
    if (typeof table.paranoid === 'string') {
      deletedAt = table.paranoid;
    }
  }

  return {
    isWithParanoid,
    timestamp,
    deletedAt,
  };
}

export function getGroupByConditions<
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
  if (this.definition.queryType !== QueryType.SELECT) return [];

  if (this.definition.groupBy?.length) return this.definition.groupBy;

  if (this.definition.aggregates?.length) {
    if (this.definition.select?.length) {
      return this.definition.select.map((col) => {
        if (typeof col === 'string' && col.endsWith('*')) {
          const { from, columns } = getTableColumnNames(
            col,
            this.definition.baseAlias ?? this.table.name,
            this.table,
            this.definition.joinedTables ?? {}
          );

          return columns
            .map((column) => escapeTableColumn(dialect, `${from}.${column}`))
            .join(' ');
        }

        if (typeof col === 'string') {
          return escapeTableColumn(dialect, col);
        }

        return escapeTableColumn(dialect, col.column);
      });
    }

    const from = this.definition.baseAlias ?? this.table.name;

    return Object.keys(this.table.columns).map((col) =>
      escapeTableColumn(dialect, `${from}.${col}`)
    );
  }

  return [];
}

export function getTableSelectName<
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
  dialect: Dialect,
  q: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >
) {
  const tableName = escapeTableColumn(dialect, q.table.name);

  if (!q.definition.baseAlias) return tableName;

  return `${tableName} AS ${escapeTableColumn(dialect, q.definition.baseAlias)}`;
}

export function parseAliasedRow({
  row,
  selects,
  root = null,
}: {
  row: Record<string, unknown>;
  selects: SelectableColumn<string>[];
  root?: string | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: Record<string, any> = {};

  for (const key in row) {
    const [table, column] = key.split('.');

    if (!column) {
      const alias = selects.find(
        (s) => typeof s === 'object' && s.as === table
      );

      if (alias) {
        const [oriTab] = (alias as AliasedColumn<string>).column.split('.');

        if (!result[oriTab]) result[oriTab] = {};

        result[oriTab][table] = row[key];
        continue;
      }

      result[key] = row[key];
      continue;
    }

    if (!result[table]) result[table] = {};

    result[table][column] = row[key];
  }

  if (root) {
    result = {
      ...result,
      ...result[root],
    };

    delete result[root];
  }

  return result;
}

export function sanitizeParams(params: unknown[]) {
  return params.map((param: unknown) => {
    // Allow null, strings, numbers, booleans, bigint
    if (
      param === null ||
      typeof param === 'string' ||
      typeof param === 'number' ||
      typeof param === 'boolean' ||
      typeof param === 'bigint'
    ) {
      return param;
    }

    // Convert undefined to null
    if (param === undefined) {
      return null;
    }

    // Convert Date objects to ISO string
    if (param instanceof Date) {
      return param.toISOString();
    }

    // Convert arrays and objects to JSON
    try {
      return JSON.stringify(param);
    } catch {
      return null;
    }
  });
}
