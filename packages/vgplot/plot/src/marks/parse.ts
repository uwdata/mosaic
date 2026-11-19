// (used for JSDoc links)
// oxlint-disable-next-line no-unused-vars
import type * as mc from '@uwdata/mosaic-core';
import { Param } from '@uwdata/mosaic-core';
// oxlint-disable-next-line no-unused-vars
import type * as msql from '@uwdata/mosaic-sql';
import { ColumnNameRefNode, isNode } from '@uwdata/mosaic-sql';

import { chainFromIterable, map } from '../itertools.js';
import { Transform } from '../symbols.js';
import type { BinReturn, MarkOptions, OptionName } from './options.js';

/**
 * Placeholder for if this'll be generic.
 *
 * A type parameter can't be resolved in a `static`, may need to keep things opaque.
 */
type OptionNamePlaceholder = string;

/**
 * A `static` description of what to expect in each option, per `Mark` class.
 *
 * ## Notes
 *
 * - `Mark` _instances_ must not interact with this beyond what's needed in the constructor
 * - `Mark` _subclasses_ are expected to extend their version ({@link OptionsImpl.with}) what else
 *   they allow. This process must always be additive.
 * - The 3 `supports*` properties are a starting point, it might make more sense to use a `Map` later
 */
export interface OptionsSpec {
  /**
   * A {@link mc.Param} may be passed to this option.
   *
   * ## How are {@link mc.Param}(s) handled?
   *
   * There are (at-least) 3 different paths, but they all share the steps of:
   *
   * - Call {@link mc.Param.addEventListener}
   *
   *   - Providing a callback that makes an assignment of {@link mc.Param.value} _somewhere on `this`_
   *   - Calls _some_ method on `Mark`.
   * - Assign the initial {@link mc.Param.value}
   *
   * These steps are not always in the same order
   *
   * ### 1 - caught by `isParamLike` in `process`
   *
   * - Added to `Mark.channels: Entry[]` as `{channel, value: Param.value}`
   * - Gets an event listener that updates within that array and uses `Mark.update`
   *
   * ### 2 - caught by `isNode`, `collectParams` in `process`
   *
   * - The outer sql node is added as a field to `Mark.channels: Entry[]`
   *
   *   - Unclear what is going on in `fieldEntry`
   * - All params are added to `Mark.params`
   * - `Mark.setPlot` -> `Plot.addParams`
   *
   *   - Which handles the event listener (eventually) with `Mark.initialize`
   *
   * ### 3 - explicitly covered by `marks/util/handle-param::handleParam`
   *
   * _Most `Mark` subclasses utilize this helper function_, which is similar to (1) but:
   *
   * - {@link mc.Param.value} is assigned to `this.<option-name>`
   * - The callback (usually) calls something besides `Mark.update`
   *
   *   - `Mark.requestUpdate`
   *   - A method that returns `this`, then `Mark.update`
   */
  supportsParam: ReadonlySet<OptionNamePlaceholder>;

  /**
   * A {@link msql.SQLNode} may be passed to this option.
   *
   * _More precisely_, it should be like a column selection, scalar function or an aggregation.
   */
  supportsSQLNode: ReadonlySet<OptionNamePlaceholder>;

  /**
   * An arbitrary object may be passed to this option.
   *
   * This **excludes** known classes like {@link mc.Param} & {@link msql.SQLNode} and primitives.
   */
  supportsObject: ReadonlySet<OptionNamePlaceholder>;
}

function setUnion<T>(left: ReadonlySet<T>, right: ReadonlySet<T>): ReadonlySet<T> {
  const cloned = new Set(left);
  for (const el of right) {
    cloned.add(el);
  }
  return cloned;
}

const PRIMTIVE: ReadonlySet<string> = new Set(['string', 'number', 'boolean', 'symbol']);

function isPrimitive(value: unknown): value is string | number | boolean | symbol | null {
  return PRIMTIVE.has(typeof value) || value === null;
}

function isBinTransform(value: any): value is BinReturn {
  return typeof value === 'function' && value[Transform];
}

function col(name: string): ColumnNameRefNode {
  return new ColumnNameRefNode(name);
}

/** TODO: Narrow after finishing recursion cases */
type EntryKey = string;

/** TODO: Narrow after finishing recursion cases */
type EntryValue = any;

export class OptionsImpl implements OptionsSpec {
  readonly supportsParam: ReadonlySet<OptionNamePlaceholder>;
  readonly supportsSQLNode: ReadonlySet<OptionNamePlaceholder>;
  readonly supportsObject: ReadonlySet<OptionNamePlaceholder>;

