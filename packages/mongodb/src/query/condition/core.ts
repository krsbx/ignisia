import { QueryBuilder } from '..';
import type { Document } from '../../document';
import type { Field } from '../../field';
import type { AstNode, GroupNode } from '../ast';
import {
  AstType,
  ConditionClause,
  LogicalOperator,
  type AcceptedOperator,
} from '../constants';
import type {
  FieldSelector,
  QueryDefinition,
  StrictFieldSelector,
  WhereValue,
} from '../types';

export function addCondition<
  Alias extends string,
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<string, Document<string, Record<string, Field>>>,
  Definition extends Partial<QueryDefinition<Alias, DocRef, JoinedDocs>>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs>,
  StrictAllowedField extends StrictFieldSelector<Alias, DocRef, JoinedDocs>,
  Clause extends ConditionClause,
  ColName extends StrictAllowedField,
  Col extends ColName extends `${infer DocAlias}.${infer DocField}`
    ? DocAlias extends Alias
      ? DocRef['fields'][DocField]
      : JoinedDocs[DocAlias]['fields'][DocField]
    : never,
  Operator extends AcceptedOperator,
  Value extends WhereValue<Col>[Operator],
  Logical extends LogicalOperator,
  ValidClause extends Lowercase<Clause>,
>(
  query: QueryBuilder<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  >,
  clause: Clause,
  field: ColName,
  operator: Operator,
  value: Value,
  logical: Logical,
  negate: boolean
) {
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
    field,
    operator,
    value,
  } as AstNode;

  if (negate) {
    node = {
      type: AstType.NOT,
      child: node,
    };
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
    DocRef,
    JoinedDocs,
    Omit<Definition, typeof validClause> & {
      [Key in typeof validClause]: GroupNode;
    }
  >;
}

export function addGroupCondition<
  Alias extends string,
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<string, Document<string, Record<string, Field>>>,
  Definition extends Partial<QueryDefinition<Alias, DocRef, JoinedDocs>>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs>,
  StrictAllowedField extends StrictFieldSelector<Alias, DocRef, JoinedDocs>,
  Logical extends LogicalOperator,
>(
  query: QueryBuilder<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  >,
  logical: Logical,
  callback: (
    q: QueryBuilder<Alias, DocRef, JoinedDocs>
  ) => QueryBuilder<Alias, DocRef, JoinedDocs>,
  negate: boolean
) {
  const sub = callback(new QueryBuilder(query.doc));

  const subDef = sub.definition as Partial<
    QueryDefinition<Alias, DocRef, JoinedDocs>
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
      DocRef,
      JoinedDocs,
      Omit<Definition, 'where'> & {
        where: GroupNode;
      }
    >;
  }

  // Assert since we already assigned it above
  const root = query.definition.where!;

  let groupNode: AstNode = subDef.where;

  // 4️⃣ Apply NOT wrapping if needed
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

  return query as QueryBuilder<
    Alias,
    DocRef,
    JoinedDocs,
    Omit<Definition, 'where'> & {
      where: GroupNode;
    }
  >;
}
