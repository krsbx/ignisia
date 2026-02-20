import { Dialect } from '../table/constants';
import { escapeTableColumn } from '../utilities';
import type {
  AstNode,
  ComparisonNode,
  GroupNode,
  JoinNode,
  NonCrossNaturalJoinNode,
  NotNode,
} from './ast';
import { AcceptedJoin, AcceptedOperator, AstType } from './constants';

function compileComparison(
  dialect: Dialect,
  node: ComparisonNode,
  params: unknown[]
): string {
  const column = escapeTableColumn(dialect, node.column);

  if (
    node.operator === AcceptedOperator.BETWEEN ||
    node.operator === AcceptedOperator.IN
  ) {
    params.push(...node.values);
  } else if (node.operator !== AcceptedOperator.IS_NULL && 'value' in node) {
    params.push(node.value);
  }

  switch (node.operator) {
    case AcceptedOperator.EQ:
      return `${column} = ?`;

    case AcceptedOperator.NE:
      return `${column} != ?`;

    case AcceptedOperator.GT:
      return `${column} > ?`;

    case AcceptedOperator.LT:
      return `${column} < ?`;

    case AcceptedOperator.GTE:
      return `${column} >= ?`;

    case AcceptedOperator.LTE:
      return `${column} <= ?`;

    case AcceptedOperator.IN:
      return `${column} IN (${node.values.map(() => '?').join(', ')})`;

    case AcceptedOperator.LIKE:
      return `${column} LIKE ?`;

    case AcceptedOperator.ILIKE:
      if (dialect === Dialect.POSTGRES) {
        return `${column} ILIKE ?`;
      }

      return `LOWER(${column}) LIKE LOWER(?)`;

    case AcceptedOperator.IS_NULL:
      return `${column} IS NULL`;

    case AcceptedOperator.BETWEEN:
      return `${column} BETWEEN ? AND ?`;

    case AcceptedOperator.STARTS_WITH:
      return `${column} LIKE ?`;

    case AcceptedOperator.ENDS_WITH:
      return `${column} LIKE ?`;

    case AcceptedOperator.REG_EXP: {
      switch (dialect) {
        case Dialect.POSTGRES:
          return `${column} ~ ?`;

        case Dialect.MYSQL:
          return `${column} REGEXP ?`;

        case Dialect.SQLITE:
          return `${column} GLOB ?`;

        default:
          throw new Error('Operator not supported');
      }
    }

    case AcceptedOperator.RLIKE: {
      switch (dialect) {
        case Dialect.POSTGRES:
          return `${column} ~* ?`;

        case Dialect.MYSQL:
          return `${column} RLIKE ?`;

        case Dialect.SQLITE:
          return `${column} GLOB ?`;

        default:
          throw new Error('Operator not supported');
      }
    }

    default:
      throw new Error('Invalid operator');
  }
}

function compileNot(
  dialect: Dialect,
  node: NotNode,
  params: unknown[]
): string {
  const inner = compileAst(dialect, node.child, params);

  return `NOT (${inner})`;
}

function compileGroup(
  dialect: Dialect,
  node: GroupNode,
  params: unknown[]
): string {
  if (!node.children.length) {
    return '';
  }

  const compiled = node.children.map((child) =>
    compileAst(dialect, child, params)
  );

  return `(${compiled.join(` ${node.operator} `)})`;
}

export function compileAst(
  dialect: Dialect,
  node: AstNode,
  params: unknown[]
): string {
  switch (node.type) {
    case AstType.COMPARISON:
      return compileComparison(dialect, node, params);

    case AstType.GROUP:
      return compileGroup(dialect, node, params);

    case AstType.NOT:
      return compileNot(dialect, node, params);

    default:
      throw new Error(`Unknown AST node type`);
  }
}

export function compileJoin(
  dialect: Dialect,
  join: JoinNode,
  params: unknown[]
): string {
  const table = escapeTableColumn(dialect, join.table.name);
  const alias = escapeTableColumn(dialect, join.alias);

  if (join.join === AcceptedJoin.CROSS || join.join === AcceptedJoin.NATURAL) {
    return `${join.join} JOIN ${table} AS ${alias}`;
  }

  if (!(join as NonCrossNaturalJoinNode).on) {
    throw new Error(`${join.join} join requires ON condition`);
  }

  const onSql = compileAst(
    dialect,
    (join as NonCrossNaturalJoinNode).on,
    params
  );

  return `${join.join} JOIN ${table} AS ${alias} ON ${onSql}`;
}
