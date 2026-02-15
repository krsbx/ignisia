import type { QueryBuilder } from '.';
import type { Document } from '../document';
import type { Field } from '../field';
import type { addCondition, addGroupCondition } from './condition/core';
import type {
  AcceptedOperator,
  ConditionClause,
  LogicalOperator,
} from './constants';
import type {
  FieldSelector,
  QueryDefinition,
  StrictFieldSelector,
  WhereValue,
} from './types';

export interface QueryTransformerContract<
  Alias extends string,
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<string, Document<string, Record<string, Field>>>,
  Definition extends Partial<QueryDefinition<Alias, DocRef, JoinedDocs>>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs>,
  StrictAllowedField extends StrictFieldSelector<Alias, DocRef, JoinedDocs>,
> {
  clone(
    this: QueryBuilder<
      Alias,
      DocRef,
      JoinedDocs,
      Definition,
      AllowedField,
      StrictAllowedField
    >
  ): typeof this;

  alias<NewAlias extends string>(
    this: QueryBuilder<
      Alias,
      DocRef,
      JoinedDocs,
      Definition,
      AllowedField,
      StrictAllowedField
    >,
    alias: NewAlias
  ): QueryBuilder<
    NewAlias,
    DocRef,
    JoinedDocs,
    Omit<Definition, 'baseAlias'> & { baseAlias: NewAlias }
  >;
}

export interface QueryConditionContract<
  Alias extends string,
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<string, Document<string, Record<string, Field>>>,
  Definition extends Partial<QueryDefinition<Alias, DocRef, JoinedDocs>>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs>,
  StrictAllowedField extends StrictFieldSelector<Alias, DocRef, JoinedDocs>,
