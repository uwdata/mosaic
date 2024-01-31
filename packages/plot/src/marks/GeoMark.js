import { geojson } from '@uwdata/mosaic-sql';
import { Mark, isDataArray } from './Mark.js';

// default geometry column created by st_read
// warning: if another "geom" column exists this default
// will shift, for example to "geom_1" and so on.
const DEFAULT_GEOMETRY_COLUMN = 'geom';

export class GeoMark extends Mark {
  constructor(source, encodings = {}, reqs) {
    if (!isDataArray(source) && !encodings?.geometry) {
      // if issuing queries and no geometry channel specified
      // then request default geometry column as GeoJSON
      encodings.geometry = geojson(DEFAULT_GEOMETRY_COLUMN);
    }

    super('geo', source, encodings, reqs);
  }

  queryResult(data) {
    super.queryResult(data);

    // parse GeoJSON strings to JSON objects
    const geom = this.channelField('geometry')?.as;
    if (geom && this.data) {
      this.data.forEach(data => {
        if (typeof data[geom] === 'string') {
          data[geom] = JSON.parse(data[geom]);
        }
      });
    }

    return this;
  }
}
