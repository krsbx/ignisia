import type { Field } from '../field';
import type {
  DocumentOptions,
  DocumentOutput,
  TimestampOptions,
} from './types';
import { defineFields } from './utilities';

export class Document<
  DocumentName extends string,
  Fields extends Record<string, Field>,
  CreatedAt extends string | boolean = string | boolean,
  UpdatedAt extends string | boolean = string | boolean,
  Timestamp extends TimestampOptions<CreatedAt, UpdatedAt> | boolean =
    | TimestampOptions<CreatedAt, UpdatedAt>
    | boolean,
  Paranoid extends string | boolean = string | boolean,
> {
  public readonly name: DocumentName;
  public readonly fields: Fields;
  public readonly timestamp: Timestamp | null;
  public readonly paranoid: Paranoid | null;
  public readonly _output!: DocumentOutput<
    DocumentName,
    Fields,
    CreatedAt,
    UpdatedAt,
    Timestamp,
    Paranoid
  >;

  protected constructor(
    options: DocumentOptions<
      DocumentName,
      Fields,
      CreatedAt,
      UpdatedAt,
      Timestamp,
      Paranoid
    >
  ) {
    this.name = options.name;
    this.fields = options.fields;
    this.timestamp = options.timestamp || null;
    this.paranoid = options.paranoid || null;
  }

  public infer(): this['_output'] {
    return null as never;
  }

  public static define<
    DocumentName extends string,
    Fields extends Record<string, Field>,
    CreatedAt extends string | boolean,
    UpdatedAt extends string | boolean,
    Timestamp extends TimestampOptions<CreatedAt, UpdatedAt> | boolean,
    Paranoid extends string | boolean,
  >(
    options: DocumentOptions<
      DocumentName,
      Fields,
      CreatedAt,
      UpdatedAt,
      Timestamp,
      Paranoid
    >
  ) {
    const fields = defineFields(options);

    return new Document({
      ...options,
      fields,
    });
  }
}
