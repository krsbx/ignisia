import type { TransactionSQL } from 'bun';
import type { QueryBuilder } from '.';
import type { Column } from '../column';
import type { Table } from '../table';
import type { Dialect } from '../table/constants';
import type { addCondition, addGroupCondition } from './condition';
import type {
  AcceptedOperator,
  ConditionClause,
  LogicalOperator,
} from './constants';
import type {
  ColumnSelector,
  ExplainOptions,
  QueryDefinition,
  StrictColumnSelector,
  WhereValue,
} from './types';

export interface QueryTransformerContract<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
> {
  toQuery(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >,
    dialect?: Dialect | null
  ): {
    query: string;
    params: unknown[] | null | undefined;
  };

  toString(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >
  ): string;

  toDebugString(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >
  ): string;

  explain(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >
  ): Promise<unknown>;
  explain(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >,
    options: ExplainOptions
  ): Promise<unknown>;

  exec<
    This extends QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    > = QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >,
    Output extends This['_output'] = This['_output'],
  >(
    this: This,
    tx?: TransactionSQL | null
  ): Promise<Output>;

  clone(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >
  ): typeof this;

  alias<NewAlias extends string>(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >,
    alias: NewAlias
  ): QueryBuilder<
    NewAlias,
    TableRef,
    JoinedTables,
    Omit<Definition, 'baseAlias'> & { baseAlias: NewAlias }
  >;
}

export interface QueryConditionContract<
  Alias extends string,
  TableRef extends Table<string, Record<string, Column>>,
  JoinedTables extends Record<string, Table<string, Record<string, Column>>>,
  Definition extends Partial<QueryDefinition<Alias, TableRef, JoinedTables>>,
  AllowedColumn extends ColumnSelector<Alias, TableRef, JoinedTables>,
  StrictAllowedColumn extends StrictColumnSelector<
    Alias,
    TableRef,
    JoinedTables
  >,
