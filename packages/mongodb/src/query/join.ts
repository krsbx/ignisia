import { QueryBuilder } from '.';
import type { Document } from '../document';
import type { Field } from '../field';
import type { AstNode, JoinNode } from './ast';
import { AstType, type AcceptedJoin } from './constants';
import type {
  FieldSelector,
  QueryDefinition,
  StrictFieldSelector,
} from './types';

export function prepareJoin<
  Alias extends string,
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<string, Document<string, Record<string, Field>>>,
  Definition extends Partial<QueryDefinition<Alias, DocRef, JoinedDocs>>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs>,
  StrictAllowedField extends StrictFieldSelector<Alias, DocRef, JoinedDocs>,
  JoinType extends AcceptedJoin,
  JoinDoc extends Document<string, Record<string, Field>>,
  JoinAlias extends string,
>(
  query: QueryBuilder<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  >,
  joinType: JoinType,
  joinDoc: JoinDoc,
  alias: JoinAlias
) {
  return {
    on<
      FinalJoinedDocs extends JoinedDocs & {
        [K in JoinAlias]: JoinDoc;
      },
      ReturnedJoinedDocs extends FinalJoinedDocs = FinalJoinedDocs,
    >(
      callback: (
        q: QueryBuilder<Alias, DocRef, FinalJoinedDocs>
      ) => QueryBuilder<Alias, DocRef, ReturnedJoinedDocs>
    ) {
      const sub = callback(new QueryBuilder(query.doc));

      const subDef = sub.definition as Partial<
        QueryDefinition<Alias, DocRef, ReturnedJoinedDocs>
      >;

      if (!subDef.where) {
        return query as unknown as QueryBuilder<
          Alias,
          DocRef,
          ReturnedJoinedDocs,
          Omit<Definition, 'joins' | 'joinedDocs'> & {
            joins: JoinNode[];
            joinedDocs: ReturnedJoinedDocs;
          }
        >;
      }

      if (!query.definition.joins) {
        query.definition.joins = [];
      }

      const on: AstNode = subDef.where;

      query.definition.joins.push({
        type: AstType.JOIN,
        alias,
        join: joinType as never,
        doc: joinDoc,
        on,
      });

      if (subDef.joins?.length) {
        query.definition.joins.push(...subDef.joins);
      }

      if (!query.definition.joinedDocs) {
        query.definition.joinedDocs = {} as JoinedDocs;
      }

      (
        query.definition.joinedDocs as unknown as Record<string, typeof joinDoc>
      )[alias] = joinDoc;

      if (subDef.joinedDocs) {
        Object.assign(query.definition.joinedDocs, subDef.joinedDocs);
      }

      return query as unknown as QueryBuilder<
        Alias,
        DocRef,
        ReturnedJoinedDocs,
        Omit<Definition, 'joins' | 'joinedDocs'> & {
          joins: JoinNode[];
          joinedDocs: ReturnedJoinedDocs;
        }
      >;
    },
  };
}
