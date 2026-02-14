import { SQL, type TransactionSQL } from 'bun';
import { Dialect } from '../table/constants';
import type {
  DatabaseDialect,
  DatabaseExecOptions,
  MysqlConfig,
  PostgresConfig,
  SqlConfigMapping,
  SqliteConfig,
} from './types';

export class BaseSql<
  DbDialect extends Dialect,
  Options extends SqlConfigMapping[DbDialect],
> implements DatabaseDialect
{
  public readonly dialect: Dialect;
  public readonly options: Options;
  public client: SQL;
  public status: 'connecting' | 'connected' | 'disconnected';

  constructor(dialect: Dialect, options: Options) {
    this.dialect = dialect;
    this.options = options;

    this.status = 'connecting';
    this.client = new SQL({
      ...options,
      adapter: dialect,
      onconnect: () => {
        this.status = 'connected';
      },
      onclose: () => {
        this.status = 'disconnected';
      },
    });
    this.connect();
  }

  public async connect() {
    await this.client.connect();

    return this;
  }

  public async disconnect() {
    await this.client.close();

    return this;
  }

  public async exec<T>(options: DatabaseExecOptions): Promise<T> {
    const client = options.tx || this.client;

    if (!client) {
      throw new Error('Database not connected');
    }

    if (!options.params) {
      return client.unsafe(options.sql) as T;
    }

    return client.unsafe(options.sql, options.params) as T;
  }

  public async transaction<T, U extends (tx: TransactionSQL) => Promise<T>>(
    fn: U
  ): Promise<T> {
    return this.client.transaction(fn);
  }

  public async distributed<
    T extends string,
    U,
    V extends (tx: TransactionSQL) => Promise<U>,
  >(name: T, fn: V): Promise<U> {
    return this.client.distributed(name, fn);
  }
}

export class DatabasePsql extends BaseSql<
  typeof Dialect.POSTGRES,
  PostgresConfig
> {
  constructor(options: PostgresConfig) {
    super(Dialect.POSTGRES, options);
  }
}

export class DatabaseMysql extends BaseSql<typeof Dialect.MYSQL, MysqlConfig> {
  constructor(options: MysqlConfig) {
    super(Dialect.MYSQL, options);
  }
}

export class DatabaseSqlite extends BaseSql<
  typeof Dialect.SQLITE,
  SqliteConfig
> {
  constructor(options: SqliteConfig) {
    super(Dialect.SQLITE, options);
  }
}
