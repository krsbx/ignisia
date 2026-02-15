import type { Document } from '../document';
import type { Field } from '../field';
import { or, orGroup, where, whereGroup } from './condition/common';
import { orNot, orNotGroup, whereNot, whereNotGroup } from './condition/not';
import type {
  QueryConditionContract,
  QueryTransformerContract,
} from './contract';
import { alias, clone } from './helper';
import type {
  FieldSelector,
  QueryDefinition,
  StrictFieldSelector,
} from './types';

export class QueryBuilder<
  Alias extends DocRef['name'],
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<
    string,
    Document<string, Record<string, Field>>
  > = NonNullable<unknown>,
  Definition extends Partial<
    QueryDefinition<Alias, DocRef, JoinedDocs>
  > = NonNullable<unknown>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs> = FieldSelector<
    Alias,
    DocRef,
    JoinedDocs
  >,
  StrictAllowedField extends StrictFieldSelector<
    Alias,
    DocRef,
    JoinedDocs
  > = StrictFieldSelector<Alias, DocRef, JoinedDocs>,
  TransformerContract extends QueryTransformerContract<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  > = QueryTransformerContract<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  >,
  QueryContract extends QueryConditionContract<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  > = QueryConditionContract<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  >,
> {
  public readonly doc: DocRef;
  public readonly definition: Definition;

  public alias: TransformerContract['alias'];
  public clone: TransformerContract['clone'];

  public where: QueryContract['where'];
  public and: QueryContract['where'];
  public or: QueryContract['or'];

  public whereGroup: QueryContract['whereGroup'];
  public orGroup: QueryContract['orGroup'];
  public readonly not: QueryContract['not'];

  constructor(doc: DocRef) {
    this.doc = doc;
    this.definition = {
      baseAlias: doc.name,
    } as Definition;

    this.alias = alias.bind(this) as this['alias'];
    this.clone = clone.bind(this) as this['clone'];

    this.where = where.bind(this) as this['where'];

    this.and = this.where as this['and'];
    this.or = or.bind(this) as this['or'];

    this.whereGroup = whereGroup.bind(this) as unknown as this['whereGroup'];
    this.orGroup = orGroup.bind(this) as unknown as this['orGroup'];

    this.not = {
      where: whereNot.bind(this) as this['not']['where'],
      or: orNot.bind(this) as this['not']['or'],

      whereGroup: whereNotGroup.bind(
        this
      ) as unknown as this['not']['whereGroup'],
      orGroup: orNotGroup.bind(this) as unknown as this['not']['orGroup'],
    };
  }
}
