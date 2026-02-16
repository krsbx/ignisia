export function deepClone<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (obj && typeof obj === 'object') {
    const clonedObj = {} as T;

    for (const key in obj) {
      clonedObj[key] = deepClone(obj[key]);
    }
    return clonedObj;
  }

  return obj;
}

function cloneArray(arr: unknown[]): unknown[] {
  if (arr.length === 0) return [];

  if (typeof arr[0] === 'object' && arr[0] !== null) {
    return arr.map((item) => ({ ...(item as object) }));
  }

  return arr.slice();
}

export function cloneDefinition<T extends Record<string, unknown>>(def: T): T {
  const clone = {} as T;

  for (const key in def) {
    const val = def[key];

    if (val === null || typeof val !== 'object') {
      clone[key] = val;
    } else if (Array.isArray(val)) {
      clone[key] = cloneArray(val) as typeof val;
    } else {
      clone[key] = { ...val } as typeof val;
    }
  }

  return clone;
}

export function quoteIdentifier<T extends string, U extends `"${T}"`>(
  identifier: T
): U {
  return `"${identifier.replace(/"/g, '""')}"` as U;
}

export function removeFieldAlias<
  T extends `${string}."${string}"` | `${string}.*`,
>(field: T): string {
  return field.replace(/^[\w]+\."?([^"]+)"?$/, '$1');
}
