export default function(el) {
  el.appendChild(
    vgplot.table({ from: 'flights', height: 500 })
  );
}
