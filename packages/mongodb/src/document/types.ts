import type { Document } from '.';
import type { Field } from '../field';
import type { createdAt, deletedAt, updatedAt } from './utilities';

export interface TimestampOptions<
  CreatedAt extends string | boolean,
  UpdatedAt extends string | boolean,
> {
  createdAt?: CreatedAt;
  updatedAt?: UpdatedAt;
}

export interface DocumentOptions<
  DocumentName extends string,
  Fields extends Record<string, Field>,
  CreatedAt extends string | boolean,
  UpdatedAt extends string | boolean,
  Timestamp extends TimestampOptions<CreatedAt, UpdatedAt> | boolean,
  Paranoid extends string | boolean,
> {
  name: DocumentName;
  fields: Fields;
  paranoid?: Paranoid;
  timestamp?: Timestamp;
}

export type MergeTimestampParanoid<
  Fields extends Record<string, Field>,
  CreatedAt extends string | boolean,
  UpdatedAt extends string | boolean,
  Timestamp extends TimestampOptions<CreatedAt, UpdatedAt> | boolean,
  Paranoid extends string | boolean,
> = Fields &
  (Timestamp extends true
    ? {
        createdAt: typeof createdAt;
        updatedAt: typeof updatedAt;
      }
    : Timestamp extends TimestampOptions<CreatedAt, UpdatedAt>
      ? (Timestamp['createdAt'] extends true
          ? {
              createdAt: typeof createdAt;
            }
          : Timestamp['createdAt'] extends string
            ? {
                [K in Timestamp['createdAt']]: typeof createdAt;
              }
            : NonNullable<unknown>) &
          (Timestamp['updatedAt'] extends true
            ? {
                updatedAt: typeof updatedAt;
              }
            : Timestamp['updatedAt'] extends string
              ? {
                  [K in Timestamp['updatedAt']]: typeof updatedAt;
                }
              : NonNullable<unknown>)
      : NonNullable<unknown>) &
  (Paranoid extends true
    ? {
        deletedAt: typeof deletedAt;
      }
    : Paranoid extends string
      ? {
          [K in Paranoid]: typeof deletedAt;
        }
      : NonNullable<unknown>);

export type DocumentOutput<
  DocumentName extends string,
  Fields extends Record<string, Field>,
  CreatedAt extends string | boolean,
  UpdatedAt extends string | boolean,
  Timestamp extends TimestampOptions<CreatedAt, UpdatedAt> | boolean,
  Paranoid extends string | boolean,
  DocRef extends Document<
    DocumentName,
    Fields,
    CreatedAt,
    UpdatedAt,
    Timestamp,
    Paranoid
  > = Document<DocumentName, Fields, CreatedAt, UpdatedAt, Timestamp, Paranoid>,
> = {
  [K in keyof DocRef['fields'] & string]: DocRef['fields'][K]['_output'];
};
