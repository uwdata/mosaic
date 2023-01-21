export default function(el = document.body) {
  const vg = vgplot;

  const table = 'penguins';
  const w = 'body_mass';
  const x = 'bill_length';
  const y = 'bill_depth';
  const z = 'flipper_length';

  const ws = new vg.Selection();
  const xs = new vg.Selection();
  const ys = new vg.Selection();
  const zs = new vg.Selection();

  el.appendChild(
    vg.hconcat(
      vg.vconcat(
        vg.plot(
          vg.frame(),
          vg.dot(vg.from(table), { x, y, fill: 'species', r: 2, clip: true }),
          vg.panZoom({ x: xs, y: ys }),
          vg.width(400),
          vg.height(300)
        ),
        vg.plot(
          vg.frame(),
          vg.dot(vg.from(table), { x, y: z, fill: 'species', r: 2, clip: true }),
          vg.panZoom({ x: xs, y: zs }),
          vg.width(400),
          vg.height(300)
        )
      ),
      vg.vconcat(
        vg.plot(
          vg.frame(),
          vg.dot(vg.from(table), { x: w, y, fill: 'species', r: 2, clip: true }),
          vg.panZoom({ x: ws, y: ys }),
          vg.width(400),
          vg.height(300)
        ),
        vg.plot(
          vg.frame(),
          vg.dot(vg.from(table), { x: w, y: z, fill: 'species', r: 2, clip: true }),
          vg.panZoom({ x: ws, y: zs }),
          vg.width(400),
          vg.height(300)
        )
      )
    )
  );
}
