export const Dialect = {
  POSTGRES: 'postgres',
  MYSQL: 'mysql',
  SQLITE: 'sqlite',
} as const;

export type Dialect = (typeof Dialect)[keyof typeof Dialect];

export const QuoteCharacter = {
  [Dialect.POSTGRES]: '"',
  [Dialect.SQLITE]: '"',
  [Dialect.MYSQL]: '`',
} as const;

export type QuoteCharacter =
  (typeof QuoteCharacter)[keyof typeof QuoteCharacter];
