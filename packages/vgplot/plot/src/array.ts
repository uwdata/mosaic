/**
 * Types describing {@link Array} and/or the invisible [TypedArray][1] interfaces.
 * 
 * Skip to {@link Arrayish} for the "I just want an array" type. 
 * Read on at your own peril.
 * 
 * ## Why does this exist?
 * 
 * Most of the motivation is explained in ([microsoft/TypeScript#15402][2]).  
 * [Flechette][3] provides two alternative solutions to this problem, with different tradeoffs.
 * 
 * ### `TypedArray`
 * 
 * [`TypedArray`][4] is a union of all **10** concrete [TypedArray][1] subclasses. 
 * 
 * While accurate, such a type is expensive to check. Each member of the union  is incompatible 
 * with all others due to: their constructor, `filter`, `map`, `slice`, `subarray`.
 * Attempting to use generics is impractical with how many function boundaries are crossed.
 * 
 * ### `ValueArray`
 * 
 * [`ValueArray`][5] could be considered a scaled-back version of this module. 
 * 
 * It describes a (useful) subset of behavior common to {@link Array} and [TypedArray][1]. 
 * However the subset is smaller than what we use for gridded data.
 * 
 * 
 * ## So what's *this* solution?
 * 
 * {@link Arrayish} is one way to use this module, but it composed of many smaller solutions. 
 * 
 * - Like [`TypedArray`][4], all concrete [TypedArray][1] subclasses are assignable to it.
 * - Like [`ValueArray`][5], the type is truly structural - without reference to any of the 10 classes
 * - Unlike both, there are many smaller subsets of behavior that can be expressed using 
 *   interfaces inspired by Python's [`collections.abc`][6]. It is unlikely for a function to depend on
 *   all 29 methods/properties - so you can just state the bits you need.
 * 
 * 
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
 * [2]: https://github.com/microsoft/TypeScript/issues/15402
 * [3]: https://github.com/uwdata/flechette
 * [4]: https://github.com/uwdata/flechette/blob/7fb4a3a91f293031ca430cefea8ff099b13d2550/src/types.ts#L45-L62
 * [5]: https://github.com/uwdata/flechette/blob/7fb4a3a91f293031ca430cefea8ff099b13d2550/src/types.ts#L102-L105
 * [6]: https://docs.python.org/3/library/collections.abc.html#collections-abstract-base-classes
 */

export interface ArraySized {
  readonly length: number;
}

export interface ArrayIterable<T> {
  [Symbol.iterator](): ArrayIterator<T>;
  entries(): ArrayIterator<[number, T]>;
  keys(): ArrayIterator<number>;
  values(): ArrayIterator<T>;
}

export interface ArrayContainer<T> {
  includes(searchElement: T, fromIndex?: number): boolean;
}

export interface ArrayCollection<T> extends ArrayIterable<T>, ArrayContainer<T>, ArraySized { }

export interface ArrayReversible<T> extends ArrayIterable<T> {
  reverse(): this;
}

interface ArraySort<T> {
  sort(compareFn?: (a: T, b: T) => number | bigint): this;
}

interface ArrayFindIndex<T> {
  findIndex(predicate: (value: T, index: number, obj: this) => boolean, thisArg?: any): number;
}

/** Functional methods that are a special-cases of {@link Array.reduce}, with early termination. */
interface ArrayBooleanReduction<T> {
  every(predicate: (value: T, index: number, array: this) => unknown, thisArg?: any): boolean;
  some(predicate: (value: T, index: number, array: this) => unknown, thisArg?: any): boolean;
}


export interface ArraySequence<T> extends ArrayReversible<T>, ArrayCollection<T>, ArraySort<T>, ArrayFindIndex<T> {
  readonly [n: number]: T;

  /**
   * Returns the item located at the specified index.
   * @param index The zero-based index of the desired code unit. A negative index will count back from the last item.
   */
  at(index: number): T | undefined;
  /**Copies a sequence of array elements within the array. See also {@link Array.prototype.copyWithin}. */
  copyWithin(target: number, start: number, end?: number): this;
  /**
   * Changes all array elements from `start` to `end` index to a static `value` and returns the modified array
   * @param value value to fill array section with
   * @param start index to start filling the array at. If start is negative, it is treated as
   * length+start where length is the length of the array.
   * @param end index to stop filling the array at. If end is negative, it is treated as
   * length+end.
   */
  fill(value: T, start?: number, end?: number): this;
  indexOf(searchElement: T, fromIndex?: number): number;
  lastIndexOf(searchElement: T, fromIndex?: number): number;
  slice(start?: number, end?: number): this;
}

/** Functional methods that take a ["reducer" callback][1].  
 * 
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
 */
interface ArrayReduction<T> extends ArrayBooleanReduction<T> {
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: this) => U, initialValue: U): U;
  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: this) => T): T;
  reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: this) => U, initialValue: U): U;
}

/** Methods that take a callback. */
export interface ArrayFunctional<T> extends ArraySort<T>, ArrayFindIndex<T>, ArrayReduction<T> {
  filter(predicate: (value: T, index: number, array: this) => any, thisArg?: any): this;
  find(predicate: (value: T, index: number, obj: this) => boolean, thisArg?: any): T | undefined;
  forEach(callbackfn: (value: T, index: number, array: this) => void, thisArg?: any): void;
  map(callbackfn: (value: T, index: number, array: this) => T, thisArg?: any): this;
}

/** The {@link Array} parts of the [TypedArray][1] interface.
 * 
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
 */
interface ArrayFull<T> extends ArraySequence<T>, ArrayFunctional<T> {
  join(separator?: string): string;
}

