import type { Document } from '../document';
import type { Field } from '../field';
import type { GroupNode, JoinNode } from './ast';
import type { AcceptedOperator, OrderBy, QueryType } from './constants';

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
  [K in AcceptedOperator]: K extends typeof AcceptedOperator.BETWEEN
    ? [T['_output'], T['_output']]
    : K extends typeof AcceptedOperator.IN
      ? T['_output'][]
      : K extends typeof AcceptedOperator.IS_NULL
        ? never
        : T['_output'];
};

export type AcceptedOrderBy<Fields extends string> = {
  field: Fields;
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

export interface QueryDefinition<
  Alias extends string,
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<
    string,
    Document<string, Record<string, Field>>
  > = NonNullable<unknown>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs> = FieldSelector<
    Alias,
    DocRef,
    JoinedDocs
  >,
> {
  queryType: QueryType;
  select: SelectableField<AllowedField>[] | null;
  where: GroupNode | null;
  having: GroupNode | null;
  limit: number | null;
  offset: number | null;
  insertValues: AcceptedInsertValues<DocRef['fields']> | null;
  updateValues: AcceptedUpdateValues<DocRef['fields']> | null;
  orderBy: AcceptedOrderBy<AllowedField>[] | null;
  joins: JoinNode[] | null;
  baseAlias: Alias | null;
  withDeleted: boolean | null;
  joinedDocs: JoinedDocs | null;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace AggregateStage {
  type MatchStage = {
    $match: Record<string, unknown>;
  };

  type ProjectStage = {
    $project: Record<string, 0 | 1 | unknown>;
  };

  type GroupStage = {
    $group: {
      _id: unknown;
    } & Record<string, unknown>;
  };

  type LookupStage = {
    $lookup: {
      from: string;
      localField?: string;
      foreignField?: string;
      as: string;
      let?: Record<string, unknown>;
      pipeline?: PipelineStage;
    };
  };

  type UnwindStage = {
    $unwind:
      | string
      | {
          path: string;
          preserveNullAndEmptyArrays?: boolean;
        };
  };

  type SortStage = {
    $sort: Record<string, 1 | -1>;
  };

  type LimitStage = {
    $limit: number;
  };

  type SkipStage = {
    $skip: number;
  };

  type CountStage = {
    $count: string;
  };

  type FacetStage = {
    $facet: Record<string, PipelineStage>;
  };

  export type PipelineStage =
    | MatchStage
    | ProjectStage
    | GroupStage
    | LookupStage
    | UnwindStage
    | SortStage
    | LimitStage
    | SkipStage
    | CountStage
    | FacetStage;
}

export type PipelineStage = AggregateStage.PipelineStage;
