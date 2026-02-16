import type { Column } from '../column';
import type { Table } from '../table';
import type {
  AcceptedJoin,
  AcceptedOperator,
  AstType,
  LogicalOperator,
} from './constants';

interface BaseComparisonNode {
  type: typeof AstType.COMPARISON;
  column: string;
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

export interface BaseJoinNode {
  type: typeof AstType.JOIN;
  table: Table<string, Record<string, Column>>;
  alias: string;
}

export interface NonCrossNaturalJoinNode extends BaseJoinNode {
  join: Exclude<
    AcceptedJoin,
    typeof AcceptedJoin.CROSS | typeof AcceptedJoin.NATURAL
  >;
  on: AstNode;
}

export interface CrossNaturalJoinNode extends BaseJoinNode {
  join: typeof AcceptedJoin.CROSS | typeof AcceptedJoin.NATURAL;
}

export type JoinNode = CrossNaturalJoinNode | NonCrossNaturalJoinNode;
