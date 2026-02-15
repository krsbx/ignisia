import type { ObjectId, Timestamp } from 'mongodb';
import type { Field } from '.';
import type { AstNode } from '../query/ast';
import type { AcceptedFieldTypes } from './constant';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AcceptedColumnTypeMap<T = any> = {
  [K in AcceptedFieldTypes]: K extends typeof AcceptedFieldTypes.INTEGER
    ? number
    : K extends typeof AcceptedFieldTypes.STRING
      ? string
      : K extends typeof AcceptedFieldTypes.BOOLEAN
        ? boolean
        : K extends typeof AcceptedFieldTypes.DATE
          ? Date
          : K extends typeof AcceptedFieldTypes.DOUBLE
            ? number
            : K extends typeof AcceptedFieldTypes.DECIMAL
              ? number
              : K extends typeof AcceptedFieldTypes.LONG
                ? bigint | number
                : K extends typeof AcceptedFieldTypes.ENUM
                  ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    T[number]
                  : K extends typeof AcceptedFieldTypes.JSON
                    ? T
                    : K extends typeof AcceptedFieldTypes.ARRAY
                      ? T
                      : K extends typeof AcceptedFieldTypes.TIMESTAMP
                        ? Timestamp | Date
                        : K extends typeof AcceptedFieldTypes.OBJECTID
                          ? ObjectId | string
                          : never;
};

export type IntegerOptions = {
  type: typeof AcceptedFieldTypes.INTEGER;
};

export type StringOptions = {
  type: typeof AcceptedFieldTypes.STRING;
};

export type BooleanOptions = {
  type: typeof AcceptedFieldTypes.BOOLEAN;
};

export type DateOptions = {
  type: typeof AcceptedFieldTypes.DATE;
};

export type DoubleOptions = {
  type: typeof AcceptedFieldTypes.DOUBLE;
};

export type DecimalOptions = {
  type: typeof AcceptedFieldTypes.DECIMAL;
};

export type LongOptions = {
  type: typeof AcceptedFieldTypes.LONG;
};

export type EnumOptions<Values extends readonly string[]> = {
  type: typeof AcceptedFieldTypes.ENUM;
  values: Values;
};

export type JsonOptions<Fields extends Record<string, Field>> = {
  type: typeof AcceptedFieldTypes.JSON;
  fields: Fields;
};

export type ArrayOptions<Fields extends readonly Field[]> = {
  type: typeof AcceptedFieldTypes.ARRAY;
  fields: Fields;
};

export type TimestampOptions = {
  type: typeof AcceptedFieldTypes.TIMESTAMP;
};

export type ObjectIdOptions = {
  type: typeof AcceptedFieldTypes.OBJECTID;
};

export type FieldOptions<
  Type extends AcceptedFieldTypes,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  U = any,
> = Type extends typeof AcceptedFieldTypes.INTEGER
  ? IntegerOptions
  : Type extends typeof AcceptedFieldTypes.STRING
    ? StringOptions
    : Type extends typeof AcceptedFieldTypes.BOOLEAN
      ? BooleanOptions
      : Type extends typeof AcceptedFieldTypes.DATE
        ? DateOptions
        : Type extends typeof AcceptedFieldTypes.DOUBLE
          ? DoubleOptions
          : Type extends typeof AcceptedFieldTypes.DECIMAL
            ? DecimalOptions
            : Type extends typeof AcceptedFieldTypes.LONG
              ? LongOptions
              : Type extends typeof AcceptedFieldTypes.ENUM
                ? U extends readonly string[]
                  ? EnumOptions<U>
                  : never
                : Type extends typeof AcceptedFieldTypes.JSON
                  ? U extends Record<string, Field>
                    ? JsonOptions<U>
                    : never
                  : Type extends typeof AcceptedFieldTypes.ARRAY
                    ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-expect-error
                      U extends readonly Field[]
                      ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        ArrayOptions<U>
                      : ArrayOptions<readonly Field[]>
                    : Type extends typeof AcceptedFieldTypes.TIMESTAMP
                      ? TimestampOptions
                      : Type extends typeof AcceptedFieldTypes.OBJECTID
                        ? ObjectIdOptions
                        : never;

export interface FieldDefinition<T> {
  notNull: boolean;
  default: T;
  where: AstNode[];
}

export type PremitiveValueSelector<
  Type extends AcceptedFieldTypes,
  NotNull extends boolean,
> = NotNull extends true
  ? AcceptedColumnTypeMap[Type]
  : AcceptedColumnTypeMap[Type] | null;

export type ValueSelector<
  Type extends AcceptedFieldTypes,
  Values extends Record<string, Field> | readonly string[],
  Options extends FieldOptions<Type, Values>,
  ColValue extends AcceptedColumnTypeMap[Type],
  Value extends Options extends EnumOptions<infer Value>
    ? Value[number]
    : ColValue,
  Fields extends Options extends JsonOptions<infer Fields>
    ? Fields
    : Options extends ArrayOptions<infer Fields>
      ? Fields
      : never,
  Definition extends Partial<FieldDefinition<Value>> | FieldDefinition<Value>,
> = Type extends
  | typeof AcceptedFieldTypes.INTEGER
  | typeof AcceptedFieldTypes.STRING
  | typeof AcceptedFieldTypes.BOOLEAN
  | typeof AcceptedFieldTypes.TIMESTAMP
  | typeof AcceptedFieldTypes.DATE
  | typeof AcceptedFieldTypes.DOUBLE
  | typeof AcceptedFieldTypes.DECIMAL
  | typeof AcceptedFieldTypes.LONG
  | typeof AcceptedFieldTypes.TIMESTAMP
  | typeof AcceptedFieldTypes.OBJECTID
  ? PremitiveValueSelector<
      Type,
      Definition['notNull'] extends true ? true : false
    >
  : Type extends typeof AcceptedFieldTypes.JSON
    ? Fields extends Record<string, Field>
      ? {
          [K in keyof Fields]: Fields[K] extends Field<
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            infer CT,
            infer VS,
            infer O,
            infer CV,
            infer V,
            infer F,
            infer D
          >
            ? ValueSelector<O['type'], VS, O, CV, V, F, D>
            : never;
        }
      : NonNullable<unknown>
    : Type extends typeof AcceptedFieldTypes.ARRAY
      ? Fields extends readonly Field<
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          infer CT,
          infer VS,
          infer O,
          infer CV,
          infer V,
          infer F,
          infer D
        >[]
        ? ValueSelector<O['type'], VS, O, CV, V, F, D>[]
        : unknown[]
      : Type extends typeof AcceptedFieldTypes.ENUM
        ? Options extends EnumOptions<infer Value>
          ? Value[number]
          : never
        : never;
