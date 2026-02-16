import { removeFieldAlias } from '../utilities';
import { OrderBy } from './constants';

export function extractLetVars(filter: Record<string, unknown>) {
  const vars: Record<string, string> = {};

  function traverse<T>(obj: T): void {
    if (typeof obj === 'string') {
      if (obj.includes('.') && !obj.startsWith('$')) {
        const parts = obj.split('.');
        const varName = parts[0];

        if (!varName || vars[varName]) return;

        vars[varName] = `$${varName}`;
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else if (typeof obj === 'object' && obj != null) {
      Object.values(obj as Record<string, unknown>).forEach(traverse);
    }
  }

  traverse(filter);

  return vars;
}

export function buildMatchStage(
  filter: Record<string, unknown>
): Record<string, unknown> {
  return { $match: filter };
}

export function buildLookupStage(
  from: string,
  alias: string,
  letVars: Record<string, string>,
  pipeline: Record<string, unknown>[]
): Record<string, unknown> {
  return {
    $lookup: {
      from,
      as: alias,
      let: letVars,
      pipeline,
    },
  };
}

export function buildProjectStage(
  fields: string[] | Array<string | { field: string; as: string }>
): Record<string, unknown> {
  const projection: Record<string, unknown> = {};

  for (const field of fields) {
    if (typeof field === 'string') {
      const cleanField = removeFieldAlias(field as `${string}."${string}"`);
      projection[cleanField] = 1;
    } else {
      const cleanField = removeFieldAlias(
        field.field as `${string}."${string}"`
      );
      projection[field.as] = `$${cleanField}`;
    }
  }

  return { $project: projection };
}

export function buildSortStage(
  orderBy: Array<{ field: string; direction: 'ASC' | 'DESC' }>
): Record<string, unknown> {
  const sort: Record<string, 1 | -1> = {};

  for (const order of orderBy) {
    const cleanField = removeFieldAlias(order.field as `${string}."${string}"`);
    sort[cleanField] = order.direction === OrderBy.ASC ? 1 : -1;
  }

  return {
    $sort: sort,
  };
}

export function buildSkipStage(offset: number): Record<string, unknown> {
  return {
    $skip: offset,
  };
}

export function buildLimitStage(limit: number): Record<string, unknown> {
  return {
    $limit: limit,
  };
}

export function buildParanoidFilterStage(
  fieldName: string
): Record<string, unknown> {
  return buildMatchStage({
    [fieldName]: {
      $exists: false,
    },
  });
}
