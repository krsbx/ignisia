import type { QueryBuilder } from '.';
import type { Document } from '../document';
import type { Field } from '../field';
import {
  buildLimitStage,
  buildMatchStage,
  buildParanoidFilterStage,
  buildProjectStage,
  buildSkipStage,
  buildSortStage,
} from './builder';
import { compileAst, compileJoin } from './compiler';
import type { QueryDefinition } from './types';
import { getParanoid } from './utilities';

export function compilePipeline<
  Alias extends string,
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<string, Document<string, Record<string, Field>>>,
  Definition extends Partial<QueryDefinition<Alias, DocRef, JoinedDocs>>,
>(query: QueryBuilder<Alias, DocRef, JoinedDocs, Definition>) {
  const definition = query.definition;
  const pipeline: Record<string, unknown>[] = [];

  const { isWithParanoid, deletedAt } = getParanoid(query.doc);

  if (isWithParanoid && !definition.withDeleted) {
    pipeline.push(buildParanoidFilterStage(deletedAt));
  }

  if (definition.where) {
    pipeline.push(buildMatchStage(compileAst(definition.where)));
  }

  if (definition.joins?.length) {
    pipeline.push(...definition.joins.map(compileJoin));
  }

  if (definition.select) {
    pipeline.push(buildProjectStage(definition.select));
  }

  if (definition.orderBy?.length) {
    pipeline.push(buildSortStage(definition.orderBy));
  }

  if (definition.having) {
    pipeline.push(buildMatchStage(compileAst(definition.having)));
  }

  if (definition.offset != null) {
    pipeline.push(buildSkipStage(definition.offset));
  }

  if (definition.limit != null) {
    pipeline.push(buildLimitStage(definition.limit));
  }

  return pipeline;
}
