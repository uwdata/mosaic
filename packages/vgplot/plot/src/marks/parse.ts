// (used for JSDoc links)
// oxlint-disable no-unused-vars
import type * as mc from '@uwdata/mosaic-core';
import type * as msql from '@uwdata/mosaic-sql';
// oxlint-enable no-unused-vars

/**
 * Placeholder for if this'll be generic.
 *
 * A type parameter can't be resolved in a `static`, may need to keep things opaque.
 */
type OptionName = string;

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
  supportsParam: ReadonlySet<OptionName>;

  /**
   * A {@link msql.SQLNode} may be passed to this option.
   *
   * _More precisely_, it should be like a column selection, scalar function or an aggregation.
   */
  supportsSQLNode: ReadonlySet<OptionName>;

  /**
   * An arbitrary object may be passed to this option.
   *
   * This **excludes** known classes like {@link mc.Param} & {@link msql.SQLNode} and primitives.
   */
  supportsObject: ReadonlySet<OptionName>;
}

function setUnion<T>(left: ReadonlySet<T>, right: ReadonlySet<T>): ReadonlySet<T> {
  const cloned = new Set(left);
  for (const el of right) {
    cloned.add(el);
  }
  return cloned;
}

export class OptionsImpl implements OptionsSpec {
  readonly supportsParam: ReadonlySet<OptionName>;
  readonly supportsSQLNode: ReadonlySet<OptionName>;
  readonly supportsObject: ReadonlySet<OptionName>;

  constructor({ supportsParam, supportsSQLNode, supportsObject }: OptionsSpec) {
    this.supportsParam = supportsParam;
    this.supportsSQLNode = supportsSQLNode;
    this.supportsObject = supportsObject;
  }

  /** Return a new instance, extending one or more option sets. */
  with(extensions: Partial<OptionsSpec> = {}): OptionsImpl {
    // NOTE: Suprisingly painful to do this in TS
    const options = extensions;
    for (const name of ['supportsParam', 'supportsSQLNode', 'supportsObject'] as const) {
      options[name] = options[name] ? setUnion(this[name], options[name]) : this[name];
    }
    return new OptionsImpl(options as OptionsSpec);
  }
}
