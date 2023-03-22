/**
 * When we (very rarely) want to have null as an option
 */
export type Nullable<T> = T | null;

/**
 * Use as parameter type when all you care about is that is has a Mongo _id field
 */
export interface IdBase {
  readonly _id: string;
}

/**
 * Just a convience type method to add an _id field
 */
export type PropsWithId<T extends {}> = IdBase & T;

/**
 * Turns a type into a partial where each field can also have the value null
 * Used for Mongo updates
 */
export type PartialWithNull<T> = { [P in keyof T]?: T[P] | null };

export type WithNull<T> = { [P in keyof T]: T[P] | null };

export type NonNullableTypes<T> = { [P in keyof T]: NonNullable<T[P]> };

/**
 * Changes a type into so each field can also have the value undefined
 */
export type WithUndefined<T> = { [P in keyof T]: T[P] | undefined };

export type MakeUndefinable<T, K extends keyof T> = Omit<T, K> &
  WithUndefined<Pick<T, K>>;

/**
 * Makes one or more fields required AND non-nullable
 */
export type MakeRequired<T, K extends keyof T> = Omit<T, K> &
  MakeNonNullable<Required<Pick<T, K>>, K>;

/**
 * Makes one or more fields optional
 */
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

/**
 * Makes one or more fields nullable (T | null). Does not include undefined!
 */
export type MakeNullable<T, K extends keyof T> = Omit<T, K> &
  WithNull<Pick<T, K>>;

/**
 * Makes on or more fields NonNullable - includes undefined
 */
export type MakeNonNullable<T, K extends keyof T> = Omit<T, K> &
  NonNullableTypes<Pick<T, K>>;

/**
 * For asserting that a switch statement covers all items
 * and other exhaustiveness checks
 */
export const assertIsNever = <T extends never>(t?: T) => t!;

// For strict null checking in map/filter situations
export function notEmpty<TValue>(
  value: TValue | null | undefined
): value is TValue {
  return value !== null && value !== undefined;
}

// To filter out falsy values including empty strings
export function notFalsy<TValue>(
  value: TValue | null | undefined | false
): value is TValue {
  return !!value;
}
/**
 * Throws an error if there is no id value
 */
export function getQuestionId(o: {
  readonly _id?: string;
  readonly text: string; // Here to ensure that only questions are passed into this method
}): string {
  if (!o._id) {
    throw new Error("missing-id");
  }
  return o._id;
}

/**
 * Returns object ids in the same order as in the provided array
 */
export function getIds<T extends { readonly _id: string }>(
  items: ReadonlyArray<T>
): ReadonlyArray<string> {
  return items.map((i) => i._id);
}

const filterOn =
  (id: string) =>
  ({ _id }: IdBase) =>
    _id === id;

export const filterOnId = (id: string | IdBase): ((o: IdBase) => boolean) =>
  typeof id === "string" ? filterOn(id) : filterOn(id._id);

/**
 * Returns a typing filter function for a string type field.
 */
export function typeFilter<
  T extends { readonly type: string },
  K extends T["type"]
>(value: K): (t: T) => t is T & { readonly type: K } {
  return (t): t is T & { readonly type: K } => t.type === value;
}

// https://stackoverflow.com/questions/48750647/get-type-of-union-by-discriminant
export type DiscriminateUnion<
  T,
  K extends keyof T,
  V extends T[K]
> = T extends Record<K, V> ? T : never;

// https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c

/**
 * Returns a type where field types that aren't derived from Condition are typed as never
 */
export type FilterFlags<Base extends {}, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
};

export type StringKeys<T> = T extends string ? T : never;
export type StringKeysOf<T> = StringKeys<keyof T>;

/**
 * Returns keys from Base where the value type is derived from Condition
 */
export type AllowedNames<Base extends {}, Condition> = FilterFlags<
  Base,
  Condition
>[keyof Base];

/**
 * Creates a subset of Base where the only fields that are derived from Condition are included
 */
export type SubType<Base extends {}, Condition> = Pick<
  Base,
  AllowedNames<Base, Condition>
>;

/**
 * Replaces the type of fields derived from Condition to NewType and keeps the rest unchanged
 */
export type ChangeType<Base extends {}, Condition, NewType> = {
  [k in AllowedNames<Base, Condition>]: NewType;
} & Omit<Base, AllowedNames<Base, Condition>>;

/**
 * Replaces the type of fields derived from Condition to NewType and omits the rest
 */
export type ExtractAndChangeType<Base extends {}, Condition, NewType> = {
  [k in AllowedNames<Base, Condition>]: NewType;
};

export type UnPromisify<T> = T extends Promise<infer U> ? U : T;

export type AsyncMethodBase = (...params: any[]) => Promise<any>;
export type UnwrappedReturnType<F extends AsyncMethodBase> = UnPromisify<
  ReturnType<F>
>;

/**
 * Extracts only the optional properties from a type
 */
export type OptionalPropertyOf<T extends {}> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? never : K;
  }[keyof T],
  undefined
>;

/**
 * Drops optional and readonly attributes from the keys
 */
type CleanKeysOf<T extends {}> = { [K in keyof T]: K }[keyof T];

export type AllRequired<T extends {}> = { [k in CleanKeysOf<T>]: T[k] };

/**
 * Changes the type of the given fields
 */
export type ChangeTypeFor<Base extends {}, K extends string, NewType> = {
  [k in K]: NewType;
} & Omit<Base, K>;

export function isEventType<K extends keyof GlobalEventHandlersEventMap>(
  event: Event,
  type: K
): event is GlobalEventHandlersEventMap[K] {
  return event.type === type;
}

/**
 * Readonly array with at least 1 item.
 */
export type FilledReadonlyArray<T> = readonly [T, ...T[]];
/**
 * Array with at least 1 item.
 */
export type FilledArray<T> = [T, ...T[]];
/**
 * Check if a given array contains at least 1 item.
 */
export function isFilledArray<T>(
  t: ReadonlyArray<T>
): t is FilledReadonlyArray<T>;
export function isFilledArray<T>(t: Array<T>): t is FilledArray<T>;
export function isFilledArray<T>(t: Array<T> | ReadonlyArray<T>) {
  return t.length > 0;
}

export type AssertPositive<N extends number> = number extends N
  ? N
  : `${N}` extends `-${string}`
  ? never
  : N;

// https://stackoverflow.com/questions/71670856/how-do-i-assert-a-number-type-is-an-integer
export type AssertInteger<N extends number> = number extends N
  ? N
  : `${N}` extends `${bigint}`
  ? N
  : never;

export type AssertPositiveInteger<N extends number> = AssertInteger<
  AssertPositive<N>
>;

/**
 * https://stackoverflow.com/questions/64575901/generic-function-to-get-a-nested-object-value/64578478#64578478
 */
export type DeepIndex<T, K extends string> = T extends object
  ? string extends K
    ? never
    : K extends keyof T
    ? T[K]
    : K extends `${infer F}.${infer R}`
    ? F extends keyof T
      ? DeepIndex<T[F], R>
      : never
    : never
  : never;
