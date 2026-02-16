export const AcceptedFieldTypes = {
  INTEGER: 'INTEGER',
  STRING: 'STRING',
  BOOLEAN: 'BOOLEAN',
  DATE: 'DATE',
  DOUBLE: 'DOUBLE',
  DECIMAL: 'DECIMAL',
  LONG: 'LONG',
  ENUM: 'ENUM',
  JSON: 'JSON',
  ARRAY: 'ARRAY',
  TIMESTAMP: 'TIMESTAMP',
  OBJECTID: 'OBJECTID',
} as const;

export type AcceptedFieldTypes =
  (typeof AcceptedFieldTypes)[keyof typeof AcceptedFieldTypes];
