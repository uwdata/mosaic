import { ParamRef } from '../Param.js';
import { ChannelValue, ChannelValueSpec, MarkData, MarkOptions } from './Marks.js';

/** Options for the geo mark. */
export interface GeoOptions extends MarkOptions {
  /**
   * A required channel for the geometry to render; defaults to identity,
   * assuming *data* is a GeoJSON object or an iterable of GeoJSON objects.
   */
  geometry?: ChannelValue;

  /**
   * The size of Point and MultiPoint geometries, defaulting to a constant 3
   * pixels. If **r** is a number, it is interpreted as a constant radius in
   * pixels; otherwise it is interpreted as a channel and the effective radius
   * is controlled by the *r* scale, which defaults to a *sqrt* scale such that
   * the visual area of a point is proportional to its associated value.
   *
   * If **r** is a channel, geometries will be sorted by descending radius by
   * default, to limit occlusion; use the **sort** transform to control render
   * order. Geometries with a nonpositive radius are not drawn.
   */
  r?: ChannelValueSpec | ParamRef;
}

/** The geo mark. */
export interface Geo extends MarkData, GeoOptions {
  /**
   * A geo mark. The **geometry** channel, which defaults to the identity
   * function assuming that *data* is a GeoJSON object or an iterable of
   * GeoJSON objects, is projected to the plane using the plot’s top-level
   * **projection**.
   *
   * If *data* is a GeoJSON feature collection, then the mark’s data is
   * *data*.features; if *data* is a GeoJSON geometry collection, then the
   * mark’s data is *data*.geometries; if *data* is some other GeoJSON
   * object, then the mark’s data is the single-element array [*data*].
   */
  mark: 'geo';
}

/** The sphere mark. */
export interface Sphere extends MarkOptions {
  /**
   * A geo mark whose *data* is the outline of the sphere on the
   * projection’s plane. (For use with a spherical **projection** only.)
   */
  mark: 'sphere';
}

/** The graticule mark. */
export interface Graticule extends MarkOptions {
  /**
   * A geo mark whose *data* is a 10° global graticule. (For use with a
   * spherical **projection** only.)
   */
  mark: 'graticule';
}
