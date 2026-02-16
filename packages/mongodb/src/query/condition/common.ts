import type { QueryBuilder } from '..';
import type { Document } from '../../document';
import type { Field } from '../../field';
import {
  AcceptedOperator,
  ConditionClause,
  LogicalOperator,
} from '../constants';
import type {
  FieldSelector,
  QueryDefinition,
  StrictFieldSelector,
  WhereValue,
} from '../types';
import { addCondition, addGroupCondition } from './core';

export function where<
  Alias extends string,
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<string, Document<string, Record<string, Field>>>,
  Definition extends Partial<QueryDefinition<Alias, DocRef, JoinedDocs>>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs>,
  StrictAllowedField extends StrictFieldSelector<Alias, DocRef, JoinedDocs>,
  FilName extends StrictAllowedField,
  Fil extends FilName extends `${infer DocAlias}.${infer DocField}`
    ? DocAlias extends Alias
      ? DocRef['fields'][DocField]
      : JoinedDocs[DocAlias]['fields'][DocField]
    : never,
  Operator extends AcceptedOperator,
  Value extends WhereValue<Fil>[Operator],
>(
  this: QueryBuilder<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  >,
  field: FilName,
  operator: Operator,
  value?: Value
) {
  return addCondition(
    this,
    ConditionClause.WHERE,
    field,
    operator,
    (value || null) as Value,
    LogicalOperator.AND,
    false
  );
}

export function having<
  Alias extends string,
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<string, Document<string, Record<string, Field>>>,
  Definition extends Partial<QueryDefinition<Alias, DocRef, JoinedDocs>>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs>,
  StrictAllowedField extends StrictFieldSelector<Alias, DocRef, JoinedDocs>,
  FilName extends StrictAllowedField,
  Fil extends FilName extends `${infer DocAlias}.${infer DocField}`
    ? DocAlias extends Alias
      ? DocRef['fields'][DocField]
      : JoinedDocs[DocAlias]['fields'][DocField]
    : never,
  Operator extends AcceptedOperator,
  Value extends WhereValue<Fil>[Operator],
>(
  this: QueryBuilder<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  >,
  field: FilName,
  operator: Operator,
  value?: Value
) {
  return addCondition(
    this,
    ConditionClause.HAVING,
    field,
    operator,
    (value || null) as Value,
    LogicalOperator.AND,
    false
  );
}

export function or<
  Alias extends string,
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<string, Document<string, Record<string, Field>>>,
  Definition extends Partial<QueryDefinition<Alias, DocRef, JoinedDocs>>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs>,
  StrictAllowedField extends StrictFieldSelector<Alias, DocRef, JoinedDocs>,
  FilName extends StrictAllowedField,
  Fil extends FilName extends `${infer DocAlias}.${infer DocField}`
    ? DocAlias extends Alias
      ? DocRef['fields'][DocField]
      : JoinedDocs[DocAlias]['fields'][DocField]
    : never,
  Operator extends AcceptedOperator,
  Value extends WhereValue<Fil>[Operator],
>(
  this: QueryBuilder<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  >,
  field: FilName,
  operator: Operator,
  value?: Value
) {
  return addCondition(
    this,
    ConditionClause.WHERE,
    field,
    operator,
    (value || null) as Value,
    LogicalOperator.OR,
    false
  );
}

export function whereGroup<
  Alias extends string,
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<string, Document<string, Record<string, Field>>>,
  Definition extends Partial<QueryDefinition<Alias, DocRef, JoinedDocs>>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs>,
  StrictAllowedField extends StrictFieldSelector<Alias, DocRef, JoinedDocs>,
>(
  this: QueryBuilder<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  >,
  callback: (
    q: QueryBuilder<Alias, DocRef, JoinedDocs>
  ) => QueryBuilder<Alias, DocRef, JoinedDocs>
) {
  return addGroupCondition(this, LogicalOperator.AND, callback, false);
}

export function orGroup<
  Alias extends string,
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<string, Document<string, Record<string, Field>>>,
  Definition extends Partial<QueryDefinition<Alias, DocRef, JoinedDocs>>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs>,
  StrictAllowedField extends StrictFieldSelector<Alias, DocRef, JoinedDocs>,
>(
  this: QueryBuilder<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  >,
  callback: (
    q: QueryBuilder<Alias, DocRef, JoinedDocs>
  ) => QueryBuilder<Alias, DocRef, JoinedDocs>
) {
  return addGroupCondition(this, LogicalOperator.OR, callback, false);
}
