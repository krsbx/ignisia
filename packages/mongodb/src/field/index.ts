import type { AcceptedFieldTypes } from './constant';
import type {
  AcceptedColumnTypeMap,
  ArrayOptions,
  EnumOptions,
  FieldDefinition,
  FieldOptions,
  JsonOptions,
  ValueSelector,
} from './types';

export class Field<
  Type extends AcceptedFieldTypes = AcceptedFieldTypes,
  Values extends Record<string, Field> | readonly string[] = readonly string[],
  Options extends FieldOptions<Type, Values> = FieldOptions<Type, Values>,
  ColValue extends AcceptedColumnTypeMap[Type] = AcceptedColumnTypeMap[Type],
  Value extends Options extends EnumOptions<infer Value>
    ? Value[number]
    : ColValue = ColValue,
  Fields extends Options extends JsonOptions<infer Fields>
    ? Fields
    : Options extends ArrayOptions<infer Fields>
      ? Fields
      : never = never,
  Definition extends Partial<FieldDefinition<Value>> = NonNullable<unknown>,
> {
  public readonly type: Options['type'];
  public readonly enums: readonly Value[];
  public readonly fields: Fields;
  public readonly definition: Definition;
  public readonly _output!: ValueSelector<
    Options['type'],
    Values,
    Options,
    ColValue,
    Value,
    Fields,
    Definition
  >;

  constructor(options: Options) {
    this.type = options.type;
    this.enums = [];
    this.fields = null as unknown as Fields;
    this.definition = {
      default: undefined,
      notNull: false,
    } as Definition;

    if ('values' in options) {
      this.enums = options.values as readonly Value[];
    }

    if ('fields' in options) {
      this.fields = options.fields as Fields;
    }
  }

  public default<
    FinalValue extends ValueSelector<
      Options['type'],
      Values,
      Options,
      ColValue,
      Value,
      Fields,
      Definition
    >,
  >(value: FinalValue) {
    this.definition.default = value as unknown as Value;

    return this as unknown as Field<
      Type,
      Values,
      Options,
      ColValue,
      Value,
      Fields,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      Omit<Definition, 'default'> & { default: FinalValue }
    >;
  }

  public notNull() {
    this.definition.notNull = true;

    return this as unknown as Field<
      Type,
      Values,
      Options,
      ColValue,
      Value,
      Fields,
      Omit<Definition, 'notNull'> & { notNull: true }
    >;
  }

  public infer(): this['_output'] {
    return null as never;
  }

  public static define<
    Type extends AcceptedFieldTypes,
    Values extends Record<string, Field> | readonly string[],
    Options extends FieldOptions<Type, Values>,
    ColValue extends AcceptedColumnTypeMap[Type],
    Value extends Options extends EnumOptions<infer Value>
      ? Value[number]
      : ColValue,
    Fields extends Options extends JsonOptions<infer Fields>
      ? Fields
      : Options extends ArrayOptions<infer Fields>
        ? Fields
        : never,
    Definition extends Partial<FieldDefinition<Value>> = NonNullable<unknown>,
  >(options: Options) {
    const field = new Field<
      Type,
      Values,
      Options,
      ColValue,
      Value,
      Fields,
      Definition
    >(options);

    return field;
  }
}
