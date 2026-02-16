import type {
  AstNode,
  ComparisonNode,
  GroupNode,
  JoinNode,
  NotNode,
  SingleValueComparisonNode,
} from './ast';
import {
  AcceptedOperator,
  AstType,
  LogicalOperator,
  OperatorConversion,
} from './constants';
import { convertToExpr, extractLetVars } from './utilities';

function compileComparison(node: ComparisonNode): Record<string, unknown> {
  const { field, operator } = node;

  if (operator === AcceptedOperator.IS_NULL) {
    return {
      [field]: {
        $exists: false,
      },
    };
  }

  if (operator === AcceptedOperator.BETWEEN) {
    return {
      [field]: {
        $gte: node.values[0],
        $lte: node.values[1],
      },
    };
  }

  if (operator === AcceptedOperator.IN) {
    return {
      [field]: {
        [OperatorConversion.in]: node.values,
      },
    };
  }

  const value = (node as SingleValueComparisonNode).value;

  return {
    [field]: {
      [OperatorConversion[operator]]: value,
    },
  };
}

function compileGroup(node: GroupNode): Record<string, unknown> {
  const { children } = node;

  if (children.length === 1) {
    return compileAst(children[0]!);
  }

  const compiledChildren = children.map((child) => compileAst(child));

  const operator = node.operator === LogicalOperator.AND ? '$and' : '$or';

  return {
    [operator]: compiledChildren,
  };
}

function compileNot(node: NotNode): Record<string, unknown> {
  const { child } = node;

  if (
    child.type === AstType.COMPARISON &&
    (child as ComparisonNode).operator === 'isNull'
  ) {
    return {
      [child.field]: {
        $exists: true,
      },
    };
  }

  return {
    $not: compileAst(child),
  };
}

export function compileAst(node: AstNode): Record<string, unknown> {
  switch (node.type) {
    case AstType.COMPARISON:
      return compileComparison(node as ComparisonNode);

    case AstType.GROUP:
      return compileGroup(node as GroupNode);

    case AstType.NOT:
      return compileNot(node as NotNode);

    default:
      throw new Error(`Unknown AST node type: ${(node as AstNode).type}`);
  }
}

export function compileJoin(node: JoinNode): Record<string, unknown> {
  const { doc, alias, on } = node;

  // Basic $lookup structure
  const lookup: Record<string, unknown> = {
    from: doc.name,
    as: alias,
  };

  const onFilter = compileAst(on);

  lookup.let = extractLetVars(onFilter);
  lookup.pipeline = [
    {
      $match: {
        $expr: convertToExpr(onFilter),
      },
    },
  ];

  return {
    $lookup: lookup,
  };
}
