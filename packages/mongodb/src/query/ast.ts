import type { AcceptedOperator, AstType, LogicalOperator } from './constants';

interface BaseComparisonNode {
  type: typeof AstType.COMPARISON;
  field: string;
}

interface SingleValueComparisonNode extends BaseComparisonNode {
  operator: Exclude<
    AcceptedOperator,
    typeof AcceptedOperator.IN | typeof AcceptedOperator.BETWEEN
  >;
  value: unknown;
}

interface MultiValueComparisonNode extends BaseComparisonNode {
  operator: typeof AcceptedOperator.IN | typeof AcceptedOperator.BETWEEN;
  values: unknown[];
}

interface NullValueComparisonNode extends BaseComparisonNode {
  operator: typeof AcceptedOperator.IS_NULL;
}

export type ComparisonNode =
  | SingleValueComparisonNode
  | MultiValueComparisonNode
  | NullValueComparisonNode;

export interface GroupNode {
  type: typeof AstType.GROUP;
  operator: LogicalOperator;
  children: AstNode[];
}

export interface NotNode {
  type: typeof AstType.NOT;
  children: AstNode;
}

export type AstNode = ComparisonNode | GroupNode | NotNode;
