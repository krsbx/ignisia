import type { Document } from '../document';
import type { Field } from '../field';
import type { Multiply, Subtract } from '../types';
import { quoteIdentifier } from '../utilities';
import { having, or, orGroup, where, whereGroup } from './condition/common';
import {
  havingNot,
  orNot,
  orNotGroup,
  whereNot,
  whereNotGroup,
} from './condition/not';
import { AcceptedJoin, QueryType } from './constants';
import type {
  QueryConditionContract,
  QueryTransformerContract,
} from './contract';
import { compilePipeline } from './filter';
import { alias, clone } from './helper';
import { prepareJoin } from './join';
import type {
  AcceptedInsertValues,
  AcceptedOrderBy,
  AcceptedUpdateValues,
  FieldSelector,
  QueryDefinition,
  StrictFieldSelector,
} from './types';
import { getParanoid, getTimestamp } from './utilities';

export class QueryBuilder<
  Alias extends DocRef['name'],
  DocRef extends Document<string, Record<string, Field>>,
  JoinedDocs extends Record<
    string,
    Document<string, Record<string, Field>>
  > = NonNullable<unknown>,
  Definition extends Partial<
    QueryDefinition<Alias, DocRef, JoinedDocs>
  > = NonNullable<unknown>,
  AllowedField extends FieldSelector<Alias, DocRef, JoinedDocs> = FieldSelector<
    Alias,
    DocRef,
    JoinedDocs
  >,
  StrictAllowedField extends StrictFieldSelector<
    Alias,
    DocRef,
    JoinedDocs
  > = StrictFieldSelector<Alias, DocRef, JoinedDocs>,
  TransformerContract extends QueryTransformerContract<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  > = QueryTransformerContract<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  >,
  QueryContract extends QueryConditionContract<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  > = QueryConditionContract<
    Alias,
    DocRef,
    JoinedDocs,
    Definition,
    AllowedField,
    StrictAllowedField
  >,
