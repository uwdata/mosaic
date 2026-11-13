import { geojson } from '@uwdata/mosaic-sql';
import { Mark, isDataArray, type Encodings, type Reqs } from './Mark.js';
import type { Table } from '@uwdata/flechette';
import type { DataColumns } from '@uwdata/mosaic-core';

// default geometry column created by st_read
// warning: if another "geom" column exists this default
// will shift, for example to "geom_1" and so on.
const DEFAULT_GEOMETRY_COLUMN = 'geom';

export class GeoMark extends Mark {
  constructor(source: any, encodings: Encodings = {}, reqs: Reqs = {}) {
    if (!isDataArray(source) && !encodings?.geometry) {
      // if issuing queries and no geometry channel specified
      // then request default geometry column as GeoJSON
      encodings.geometry = geojson(DEFAULT_GEOMETRY_COLUMN);
    }

    super('geo', source, encodings, reqs);
  }

  queryResult(data: Table | Record<string, unknown>[]): this {
    super.queryResult(data); // map to columns, set this.data

    // look for an explicit geometry field
    const geom = this.channelField('geometry')?.as;
    if (geom) {
      if (!('columns' in this.data)) {
        throw new TypeError(`Missing columns in ${data}`);
      }
      const column = this.data.columns[geom];
      if (typeof column[0] === 'string') {
        this.data.columns[geom] = column.map(s => JSON.parse(s as string));
      }
    }

    return this;
  }
}
