import type { Document } from '../document';
import type { Field } from '../field';

export function getTimestamp<
  DocRef extends Document<string, Record<string, Field>>,
>(doc: DocRef) {
  const isWithTimestamp = !!doc.timestamp;
  const timestamp = new Date();
  let isHasCreatedAt = true;
  let isHasUpdatedAt = true;
  let createdAt = 'createdAt';
  let updatedAt = 'updatedAt';

  if (isWithTimestamp) {
    const isCustomTimestamp = typeof doc.timestamp === 'object';

    if (isCustomTimestamp) {
      if (typeof doc.timestamp.createdAt === 'string') {
        createdAt = doc.timestamp.createdAt;
      }

      isHasCreatedAt = doc.timestamp.createdAt !== false;
    }

    if (isCustomTimestamp) {
      if (typeof doc.timestamp.updatedAt === 'string') {
        updatedAt = doc.timestamp.updatedAt;
      }

      isHasUpdatedAt = doc.timestamp.updatedAt !== false;
    }
  }

  return {
    isWithTimestamp,
    timestamp,
    createdAt,
    updatedAt,
    isHasUpdatedAt,
    isHasCreatedAt,
  };
}

export function getParanoid<
  DocRef extends Document<string, Record<string, Field>>,
>(doc: DocRef) {
  const isWithParanoid = !!doc.paranoid;
  const timestamp = new Date();
  let deletedAt = 'deletedAt';

  if (isWithParanoid) {
    if (typeof doc.paranoid === 'string') {
      deletedAt = doc.paranoid;
    }
  }

  return {
    isWithParanoid,
    timestamp,
    deletedAt,
  };
}

export function convertToExpr(filter: Record<string, unknown>) {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(filter)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedObj = value as Record<string, unknown>;
      const convertedNested: Record<string, unknown> = {};

      for (const [op, opValue] of Object.entries(nestedObj)) {
        if (typeof opValue === 'string' && opValue.startsWith('$$')) {
          convertedNested[op] = opValue;
        } else if (typeof opValue === 'string' && opValue.includes('.')) {
          const parts = opValue.split('.');
          const base = parts[0]!;
          const rest = parts.slice(1).join('.');

          convertedNested[op] = `$$${base}.${rest}`;
        } else {
          convertedNested[op] = opValue;
        }
      }

      result[key] = convertedNested;
    } else {
      result[key] = value;
    }
  }

  return result;
}

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
