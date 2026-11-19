// (used for JSDoc links)
// oxlint-disable-next-line no-unused-vars
import type * as mc from '@uwdata/mosaic-core';
import { Param } from '@uwdata/mosaic-core';
// oxlint-disable-next-line no-unused-vars
import type * as msql from '@uwdata/mosaic-sql';
import { ColumnNameRefNode, isNode, walk } from '@uwdata/mosaic-sql';

import { chainFromIterable, map } from '../itertools.js';
import { Transform } from '../symbols.js';
import type { TransformScaleName } from '../types.js';
import type { Mark2 } from './Mark2.js';
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

/**
 * Remove `key` from `mapping` and return the corresponding value.
 *
 * If the key is not found, returns `defaultValue`.
 */
function mapPop<V, D = undefined>(mapping: Map<any, V>, key: unknown, defaultValue?: D): V | D {
  const value = mapping.get(key) ?? defaultValue;
  mapping.delete(key);
  return value;
}

const PRIMTIVE: ReadonlySet<string> = new Set(['string', 'number', 'boolean', 'symbol']);

function isPrimitive(value: unknown): value is string | number | boolean | symbol | null {
  return PRIMTIVE.has(typeof value) || value === null;
}

function isBinTransform(value: any): value is BinReturn {
  return typeof value === 'function' && value[Transform];
}

const TRANSFORM_SCALE_NAME: ReadonlySet<string> = new Set([
  'x',
  'y',
  'color',
  'length',
  'symbol',
  'r',
  'opacity',
]);

function isTransformScaleName(channel: string): channel is TransformScaleName {
  return TRANSFORM_SCALE_NAME.has(channel);
}

function col(name: string): ColumnNameRefNode {
  return new ColumnNameRefNode(name);
}

const PARAM = 'PARAM';

function isParamNode(node: msql.SQLNode): node is msql.ParamNode {
  return node.type === PARAM;
}

/** TODO: Narrow after finishing recursion cases */
export type ChannelKey = string;

/**
 * TODO: Narrow after finishing recursion cases.
 *
 * - Field vs value
 * - Avoid using primitives directly
 */
export type ChannelEntryValue = any;

/**
 * Everything produced/mutated during `Mark`s `process` thing.
 *
 * ## Notes
 *
 * - On `main`, `detail` looks like book-keeping to make sense of what is in `channels`
 * - Here, `channelsExtra` is intended to replace that - which ends of being `options.channels`
 * - The regular channels are stored in ... `channels`
 */
export interface ParsedState {
  /**
   * Exclusively stores params that are part of queries (e.g. `Source.table` and
   * {@link msql.ParamNode}).
   *
   * Params passed directly to a channel (e.g. `x`) get an event listener that's different.
   */
  params: Set<mc.Param<any>>;

  channels: Map<ChannelKey, ChannelEntryValue>;