  constructor({ supportsParam, supportsSQLNode, supportsObject }: OptionsSpec) {
    this.supportsParam = supportsParam;
    this.supportsSQLNode = supportsSQLNode;
    this.supportsObject = supportsObject;
  }

  /** Return a new instance, extending one or more option sets. */
  with(extensions: Partial<OptionsSpec> = {}): OptionsImpl {
    const options = extensions;
    for (const name of ['supportsParam', 'supportsSQLNode', 'supportsObject'] as const) {
      options[name] = options[name] ? setUnion(this[name], options[name]) : this[name];
    }
    return new OptionsImpl(options as OptionsSpec);
  }

  /** Convert `MarkOptions` into something that's easy to generate queries with. */
  parse(options: MarkOptions): Map<EntryKey, EntryValue> {
    const it = this.iterOptions(options);
    const parseOne = this.parseEntry.bind(this);
    return new Map(chainFromIterable(map(it, parseOne)));
  }

  /**
   * Rough branching logic to identify the cases in `MarkOptions`.
   *
   * ## Notes
   *
   * - Haven't modelled `params`, `detail` or `channels` yet
   *
   *   - That kind of state would belong on `Mark`, not here which is shared between instances
   * - The current flow is "branch `value` type", "possibly constrain on `name`"
   *
   *   - Not easy to extend in one big block
   *   - The order of the checks is very sensitive to changes in `MarkOptions` annotations
   *   - _Ideally_, narrowing should utilize `Set | Map` more
   *   - Can anything be keyed on `(name, <some type representation>)`?
   */
  protected *parseEntry([name, value]: [
    keyof MarkOptions,
    MarkOptions[OptionName<MarkOptions>],
  ]): Iterable<[EntryKey, EntryValue]> {
    if (isPrimitive(value)) {
      throw new Error(`todo: handle primitives, got: ${value}`);
    } else if (value instanceof Param) {
      // oxlint-disable-next-line unicorn/prefer-ternary
      if (this.supportsParam.has(name)) {
        throw new Error(`todo: handle params, got: ${value}`);
      } else {
        throw new TypeError(`Params are not supported for '${name}', got: ${value}`);
      }
    } else if (isNode(value)) {
      // oxlint-disable-next-line unicorn/prefer-ternary
      if (this.supportsSQLNode.has(name)) {
        throw new Error(`todo: handle SQLNode, got: ${value}`);
      } else {
        throw new TypeError(`SQL is not supported for '${name}', got: ${value}`);
      }
    } else if (Array.isArray(value)) {
      throw new Error(`todo: handle ColumnValues, got: ${value}`);
    } else if (isBinTransform(value)) {
      // `bin` depends on `Mark.type` to determine if it returns an object with 1 or 2 channels
      // That logic should probably be defined in the `Mark` subclasses that require it
      throw new Error(`todo: handle BinReturn, got: ${value}`);
    } else if (typeof value === 'object') {
      if (name === 'channels') {
        const channelsExtra = new Map<string, msql.ColumnNameRefNode>();
        const channels = value as Record<string, string>;
        // oxlint-disable-next-line guard-for-in
        for (const fieldName in channels) {
          // TODO @:dangotbanned: Figure out if this a bug on `main`, but doesn't show because the examples use `{id: "id"}`
          // It should be `{existingName: "aliased"}` (field, as), which is the opposite of current
          channelsExtra.set(fieldName, col(channels[fieldName]));
        }
        yield ['channelsExtra', channelsExtra];
      }
      const todoTypes =
        'TipOptions | ChannelDomainSort | OrderValue | OrderChannel | Record<string, string> | ChannelValueLabel | ChannelValueScale';
      throw new Error(`todo: handle object ('${todoTypes}'), got: ${value}`);
    } else {
      throw new TypeError(`Unsupported data type '${typeof value}', got: ${value}`);
    }
  }

  /**
   * Yield entries from `options`.
   *
   * Intended to be overriden by subclasses, where the `this` value is depended on externally.
   *
   * The original code used `for...in`, which behaves [differently][1] to {@link Object.entries}.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in#iterating_over_own_properties_only
   */
  // oxlint-disable-next-line class-methods-use-this
  protected *iterOptions<O extends MarkOptions>(
    options: O,
  ): Iterable<[OptionName<O>, O[OptionName<O>]]> {
    // oxlint-disable-next-line guard-for-in
    for (const name in options) {
      const value = options[name];
      if (value !== undefined) {
        yield [name, value];
      }
    }
  }
}