> {
  where<
    FilName extends StrictAllowedField,
    Fil extends FilName extends `${infer DocAlias}.${infer DocFil}`
      ? DocAlias extends Alias
        ? DocRef['fields'][DocFil]
        : JoinedDocs[DocAlias]['fields'][DocFil]
      : never,
    Operator extends typeof AcceptedOperator.IS_NULL,
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
    operator: Operator
  ): ReturnType<
    typeof addCondition<
      Alias,
      DocRef,
      JoinedDocs,
      Definition,
      AllowedField,
      StrictAllowedField,
      typeof ConditionClause.WHERE,
      FilName,
      FilName extends `${infer DocAlias}.${infer DocFil}`
        ? DocAlias extends Alias
          ? DocRef['fields'][DocFil]
          : JoinedDocs[DocAlias]['fields'][DocFil]
        : never,
      Operator,
      Value,
      typeof LogicalOperator.AND,
      Lowercase<typeof ConditionClause.WHERE>
    >
  >;
  where<
    FilName extends StrictAllowedField,
    Fil extends FilName extends `${infer DocAlias}.${infer DocFil}`
      ? DocAlias extends Alias
        ? DocRef['fields'][DocFil]
        : JoinedDocs[DocAlias]['fields'][DocFil]
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
    value: Value
  ): ReturnType<
    typeof addCondition<
      Alias,
      DocRef,
      JoinedDocs,
      Definition,
      AllowedField,
      StrictAllowedField,
      typeof ConditionClause.WHERE,
      FilName,
      FilName extends `${infer DocAlias}.${infer DocFil}`
        ? DocAlias extends Alias
          ? DocRef['fields'][DocFil]
          : JoinedDocs[DocAlias]['fields'][DocFil]
        : never,
      Operator,
      Value,
      typeof LogicalOperator.AND,
      Lowercase<typeof ConditionClause.WHERE>
    >
  >;

  or<
    FilName extends StrictAllowedField,
    Fil extends FilName extends `${infer DocAlias}.${infer DocFil}`
      ? DocAlias extends Alias
        ? DocRef['fields'][DocFil]
        : JoinedDocs[DocAlias]['fields'][DocFil]
      : never,
    Operator extends typeof AcceptedOperator.IS_NULL,
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
    operator: Operator
  ): ReturnType<
    typeof addCondition<
      Alias,
      DocRef,
      JoinedDocs,
      Definition,
      AllowedField,
      StrictAllowedField,
      typeof ConditionClause.WHERE,
      FilName,
      FilName extends `${infer DocAlias}.${infer DocFil}`
        ? DocAlias extends Alias
          ? DocRef['fields'][DocFil]
          : JoinedDocs[DocAlias]['fields'][DocFil]
        : never,
      Operator,
      Value,
      typeof LogicalOperator.OR,
      Lowercase<typeof ConditionClause.WHERE>
    >
  >;
  or<
    FilName extends StrictAllowedField,
    Fil extends FilName extends `${infer DocAlias}.${infer DocFil}`
      ? DocAlias extends Alias
        ? DocRef['fields'][DocFil]
        : JoinedDocs[DocAlias]['fields'][DocFil]
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
    value: Value
  ): ReturnType<
    typeof addCondition<
      Alias,
      DocRef,
      JoinedDocs,
      Definition,
      AllowedField,
      StrictAllowedField,
      typeof ConditionClause.WHERE,
      FilName,
      FilName extends `${infer DocAlias}.${infer DocFil}`
        ? DocAlias extends Alias
          ? DocRef['fields'][DocFil]
          : JoinedDocs[DocAlias]['fields'][DocFil]
        : never,
      Operator,
      Value,
      typeof LogicalOperator.OR,
      Lowercase<typeof ConditionClause.WHERE>
    >
  >;

  whereGroup(
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
  ): ReturnType<
    typeof addGroupCondition<
      Alias,
      DocRef,
      JoinedDocs,
      Definition,
      AllowedField,
      StrictAllowedField,
      typeof LogicalOperator.AND
    >
  >;

  orGroup(
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
  ): ReturnType<
    typeof addGroupCondition<
      Alias,
      DocRef,
      JoinedDocs,
      Definition,
      AllowedField,
      StrictAllowedField,
      typeof LogicalOperator.OR
    >
  >;

  not: {
    where<
      FilName extends StrictAllowedField,
      Fil extends FilName extends `${infer DocAlias}.${infer DocFil}`
        ? DocAlias extends Alias
          ? DocRef['fields'][DocFil]
          : JoinedDocs[DocAlias]['fields'][DocFil]
        : never,
      Operator extends typeof AcceptedOperator.IS_NULL,
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
      operator: Operator
    ): ReturnType<
      typeof addCondition<
        Alias,
        DocRef,
        JoinedDocs,
        Definition,
        AllowedField,
        StrictAllowedField,
        typeof ConditionClause.WHERE,
        FilName,
        FilName extends `${infer DocAlias}.${infer DocFil}`
          ? DocAlias extends Alias
            ? DocRef['fields'][DocFil]
            : JoinedDocs[DocAlias]['fields'][DocFil]
          : never,
        Operator,
        Value,
        typeof LogicalOperator.AND,
        Lowercase<typeof ConditionClause.WHERE>
      >
    >;
    where<
      FilName extends StrictAllowedField,
      Fil extends FilName extends `${infer DocAlias}.${infer DocFil}`
        ? DocAlias extends Alias
          ? DocRef['fields'][DocFil]
          : JoinedDocs[DocAlias]['fields'][DocFil]
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
      value: Value
    ): ReturnType<
      typeof addCondition<
        Alias,
        DocRef,
        JoinedDocs,
        Definition,
        AllowedField,
        StrictAllowedField,
        typeof ConditionClause.WHERE,
        FilName,
        FilName extends `${infer DocAlias}.${infer DocFil}`
          ? DocAlias extends Alias
            ? DocRef['fields'][DocFil]
            : JoinedDocs[DocAlias]['fields'][DocFil]
          : never,
        Operator,
        Value,
        typeof LogicalOperator.AND,
        Lowercase<typeof ConditionClause.WHERE>
      >
    >;

    or<
      FilName extends StrictAllowedField,
      Fil extends FilName extends `${infer DocAlias}.${infer DocFil}`
        ? DocAlias extends Alias
          ? DocRef['fields'][DocFil]
          : JoinedDocs[DocAlias]['fields'][DocFil]
        : never,
      Operator extends typeof AcceptedOperator.IS_NULL,
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
      operator: Operator
    ): ReturnType<
      typeof addCondition<
        Alias,
        DocRef,
        JoinedDocs,
        Definition,
        AllowedField,
        StrictAllowedField,
        typeof ConditionClause.WHERE,
        FilName,
        FilName extends `${infer DocAlias}.${infer DocFil}`
          ? DocAlias extends Alias
            ? DocRef['fields'][DocFil]
            : JoinedDocs[DocAlias]['fields'][DocFil]
          : never,
        Operator,
        Value,
        typeof LogicalOperator.OR,
        Lowercase<typeof ConditionClause.WHERE>
      >
    >;
    or<
      FilName extends StrictAllowedField,
      Fil extends FilName extends `${infer DocAlias}.${infer DocFil}`
        ? DocAlias extends Alias
          ? DocRef['fields'][DocFil]
          : JoinedDocs[DocAlias]['fields'][DocFil]
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
      value: Value
    ): ReturnType<
      typeof addCondition<
        Alias,
        DocRef,
        JoinedDocs,
        Definition,
        AllowedField,
        StrictAllowedField,
        typeof ConditionClause.WHERE,
        FilName,
        FilName extends `${infer DocAlias}.${infer DocFil}`
          ? DocAlias extends Alias
            ? DocRef['fields'][DocFil]
            : JoinedDocs[DocAlias]['fields'][DocFil]
          : never,
        Operator,
        Value,
        typeof LogicalOperator.OR,
        Lowercase<typeof ConditionClause.WHERE>
      >
    >;

    whereGroup(
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
    ): ReturnType<
      typeof addGroupCondition<
        Alias,
        DocRef,
        JoinedDocs,
        Definition,
        AllowedField,
        StrictAllowedField,
        typeof LogicalOperator.AND
      >
    >;

    orGroup(
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
    ): ReturnType<
      typeof addGroupCondition<
        Alias,
        DocRef,
        JoinedDocs,
        Definition,
        AllowedField,
        StrictAllowedField,
        typeof LogicalOperator.OR
      >
    >;
  };
}