export interface TypedArraySet<T> {
  /** Stores multiple values in the typed array, reading input values from a specified array. */
  set(array: ArrayLike<T>, offset?: number): void;
}

export interface TypedArraySubarray {
  /** Returns a new `TypedArray` from the given start and end element index. */
  subarray(begin?: number, end?: number): this;
}

export interface TypedArrayProps {
  /** Returns a number value of the element size for the different `TypedArray` objects. */
  readonly BYTES_PER_ELEMENT: number;
  /** Returns the {@link ArrayBuffer} referenced by the typed array. */
  readonly buffer: ArrayBufferLike;
  /** Returns the length (in bytes) of the typed array. */
  readonly byteLength: number;
  /** Returns the offset (in bytes) of the typed array from the start of its {@link ArrayBuffer}. */
  readonly byteOffset: number;
}



/** The bits unique to [TypedArray][1].
 * 
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
 */
export interface TypedArrayOnly<T> extends TypedArrayProps, TypedArraySet<T>, TypedArraySubarray { }


/** A 1D numeric [TypedArray][1].
 * 
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
 *
 * This interface is **not** assignable to {@link Array} itself, even with {@link TypedArrayOnly} removed.
 */
export interface TypedArrayLike<T extends number | bigint> extends TypedArrayOnly<T>, ArrayFull<T> { }

type Fromable<T> = Iterable<T> | ArrayLike<T>;

interface BaseArrayConstructor<Element, Arr> {
  // required for typed array, optional for array
  new(length: number): Arr;
  new(array: Fromable<Element>): Arr;
  of(...items: Element[]): Arr;
  from(arrayLike: Fromable<Element>): Arr;
  from<V>(arrayLike: Fromable<V>, mapfn: (v: V, k: number) => number, thisArg?: any): Arr;
}

type TypedArrayConstructor<T extends number | bigint> = BaseArrayConstructor<T, TypedArrayLike<T>>;
type AnyArrayConstructor<T extends number | bigint> = BaseArrayConstructor<T, ArrayFull<T>>;

/** A 1D numeric {@link Array} or [TypedArray][1].
 * 
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
 */
export type Arrayish<T extends number | bigint> = T[] | TypedArrayLike<T>;

/** 
 * Get the constructor from an array, typed array or union of both - while preserving the element types. 
 * @param arr An {@link Array} or [TypedArray][1] instance.
 * 
 * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
 * 
 * @returns A *reusable* namespace that is `new`-able, and defines {@link Array.from} & {@link Array.of}.
 * 
 * ## See also
 * 
 * - {@link array}
 * - {@link array_from}
 * - {@link array_from_map}
 * 
 * ## Examples
 * 
 * ```ts
 * const nums = [1, 2, 3];
 * const f32 = new Float32Array(nums);
 * const big64 = BigInt64Array.of(1n, 2n, 3n);
 * ```
 * 
 * {@link Array} does not require `new` and is variadic:
 * 
 * ```ts
 * const ctor_1 = ctor(nums);
 * ctor_1(5, 6, 7, 8) satisfies number[];
 * ```
 * 
 * TypedArray(s) are less fancy, but support two methods that {@link Array} lacks:
 * 
 * ```ts
 * const ctor_2 = ctor(f32);
 * const typed_array = new ctor_2(10) satisfies TypedArrayLike<number>;
 * typed_array.set(typed_array.subarray(3, 7).fill(1));
 * ```
 * 
 * {@link ctor} will also warn you if you mix up element types:
 * 
 * ```ts
 * const ctor_3 = ctor(big64);
 * ctor_3.of(1, 2, 3);
 * //        ^ Argument of type 'number' is not assignable to parameter of type 'bigint'.
 * 
 * ctor_3.from(big64.reverse().values()) satisfies TypedArrayLike<bigint>;
 * ```
 */
function constructor(arr: Array<any>): ArrayConstructor;
function constructor<T extends number | bigint>(arr: TypedArrayLike<T>): TypedArrayConstructor<T>;
function constructor<T extends number | bigint>(arr: ArrayFull<T>): AnyArrayConstructor<T>;
function constructor(arr: { constructor: unknown; }): unknown {
  return arr.constructor;
}

export const ctor = constructor;


/** 
 * Generate a new array with designated size and type.
 * @param size The size of the array
 * @param proto A prototype object of the desired array type.
 *  This may be a typed array or standard array.
 * @returns The generated array.
 */
export function array<T extends number | bigint>(size: number, proto: T[]): T[];
export function array<T extends number | bigint>(size: number, proto: TypedArrayLike<T>): TypedArrayLike<T>;
export function array<T extends number | bigint>(size: number, proto: ArrayFull<T>): ArrayFull<T>;
export function array<T extends number | bigint>(size: number, proto: ArrayFull<T>): ArrayFull<T> {
  return new (constructor(proto))(size);
}

/**
 * Creates an array from an iterable object.
 * @param iterable An iterable object to convert to an array.
 * @param proto A prototype object of the desired array type.
 *  This may be a typed array or standard array.
 */
export function array_from<T extends number | bigint>(iterable: Fromable<T>, proto: ArrayFull<T>): ArrayFull<T> {
  return constructor(proto).from(iterable);
}

/**
 * Creates an array from an iterable object.
 * @param iterable An iterable object to convert to an array.
 * @param mapfn A mapping function to call on every element of the array.
 * @param proto A prototype object of the desired array type.
 *  This may be a typed array or standard array.
 */
export function array_from_map<T extends number | bigint, V>(iterable: Fromable<V>, mapfn: (v: V, k: number) => number, proto: ArrayFull<T>): ArrayFull<T> {
  return constructor(proto).from(iterable, mapfn);
}