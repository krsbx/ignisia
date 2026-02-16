import type { Document } from '../document';
import type { Field } from '../field';
import type {
  AcceptedJoin,
  AcceptedOperator,
  AstType,
  LogicalOperator,
} from './constants';

interface BaseComparisonNode {
  type: typeof AstType.COMPARISON;
  field: string;
}

export interface SingleValueComparisonNode extends BaseComparisonNode {
  operator: Exclude<
    AcceptedOperator,
    typeof AcceptedOperator.IN | typeof AcceptedOperator.BETWEEN
  >;
  value: unknown;
}

export interface MultiValueComparisonNode extends BaseComparisonNode {
  operator: typeof AcceptedOperator.IN | typeof AcceptedOperator.BETWEEN;
  values: unknown[];
}

export interface NullValueComparisonNode extends BaseComparisonNode {
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
  child: AstNode;
}

export type AstNode = ComparisonNode | GroupNode | NotNode;

export interface JoinNode {
  type: typeof AstType.JOIN;
  doc: Document<string, Record<string, Field>>;
  join: AcceptedJoin;
  alias: string;
  on: AstNode;
}
