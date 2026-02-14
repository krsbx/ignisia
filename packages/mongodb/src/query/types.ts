import type { Document } from '../document';
import type { Field } from '../field';
import type { AcceptedOperator, OrderBy } from './constants';

export type FieldSelector<
  Alias extends string,
  DocumentRef extends Document<string, Record<string, Field>>,
  JoinedDocuments extends Record<
    string,
    Document<string, Record<string, Field>>
  >,
> =
  | `${Alias}."${keyof DocumentRef['fields'] & string}"`
  | `${Alias}.*`
  | {
      [A in keyof JoinedDocuments]:
        | `${A & string}."${keyof JoinedDocuments[A]['fields'] & string}"`
        | `${A & string}.*`;
    }[keyof JoinedDocuments];

export type StrictFieldSelector<
  Alias extends string,
  DocumentRef extends Document<string, Record<string, Field>>,
  JoinedDocuments extends Record<
    string,
    Document<string, Record<string, Field>>
  >,
> =
  | `${Alias}."${keyof DocumentRef['fields'] & string}"`
  | {
      [A in keyof JoinedDocuments]: `${A & string}."${keyof JoinedDocuments[A]['fields'] & string}"`;
    }[keyof JoinedDocuments];

export type WhereValue<T extends Field> = {
  [K in AcceptedOperator]: K extends
    | typeof AcceptedOperator.BETWEEN
    | typeof AcceptedOperator.NOT_BETWEEN
    ? [T['_output'], T['_output']]
    : K extends typeof AcceptedOperator.IN | typeof AcceptedOperator.NOT_IN
      ? T['_output'][]
      : K extends
            | typeof AcceptedOperator.IS_NULL
            | typeof AcceptedOperator.IS_NOT_NULL
        ? never
        : K extends
              | typeof AcceptedOperator.STARTS_WITH
              | typeof AcceptedOperator.ENDS_WITH
          ? T['_output']
          : T['_output'];
};

export type AcceptedOrderBy<Fields extends string> = {
  column: Fields;
  direction: OrderBy;
};

type InsertValuesParser<Fields extends Record<string, Field>> = {
  [FieldName in keyof Fields]: {
    output: Fields[FieldName]['_output'];
    required: Fields[FieldName]['definition'] extends { default: unknown }
      ? false
      : Fields[FieldName]['definition'] extends { notNull: true }
        ? true
        : false;
  };
};

type InsertValuesParserRequired<
  Parsed extends InsertValuesParser<Record<string, Field>>,
> = {
  [FieldName in keyof Parsed as Parsed[FieldName]['required'] extends true
    ? FieldName
    : never]: Parsed[FieldName]['output'];
};

type InsertValuesParserOptional<
  Parsed extends InsertValuesParser<Record<string, Field>>,
> = {
  [FieldName in keyof Parsed as Parsed[FieldName]['required'] extends false
    ? FieldName
    : never]: Parsed[FieldName]['output'];
};

export type AcceptedInsertValues<
  Fields extends Record<string, Field>,
  Parsed extends InsertValuesParser<Fields> = InsertValuesParser<Fields>,
  Required extends
    InsertValuesParserRequired<Parsed> = InsertValuesParserRequired<Parsed>,
  Optional extends
    InsertValuesParserOptional<Parsed> = InsertValuesParserOptional<Parsed>,
> = Array<Required & Optional>;

export type AcceptedUpdateValues<Fields extends Record<string, Field>> = {
  [FieldName in keyof Fields]?: Fields[FieldName]['_output'];
};

export type RawField<AllowedField extends string> = AllowedField;

export type AliasedField<
  Allowed extends string,
  Alias extends string = string,
> = {
  field: Allowed;
  as: Alias;
};

export type SelectableField<Allowed extends string> =
  | RawField<Allowed>
  | AliasedField<Allowed>;
