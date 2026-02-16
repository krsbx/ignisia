import { QueryBuilder } from '.';
import type { Column } from '../column';
import type { Table } from '../table';
import { quoteIdentifier } from '../utilities';
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
  Query extends QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
>(q: Query) {
  if (q.definition.queryType !== QueryType.SELECT) return [];

  if (q.definition.groupBy?.length) return q.definition.groupBy;

  if (q.definition.aggregates?.length) {
    if (q.definition.select?.length)
      return q.definition.select.map((col) => {
        if (typeof col === 'string' && col.endsWith('*')) {
          const { from, columns } = getTableColumnNames(
            col,
            q.definition.baseAlias ?? q.table.name,
            q.table,
            q.definition.joinedTables ?? {}
          );

          return columns
            .map((column) => `${from}.${quoteIdentifier(column)}`)
            .join(' ');
        }

        return col;
      });

    const from = q.definition.baseAlias ?? q.table.name;

    return Object.keys(q.table.columns).map(
      (col) => `${from}.${quoteIdentifier(col)}`
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
  Query extends QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
>(q: Query) {
  if (!q.definition.baseAlias) return q.table.name;

  return `${q.table.name} AS ${q.definition.baseAlias}`;
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
