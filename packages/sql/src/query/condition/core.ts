import { QueryBuilder } from '..';
import type { Column } from '../../column';
import type { Table } from '../../table';
import type { AstNode, GroupNode } from '../ast';
import {
  AcceptedOperator,
  AstType,
  ConditionClause,
  LogicalOperator,
} from '../constants';
import type {
  ColumnSelector,
  QueryDefinition,
  StrictColumnSelector,
  WhereValue,
} from '../types';

export function addCondition<
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
  Clause extends ConditionClause,
  ColName extends StrictAllowedColumn,
  Col extends ColName extends `${infer TableAlias}.${infer TableColumn}`
    ? TableAlias extends Alias
      ? TableRef['columns'][TableColumn]
      : JoinedTables[TableAlias]['columns'][TableColumn]
    : never,
  Operator extends AcceptedOperator,
  Value extends WhereValue<Col>[Operator],
  Logical extends LogicalOperator,
  ValidClause extends Lowercase<Clause>,
>(
  query: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  clause: Clause,
  column: ColName,
  operator: Operator,
  value: Value,
  logical: Logical,
  negate: boolean
) {
  if (!query.table.dialect) {
    throw new Error('No DB Dialect defined');
  }

  const validClause = clause.toLowerCase() as ValidClause;

  if (!query.definition[validClause]) {
    query.definition[validClause] = {
      type: AstType.GROUP,
      operator: LogicalOperator.AND,
      children: [],
    };
  }

  // Assert since we already assigned it above
  const root = query.definition[validClause]!;

  let node = {
    type: AstType.COMPARISON,
    column,
    operator,
    value,
    values: value,
  } as AstNode;

  if (node.type === AstType.COMPARISON) {
    if (node.operator === AcceptedOperator.IS_NULL && 'value' in node) {
      delete node.value;
    }

    if (node.operator === AcceptedOperator.STARTS_WITH) {
      node.value = '%' + node.value;
    }

    if (node.operator === AcceptedOperator.ENDS_WITH) {
      node.value = node.value + '%';
    }
  }

  if (negate) {
    node = {
      type: AstType.NOT,
      child: node,
    };
  }

  if (operator === AcceptedOperator.IS_NULL) {
    return query as unknown as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Omit<Definition, typeof validClause> & {
        [Key in typeof validClause]: string[];
      }
    >;
  }

  if (root.operator === logical) {
    root.children.push(node);
  } else {
    query.definition.where = {
      type: AstType.GROUP,
      operator: logical,
      children: [root, node],
    };
  }

  return query as QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Omit<Definition, typeof validClause> & {
      [Key in typeof validClause]: GroupNode;
    }
  >;
}

export function addGroupCondition<
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
  Logical extends LogicalOperator,
>(
  query: QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Definition,
    AllowedColumn,
    StrictAllowedColumn
  >,
  logical: Logical,
  callback: (
    q: QueryBuilder<Alias, TableRef, JoinedTables>
  ) => QueryBuilder<Alias, TableRef, JoinedTables>,
  negate: boolean
) {
  const sub = callback(new QueryBuilder(query.table));

  const subDef = sub.definition as Partial<
    QueryDefinition<Alias, TableRef, JoinedTables>
  >;

  if (!query.definition.where) {
    query.definition.where = {
      type: AstType.GROUP,
      operator: LogicalOperator.AND,
      children: [],
    };
  }

  if (!subDef.where || subDef.where.children.length === 0) {
    return query as QueryBuilder<
      Alias,
      TableRef,
      JoinedTables,
      Omit<Definition, 'where'> & {
        where: GroupNode;
      }
    >;
  }

  // Assert since we already assigned it above
  const root = query.definition.where!;

  let groupNode: AstNode = subDef.where;

  if (negate) {
    groupNode = {
      type: AstType.NOT,
      child: groupNode,
    };
  }

  if (root.operator === logical) {
    root.children.push(groupNode);
  } else {
    query.definition.where = {
      type: AstType.GROUP,
      operator: logical,
      children: [root, groupNode],
    };
  }

  return query as unknown as QueryBuilder<
    Alias,
    TableRef,
    JoinedTables,
    Omit<Definition, 'where'> & {
      where: GroupNode;
    }
  >;
}