> {
  where<
    ColName extends StrictAllowedColumn,
    Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
      ? TableAlias extends Alias
        ? TableRef['columns'][TableColumn]
        : JoinedTables[TableAlias]['columns'][TableColumn]
      : never,
    Operator extends typeof AcceptedOperator.IS_NULL,
    Value extends WhereValue<Col>[Operator],
  >(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >,
    column: ColName,
    operator: Operator
  ): ReturnType<
    typeof addCondition<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn,
      typeof ConditionClause.WHERE,
      ColName,
      ColName extends `${infer TableAlias}.${infer TableColumn}`
        ? TableAlias extends Alias
          ? TableRef['columns'][TableColumn]
          : JoinedTables[TableAlias]['columns'][TableColumn]
        : never,
      Operator,
      Value,
      typeof LogicalOperator.AND,
      Lowercase<typeof ConditionClause.WHERE>
    >
  >;
  where<
    ColName extends StrictAllowedColumn,
    Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
      ? TableAlias extends Alias
        ? TableRef['columns'][TableColumn]
        : JoinedTables[TableAlias]['columns'][TableColumn]
      : never,
    Operator extends AcceptedOperator,
    Value extends WhereValue<Col>[Operator],
  >(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >,
    column: ColName,
    operator: Operator,
    value: Value
  ): ReturnType<
    typeof addCondition<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn,
      typeof ConditionClause.WHERE,
      ColName,
      ColName extends `${infer TableAlias}.${infer TableColumn}`
        ? TableAlias extends Alias
          ? TableRef['columns'][TableColumn]
          : JoinedTables[TableAlias]['columns'][TableColumn]
        : never,
      Operator,
      Value,
      typeof LogicalOperator.AND,
      Lowercase<typeof ConditionClause.WHERE>
    >
  >;

  or<
    ColName extends StrictAllowedColumn,
    Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
      ? TableAlias extends Alias
        ? TableRef['columns'][TableColumn]
        : JoinedTables[TableAlias]['columns'][TableColumn]
      : never,
    Operator extends typeof AcceptedOperator.IS_NULL,
    Value extends WhereValue<Col>[Operator],
  >(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >,
    column: ColName,
    operator: Operator
  ): ReturnType<
    typeof addCondition<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn,
      typeof ConditionClause.WHERE,
      ColName,
      ColName extends `${infer TableAlias}.${infer TableColumn}`
        ? TableAlias extends Alias
          ? TableRef['columns'][TableColumn]
          : JoinedTables[TableAlias]['columns'][TableColumn]
        : never,
      Operator,
      Value,
      typeof LogicalOperator.OR,
      Lowercase<typeof ConditionClause.WHERE>
    >
  >;
  or<
    ColName extends StrictAllowedColumn,
    Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
      ? TableAlias extends Alias
        ? TableRef['columns'][TableColumn]
        : JoinedTables[TableAlias]['columns'][TableColumn]
      : never,
    Operator extends AcceptedOperator,
    Value extends WhereValue<Col>[Operator],
  >(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >,
    column: ColName,
    operator: Operator,
    value: Value
  ): ReturnType<
    typeof addCondition<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn,
      typeof ConditionClause.WHERE,
      ColName,
      ColName extends `${infer TableAlias}.${infer TableColumn}`
        ? TableAlias extends Alias
          ? TableRef['columns'][TableColumn]
          : JoinedTables[TableAlias]['columns'][TableColumn]
        : never,
      Operator,
      Value,
      typeof LogicalOperator.OR,
      Lowercase<typeof ConditionClause.WHERE>
    >
  >;

  having<
    ColName extends StrictAllowedColumn,
    Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
      ? TableAlias extends Alias
        ? TableRef['columns'][TableColumn]
        : JoinedTables[TableAlias]['columns'][TableColumn]
      : never,
    Operator extends AcceptedOperator,
    Value extends WhereValue<Col>[Operator],
  >(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >,
    column: ColName,
    operator: Operator,
    value: Value
  ): ReturnType<
    typeof addCondition<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn,
      typeof ConditionClause.HAVING,
      ColName,
      ColName extends `${infer TableAlias}.${infer TableColumn}`
        ? TableAlias extends Alias
          ? TableRef['columns'][TableColumn]
          : JoinedTables[TableAlias]['columns'][TableColumn]
        : never,
      Operator,
      Value,
      typeof LogicalOperator.AND,
      Lowercase<typeof ConditionClause.HAVING>
    >
  >;

  whereGroup(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >,
    callback: (
      q: QueryBuilder<Alias, TableRef, JoinedTables>
    ) => QueryBuilder<Alias, TableRef, JoinedTables>
  ): ReturnType<
    typeof addGroupCondition<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn,
      typeof LogicalOperator.AND
    >
  >;

  orGroup(
    this: QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn
    >,
    callback: (
      q: QueryBuilder<Alias, TableRef, JoinedTables>
    ) => QueryBuilder<Alias, TableRef, JoinedTables>
  ): ReturnType<
    typeof addGroupCondition<
      Alias,
      TableRef,
      JoinedTables,
      Definition,
      AllowedColumn,
      StrictAllowedColumn,
      typeof LogicalOperator.OR
    >
  >;

  not: {
    where<
      ColName extends StrictAllowedColumn,
      Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
        ? TableAlias extends Alias
          ? TableRef['columns'][TableColumn]
          : JoinedTables[TableAlias]['columns'][TableColumn]
        : never,
      Operator extends typeof AcceptedOperator.IS_NULL,
      Value extends WhereValue<Col>[Operator],
    >(
      column: ColName,
      operator: Operator
    ): ReturnType<
      typeof addCondition<
        Alias,
        TableRef,
        JoinedTables,
        Definition,
        AllowedColumn,
        StrictAllowedColumn,
        typeof ConditionClause.WHERE,
        ColName,
        ColName extends `${infer TableAlias}.${infer TableColumn}`
          ? TableAlias extends Alias
            ? TableRef['columns'][TableColumn]
            : JoinedTables[TableAlias]['columns'][TableColumn]
          : never,
        Operator,
        Value,
        typeof LogicalOperator.AND,
        Lowercase<typeof ConditionClause.WHERE>
      >
    >;
    where<
      ColName extends StrictAllowedColumn,
      Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
        ? TableAlias extends Alias
          ? TableRef['columns'][TableColumn]
          : JoinedTables[TableAlias]['columns'][TableColumn]
        : never,
      Operator extends AcceptedOperator,
      Value extends WhereValue<Col>[Operator],
    >(
      column: ColName,
      operator: Operator,
      value: Value
    ): ReturnType<
      typeof addCondition<
        Alias,
        TableRef,
        JoinedTables,
        Definition,
        AllowedColumn,
        StrictAllowedColumn,
        typeof ConditionClause.WHERE,
        ColName,
        ColName extends `${infer TableAlias}.${infer TableColumn}`
          ? TableAlias extends Alias
            ? TableRef['columns'][TableColumn]
            : JoinedTables[TableAlias]['columns'][TableColumn]
          : never,
        Operator,
        Value,
        typeof LogicalOperator.AND,
        Lowercase<typeof ConditionClause.WHERE>
      >
    >;

    or<
      ColName extends StrictAllowedColumn,
      Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
        ? TableAlias extends Alias
          ? TableRef['columns'][TableColumn]
          : JoinedTables[TableAlias]['columns'][TableColumn]
        : never,
      Operator extends typeof AcceptedOperator.IS_NULL,
      Value extends WhereValue<Col>[Operator],
    >(
      column: ColName,
      operator: Operator
    ): ReturnType<
      typeof addCondition<
        Alias,
        TableRef,
        JoinedTables,
        Definition,
        AllowedColumn,
        StrictAllowedColumn,
        typeof ConditionClause.WHERE,
        ColName,
        ColName extends `${infer TableAlias}.${infer TableColumn}`
          ? TableAlias extends Alias
            ? TableRef['columns'][TableColumn]
            : JoinedTables[TableAlias]['columns'][TableColumn]
          : never,
        Operator,
        Value,
        typeof LogicalOperator.OR,
        Lowercase<typeof ConditionClause.WHERE>
      >
    >;
    or<
      ColName extends StrictAllowedColumn,
      Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
        ? TableAlias extends Alias
          ? TableRef['columns'][TableColumn]
          : JoinedTables[TableAlias]['columns'][TableColumn]
        : never,
      Operator extends AcceptedOperator,
      Value extends WhereValue<Col>[Operator],
    >(
      column: ColName,
      operator: Operator,
      value: Value
    ): ReturnType<
      typeof addCondition<
        Alias,
        TableRef,
        JoinedTables,
        Definition,
        AllowedColumn,
        StrictAllowedColumn,
        typeof ConditionClause.WHERE,
        ColName,
        ColName extends `${infer TableAlias}.${infer TableColumn}`
          ? TableAlias extends Alias
            ? TableRef['columns'][TableColumn]
            : JoinedTables[TableAlias]['columns'][TableColumn]
          : never,
        Operator,
        Value,
        typeof LogicalOperator.OR,
        Lowercase<typeof ConditionClause.WHERE>
      >
    >;

    having<
      ColName extends StrictAllowedColumn,
      Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
        ? TableAlias extends Alias
          ? TableRef['columns'][TableColumn]
          : JoinedTables[TableAlias]['columns'][TableColumn]
        : never,
      Operator extends AcceptedOperator,
      Value extends WhereValue<Col>[Operator],
    >(
      column: ColName,
      operator: Operator,
      value: Value
    ): ReturnType<
      typeof addCondition<
        Alias,
        TableRef,
        JoinedTables,
        Definition,
        AllowedColumn,
        StrictAllowedColumn,
        typeof ConditionClause.HAVING,
        ColName,
        ColName extends `${infer TableAlias}.${infer TableColumn}`
          ? TableAlias extends Alias
            ? TableRef['columns'][TableColumn]
            : JoinedTables[TableAlias]['columns'][TableColumn]
          : never,
        Operator,
        Value,
        typeof LogicalOperator.AND,
        Lowercase<typeof ConditionClause.HAVING>
      >
    >;

    whereGroup(
      callback: (
        q: QueryBuilder<Alias, TableRef, JoinedTables>
      ) => QueryBuilder<Alias, TableRef, JoinedTables>
    ): ReturnType<
      typeof addGroupCondition<
        Alias,
        TableRef,
        JoinedTables,
        Definition,
        AllowedColumn,
        StrictAllowedColumn,
        typeof LogicalOperator.AND
      >
    >;

    orGroup(
      callback: (
        q: QueryBuilder<Alias, TableRef, JoinedTables>
      ) => QueryBuilder<Alias, TableRef, JoinedTables>
    ): ReturnType<
      typeof addGroupCondition<
        Alias,
        TableRef,
        JoinedTables,
        Definition,
        AllowedColumn,
        StrictAllowedColumn,
        typeof LogicalOperator.OR
      >
    >;
  };
}
