import type { TransactionSQL } from 'bun';
import type { Column } from '../column';
import type { QueryBuilder } from '../query';
import type { QueryHooksType } from '../query/constants';
import type { QuerHooks, QueryRunHooks } from '../query/types';
import { Table } from '../table';
import { Dialect } from '../table/constants';
import {
  alterColumnType,
  dropColumnDefault,
  dropColumnNotNull,
  setColumnDefault,
  setColumnNotNull,
} from './alter';
import { addColumn, dropColumn, renameColumn } from './column';
import type {
  ColumnAlterationContract,
  TableAlterationContract,
} from './contract';
import { createTable, dropTable, renameTable } from './table';
import type {
  DatabaseDefinition,
  DatabaseDialect,
  DatabaseOptions,
  MysqlConfig,
  PostgresConfig,
  SqliteConfig,
} from './types';
import { DatabaseMysql, DatabasePsql, DatabaseSqlite } from './wrapper';

export class Database<
  DbDialect extends Dialect,
  Tables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<
    DatabaseDefinition<DbDialect>
  > = DatabaseDefinition<DbDialect>,
> {
  public readonly hooks: Partial<QuerHooks>;
  public readonly dialect: DbDialect;
  public readonly defintion: Definition;
  public readonly tables: Tables;
  public readonly client: DatabaseDialect;

  public createTable: TableAlterationContract<
    DbDialect,
    Tables,
    Definition
  >['createTable'];
  public renameTable: TableAlterationContract<
    DbDialect,
    Tables,
    Definition
  >['renameTable'];
  public dropTable: TableAlterationContract<
    DbDialect,
    Tables,
    Definition
  >['dropTable'];

  public addColumn: ColumnAlterationContract<
    DbDialect,
    Tables,
    Definition
  >['addColumn'];
  public renameColumn: ColumnAlterationContract<
    DbDialect,
    Tables,
    Definition
  >['renameColumn'];
  public dropColumn: ColumnAlterationContract<
    DbDialect,
    Tables,
    Definition
  >['dropColumn'];

  public alterColumnType: ColumnAlterationContract<
    DbDialect,
    Tables,
    Definition
  >['alterColumnType'];

  public setColumnDefault: ColumnAlterationContract<
    DbDialect,
    Tables,
    Definition
  >['setColumnDefault'];
  public dropColumnDefault: ColumnAlterationContract<
    DbDialect,
    Tables,
    Definition
  >['dropColumnDefault'];

  public setColumnNotNull: ColumnAlterationContract<
    DbDialect,
    Tables,
    Definition
  >['setColumnNotNull'];
  public dropColumnNotNull: ColumnAlterationContract<
    DbDialect,
    Tables,
    Definition
  >['dropColumnNotNull'];

  protected constructor(options: DatabaseOptions<DbDialect, Tables>) {
    this.hooks = {};
    this.dialect = options.dialect;
    this.tables = options.tables ?? ({} as Tables);
    this.defintion = {
      dialect: options.dialect,
      config: options.config,
    } as unknown as Definition;

    this.client = this.createClient(options);

    if (options.tables) {
      for (const tableName in options.tables) {
        options.tables[tableName].client = this.client;
        options.tables[tableName].setDialect(this.dialect);
      }
    }

    this.createTable = createTable.bind(this) as this['createTable'];
    this.renameTable = renameTable.bind(this) as this['renameTable'];
    this.dropTable = dropTable.bind(this) as this['dropTable'];

    this.addColumn = addColumn.bind(this) as this['addColumn'];
    this.renameColumn = renameColumn.bind(this) as this['renameColumn'];
    this.dropColumn = dropColumn.bind(this) as this['dropColumn'];

    this.alterColumnType = alterColumnType.bind(
      this
    ) as this['alterColumnType'];

    this.setColumnDefault = setColumnDefault.bind(
      this
    ) as this['setColumnDefault'];
    this.dropColumnDefault = dropColumnDefault.bind(
      this
    ) as this['dropColumnDefault'];

    this.setColumnNotNull = setColumnNotNull.bind(
      this
    ) as this['setColumnNotNull'];
    this.dropColumnNotNull = dropColumnNotNull.bind(
      this
    ) as this['dropColumnNotNull'];
  }

  private createClient(options: DatabaseOptions<DbDialect, Tables>) {
    switch (options.dialect) {
      case Dialect.SQLITE:
        return new DatabaseSqlite(options.config as SqliteConfig);

      case Dialect.POSTGRES:
        return new DatabasePsql(options.config as PostgresConfig);

      case Dialect.MYSQL:
        return new DatabaseMysql(options.config as MysqlConfig);

      default:
        throw new Error(`Dialect ${options.dialect} is not supported`);
    }
  }

  public table<
    TableName extends keyof Tables & string,
    Table extends Tables[TableName],
  >(tableName: TableName) {
    if (!this.tables[tableName]) {
      throw new Error(`Table ${tableName as string} does not exist`);
    }

    const table = this.tables[tableName];
    const query = table.query();

    // Bind the hooks from the database class to the query
    query.hooks.before = this.hooks.before;
    query.hooks.after = this.hooks.after;

    // Fix the type
    return query as unknown as QueryBuilder<TableName, Table>;
  }

  public addHook(type: QueryHooksType, fn: QueryRunHooks) {
    if (!this.hooks[type]) {
      this.hooks[type] = new Set();
    }

    this.hooks[type].add(fn);

    return this;
  }

  public removeHook(type: QueryHooksType, fn: QueryRunHooks) {
    if (this.hooks[type]) {
      this.hooks[type].delete(fn);
    }

    return this;
  }

  public async transaction<T, U extends (tx: TransactionSQL) => Promise<T>>(
    fn: U
  ) {
    return this.client.transaction(fn);
  }

  public static define<
    DbDialect extends Dialect,
    Tables extends Record<string, Table<string, Record<string, Column>>>,
  >(options: DatabaseOptions<DbDialect, Tables>) {
    return new Database(options);
  }
}
