import * as vg from '../setup.js';

export default function(el) {
  el.appendChild(
    vg.table({ from: 'flights', height: 500 })
  );
}