> {
  public readonly doc: DocRef;
  public readonly definition: Definition;

  public alias: TransformerContract['alias'];
  public clone: TransformerContract['clone'];

  public where: QueryContract['where'];
  public having: QueryContract['having'];

  public and: QueryContract['where'];
  public or: QueryContract['or'];

  public whereGroup: QueryContract['whereGroup'];
  public orGroup: QueryContract['orGroup'];
  public readonly not: QueryContract['not'];

  constructor(doc: DocRef) {
    this.doc = doc;
    this.definition = {
      baseAlias: doc.name,
    } as Definition;

    this.alias = alias.bind(this) as this['alias'];
    this.clone = clone.bind(this) as this['clone'];

    this.where = where.bind(this) as this['where'];
    this.having = having.bind(this) as this['having'];

    this.and = this.where as this['and'];
    this.or = or.bind(this) as this['or'];

    this.whereGroup = whereGroup.bind(this) as unknown as this['whereGroup'];
    this.orGroup = orGroup.bind(this) as unknown as this['orGroup'];

    this.not = {
      where: whereNot.bind(this) as this['not']['where'],
      having: havingNot.bind(this) as this['not']['having'],
      or: orNot.bind(this) as this['not']['or'],

      whereGroup: whereNotGroup.bind(
        this
      ) as unknown as this['not']['whereGroup'],
      orGroup: orNotGroup.bind(this) as unknown as this['not']['orGroup'],
    };
  }

  public leftJoin<
    JoinDoc extends Document<string, Record<string, Field>>,
    JoinAlias extends string,
  >(joinDoc: JoinDoc, alias: JoinAlias) {
    return prepareJoin(this, AcceptedJoin.LEFT, joinDoc, alias);
  }

  public innerJoin<
    JoinDoc extends Document<string, Record<string, Field>>,
    JoinAlias extends string,
  >(joinDoc: JoinDoc, alias: JoinAlias) {
    return prepareJoin(this, AcceptedJoin.INNER, joinDoc, alias);
  }

  public limit<Limit extends number | null>(limit: Limit) {
    this.definition.limit = limit;

    return this as unknown as QueryBuilder<
      Alias,
      DocRef,
      JoinedDocs,
      Definition & { limit: Limit }
    >;
  }

  public offset<Offset extends number | null>(offset: Offset) {
    this.definition.offset = offset;

    return this as unknown as QueryBuilder<
      Alias,
      DocRef,
      JoinedDocs,
      Definition & { offset: Offset }
    >;
  }

  public orderBy<OrderBy extends AcceptedOrderBy<StrictAllowedField>>(
    ...orderBy: OrderBy[]
  ) {
    if (!this.definition.orderBy) this.definition.orderBy = [];

    this.definition.orderBy.push(...orderBy);

    return this as unknown as QueryBuilder<
      Alias,
      DocRef,
      JoinedDocs,
      Definition & { orderBy: OrderBy }
    >;
  }

  public withDeleted() {
    this.definition.withDeleted = true;

    return this as unknown as QueryBuilder<
      Alias,
      DocRef,
      JoinedDocs,
      Definition & { withDeleted: true }
    >;
  }

  public select<
    Base extends Definition['baseAlias'] extends string
      ? Definition['baseAlias']
      : DocRef['name'],
    Columns extends DocRef['fields'],
  >(): QueryBuilder<
    Alias,
    DocRef,
    JoinedDocs,
    Omit<Definition, 'queryType' | 'select'> & {
      queryType: typeof QueryType.SELECT;
      select: Array<`${Base}."${keyof Columns & string}"`>;
    }
  >;
  public select<Columns extends Array<AllowedField>>(
    ...columns: Columns
  ): QueryBuilder<
    Alias,
    DocRef,
    JoinedDocs,
    Definition & {
      queryType: typeof QueryType.SELECT;
      select: {
        [K in keyof Columns]: Columns[K];
      };
    }
  >;
  public select(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...columns: any[]
  ) {
    if (!columns.length) {
      const base = this.definition.baseAlias ?? this.doc.name;

      columns = Object.keys(this.doc.fields).map(
        (colName) => `${base}.${quoteIdentifier(colName)}`
      );
    }

    this.definition.select = columns;
    this.definition.queryType = QueryType.SELECT;

    return this as never;
  }

  public insert(...values: AcceptedInsertValues<DocRef['fields']>) {
    this.definition.queryType = QueryType.INSERT;

    if (!this.definition.insertValues) this.definition.insertValues = [];

    const {
      isWithTimestamp,
      isHasCreatedAt,
      isHasUpdatedAt,
      createdAt,
      updatedAt,
      timestamp,
    } = getTimestamp(this.doc);

    values = values.map((row) => {
      const fields: Record<string, unknown> = {};

      for (const key in this.doc.fields) {
        fields[key] = row[key as keyof typeof row] ?? null;
      }

      if (isWithTimestamp && isHasCreatedAt) {
        fields[createdAt] = row[createdAt as keyof typeof row] ?? timestamp;
      }

      if (isWithTimestamp && isHasUpdatedAt) {
        fields[updatedAt] = row[updatedAt as keyof typeof row] ?? timestamp;
      }

      return fields;
    }) as AcceptedInsertValues<DocRef['fields']>;

    this.definition.insertValues = values as AcceptedInsertValues<
      DocRef['fields']
    >;

    return this as unknown as QueryBuilder<
      Alias,
      DocRef,
      JoinedDocs,
      Omit<Definition, 'queryType' | 'insertValues'> & {
        queryType: typeof QueryType.INSERT;
        insertValues: AcceptedInsertValues<DocRef['fields']>;
      }
    >;
  }

  public update<Values extends AcceptedUpdateValues<DocRef['fields']>>(
    values: Values
  ) {
    const { isWithTimestamp, isHasUpdatedAt, updatedAt, timestamp } =
      getTimestamp(this.doc);

    if (isWithTimestamp && isHasUpdatedAt) {
      values = {
        ...values,
        [updatedAt]: values[updatedAt as keyof typeof values] ?? timestamp,
      };
    }

    this.definition.queryType = QueryType.UPDATE;
    this.definition.updateValues = values;

    return this as unknown as QueryBuilder<
      Alias,
      DocRef,
      JoinedDocs,
      Omit<Definition, 'queryType' | 'updateValues'> & {
        queryType: typeof QueryType.UPDATE;
        updateValues: Values;
      }
    >;
  }

  public delete() {
    const { isWithParanoid, deletedAt, timestamp } = getParanoid(this.doc);

    if (isWithParanoid) {
      return this.update({
        [deletedAt]: timestamp,
      } as AcceptedUpdateValues<DocRef['fields']>);
    }

    this.definition.queryType = QueryType.DELETE;

    return this as unknown as QueryBuilder<
      Alias,
      DocRef,
      JoinedDocs,
      Omit<Definition, 'queryType'> & { queryType: typeof QueryType.DELETE }
    >;
  }

  public paginate<
    Page extends number,
    Size extends number,
    Offset extends number = Multiply<Subtract<Page, 1>, Size>,
  >(page: Page, size: Size) {
    if (page < 1) {
      throw new Error('Page number must be at least 1');
    }

    if (size < 1) {
      throw new Error('Page size must be at least 1');
    }

    this.definition.limit = size;
    this.definition.offset = (page - 1) * size;

    return this as unknown as QueryBuilder<
      Alias,
      DocRef,
      JoinedDocs,
      Omit<Definition, 'limit' | 'offset'> & {
        limit: Size;
        offset: Offset;
      }
    >;
  }

  public toPipeline() {
    return compilePipeline(this);
  }
}
