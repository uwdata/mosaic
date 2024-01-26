export function create(
  name: string,
  query: string,
  {
    replace = false,
    temp = true,
    view = false,
  }: {
    replace?: boolean;
    temp?: boolean;
    view?: boolean;
  }
) {
  return (
    "CREATE" +
    (replace ? " OR REPLACE " : " ") +
    (temp ? "TEMP " : "") +
    (view ? "VIEW" : "TABLE") +
    (replace ? " " : " IF NOT EXISTS ") +
    name +
    " AS " +
    query
  );
}