  /** Needs to be popped from the result of `parse` */
  channelsExtra: Map<string, msql.ColumnNameRefNode>;
}

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
  /**
   * Extract stuff from `options` to complete initialization of `mark`.
   *
   * ## Notes
   *
   * The way that `Mark`s constructor (on `main`) works is very complex.
   *
   * This method is required to ensure dependencies in both directions do not break, as they require
   * access to `mark`.
   *
   * ## Problems
   *
   * ### `bin`
   *
   * {@link BinReturn} depends on `mark`, which is resolved in `Mark.constructor`.
   *
   * The first dependency (`hasExtent`) requires `Mark.type` and `OptionName` (channel). This isn't
   * a huge problem, but the dependency is before `Mark` has finished being constructed - so
   * `Mark.type` is not guaranteed to exist yet.
   *
   * The second group of dependencies stem from `mark` being stored on 1 or 2 `BinTransformNode`s,
   * which are then later used for access to `Mark.channelField` and `Mark.plot.getAttribute`.
   * `Mark.plot` doesn't exist yet when `mark` is passed back to `bin`.
   *
   * So this dependency is:
   *
   * - `Mark` is stored on `Plot`
   * - `Plot` is stored on `Mark`
   * - `Mark` is stored on `BinTransformNode`
   * - `BinTransformNode` depends on `Mark` itself (in 2 different ways) and that `Plot` is accessible
   *   on `Mark`
   *
   * ### `Param` channels
   *
   * {@link OptionsSpec.supportsParam} explains the 3 different ways a `Param` may be handled inside
   * _a_ mark constructor.
   *
   * 2 are inside `Mark` itself, and together depend on:
   *
   * - `Mark.channels[*].value`
   * - `Mark.update`
   * - `Mark.plot`
   * - `Mark.plot.update`
   * - `Mark.params`
   * - `Mark.setPlot`
   * - `Plot.addParams`
   * - `Plot.params`
   * - `Mark.initialize`
   * - `Mark.queryPending`
   * - `Mark.plot.pending`
   */

  public parseOptionsFor<O extends MarkOptions>(
    mark: Mark2<O>,
    options: O,
    params: Set<mc.Param<any>>,
  ): ParsedState {
    const it = this.iterOptions(options);
    const parseOne = this.parseEntry(mark, params);
    const channels = new Map(chainFromIterable(map(it, parseOne)));
    return { channels, channelsExtra: mapPop(channels, 'channelsExtra'), params };
  }

  /**
   * Rough branching logic to identify the cases in `MarkOptions`.
   *
   * ## Notes
   *
   * - The current flow is "branch `value` type", "possibly constrain on `name`"
   *
   *   - Not easy to extend in one big block
   *   - The order of the checks is very sensitive to changes in `MarkOptions` annotations
   *   - _Ideally_, narrowing should utilize `Set | Map` more
   *   - Can anything be keyed on `(name, <some type representation>)`?
   */
  protected parseEntry<O extends MarkOptions>(
    mark: Mark2<O>,
    params: Set<mc.Param<any>>,
  ): ([name, value]: [OptionName<O>, O[OptionName<O>]]) => Iterable<
    [ChannelKey, ChannelEntryValue]
  > {
    const { supportsParam, supportsSQLNode, supportsObject } = this;

    // oxlint-disable-next-line max-statements
    function* iterParse([name, value]: [OptionName<O>, O[OptionName<O>]]): Iterable<
      [ChannelKey, ChannelEntryValue]
    > {
      if (isPrimitive(value)) {
        throw new Error(`todo: handle primitives, got: ${String(value)}`);
      } else if (value instanceof Param) {
        // oxlint-disable-next-line unicorn/prefer-ternary
        if (supportsParam.has(name)) {
          // oxlint-disable-next-line no-unused-expressions
          /** I need `mark` and the destination to define the setter binding */
          throw new Error(`todo: handle params, got: ${value}`);
        } else {
          throw new TypeError(`Params are not supported for '${name}', got: ${value}`);
        }
      } else if (isNode(value)) {
        if (supportsSQLNode.has(name)) {
          /**
           * Intentionally duplicated from `collectParams`, as this saves creating an additional
           * `Array` and `Set`
           */
          walk(value, (node) => {
            if (isParamNode(node)) {
              //@ts-expect-error `ParamLike` is not `Param`
              params.add(node.param);
            }
          });

          yield [name, value];
        } else {
          throw new TypeError(`SQL is not supported for '${name}', got: ${value}`);
        }
      } else if (Array.isArray(value)) {
        throw new Error(`todo: handle ColumnValues, got: ${value}`);
      } else if (isBinTransform(value)) {
        if (!isTransformScaleName(name)) {
          throw new TypeError(
            `A bin transform cannot be applied to a channel without a scale '${name}', got: ${value}`,
          );
        }
        const binResult = value(mark, name);
        // oxlint-disable-next-line guard-for-in no-unreachable-loop
        for (const binChannelName in binResult) {
          const c = binChannelName as keyof typeof binResult;
          // NOTE: Every example is `vg.bin("column_name")`, but `column` is typed as `ExprValue`
          const node = binResult[c];
          throw new Error(`todo: handle inside 'BinNodeTransform', got: ${node}`);
        }
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
        } else if (!supportsObject.has(name)) {
          throw new TypeError(`'${name}' does not support objects, got: ${value}`);
        } else {
          const todoTypes =
            'TipOptions | ChannelDomainSort | OrderValue | OrderChannel | Record<string, string> | ChannelValueLabel | ChannelValueScale';
          throw new Error(`todo: handle object ('${todoTypes}'), got: ${value}`);
        }
      } else {
        throw new TypeError(`Unsupported data type '${typeof value}', got: ${value}`);
      }
    }
    return iterParse;
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
