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
