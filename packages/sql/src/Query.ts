import { isSQLExpression, SQLExpression } from "./expression";
import { asColumn, asRelation, isColumnRefFor, Ref } from "./ref";

export type Sample = {
  rows?: number;
  perc?: number;
  method?: string;
  seed?: number;
};

export type QueryFields = {
  with: { as: string; query: QueryFields }[];
  select: { as: string; expr: Ref }[];
  distinct?: boolean;
  from: { as?: string; from: Ref | Query }[];
  sample?: Sample;
  where: Ref[];
  groupby: Ref[];
  having: Ref[];
  window: { as: string; expr: Ref }[];
  qualify: Ref[];
  orderby: Ref[];
  limit?: number;
  offset?: number;
};

export class Query {
  cteFor?: Query;
  query: QueryFields;

  static select(
    ...expr: (string | Ref | Ref[] | [string, any] | { [key: string]: any })[]
  ) {
    return new Query().select(...expr);
  }

  static from(...expr: (string | Ref | Query)[]) {
    return new Query().from(...expr);
  }

  static with(
    ...expr: (
      | { as: string; query: any }
      | { as: string; [key: string]: any }
      | { [key: string]: Query }
    )[]
  ) {
    return new Query().with(...expr);
  }

  static union(...queries: Query[]) {
    return new SetOperation("UNION", queries.flat());
  }

  static unionAll(...queries: Query[]) {
    return new SetOperation("UNION ALL", queries.flat());
  }

  static intersect(...queries: Query[]) {
    return new SetOperation("INTERSECT", queries.flat());
  }

  static except(...queries: Query[]) {
    return new SetOperation("EXCEPT", queries.flat());
  }

  constructor() {
    this.query = {
      with: [],
      select: [],
      from: [],
      where: [],
      groupby: [],
      having: [],
      window: [],
      qualify: [],
      orderby: [],
    };
  }

  clone() {
    const q = new Query();
    q.query = { ...this.query };
    return q;
  }

  with(): { as: string; query: QueryFields }[];
  with(
    ...expr: (
      | { as: string; query: any }
      | { as: string; [key: string]: any }
      | { [key: string]: Query }
    )[]
  ): this;
  with(
    ...expr: (
      | { as: string; query: any }
      | { as: string; [key: string]: any }
      | { [key: string]: Query }
    )[]
  ) {
    const { query } = this;
    if (expr.length === 0) {
      return query.with;
    } else {
      const list: { as: string; query: QueryFields }[] = [];
      const add = (as: string, q: any) => {
        const query = q.clone();
        query.cteFor = this;
        list.push({ as, query });
      };
      expr.flat().forEach((e) => {
        if (e == null) {
          // do nothing
        } else if (e.as && e.query && typeof e.as === "string") {
          add(e.as, e.query);
        } else {
          for (const as in e) {
            add(as, (e as { [key: string]: any })[as]);
          }
        }
      });
      query.with = query.with.concat(list);
      return this;
    }
  }

  select(): { as: string; expr: Ref }[];
  select(
    ...expr: (string | Ref[] | Ref | [string, any] | { [key: string]: any })[]
  ): this;
  select(
    ...expr: (string | Ref[] | Ref | [string, any] | { [key: string]: any })[]
  ) {
    const { query } = this;
    if (expr.length === 0) {
      return query.select;
    } else {
      const list: { as: string; expr: any }[] = [];
      for (const e of expr.flat()) {
        if (e == null) {
          // do nothing
        } else if (typeof e === "string") {
          list.push({ as: e, expr: asColumn(e) });
        } else if (e instanceof Ref) {
          list.push({ as: e.column!, expr: e });
        } else if (Array.isArray(e)) {
          list.push({ as: e[0], expr: e[1] });
        } else {
          for (const as in e) {
            list.push({ as: unquote(as), expr: asColumn(e[as]) });
          }
        }
      }
      query.select = query.select.concat(list);
      return this;
    }
  }

  $select(...expr: (string | Ref[] | [string, any])[]) {
    this.query.select = [];
    return this.select(...expr);
  }

  distinct(value = true) {
    this.query.distinct = !!value;
    return this;
  }

  from(): { as?: string; from: Ref | Query }[];
  from(
    ...expr: (string | Ref | Query | { [key: string]: string | Ref | Query })[]
  ): this;
  from(
    ...expr: (string | Ref | Query | { [key: string]: string | Ref | Query })[]
  ) {
    const { query } = this;
    if (expr.length === 0) {
      return query.from;
    } else {
      const list: { as?: string; from: any }[] = [];
      expr.flat().forEach((e) => {
        if (e == null) {
          // do nothing
        } else if (typeof e === "string") {
          list.push({ as: e, from: asRelation(e) });
        } else if (e instanceof Ref) {
          list.push({ as: e.table, from: e });
        } else if (isQuery(e) || isSQLExpression(e)) {
          list.push({ from: e });
        } else if (Array.isArray(e)) {
          list.push({ as: unquote(e[0]), from: asRelation(e[1]) });
        } else {
          const obj = e as { [key: string]: string | Ref };
          for (const as in obj) {
            list.push({ as: unquote(as), from: asRelation(obj[as]) });
          }
        }
      });
      query.from = query.from.concat(list);
      return this;
    }
  }

  $from(...expr: (string | Ref | Query | { [key: string]: string | Ref })[]) {
    this.query.from = [];
    return this.from(...expr);
  }

  sample(): Sample | undefined;
  sample(value?: Sample | number, method?: string): this;
  sample(value?: Sample | number, method?: string) {
    const { query } = this;
    if (arguments.length === 0) {
      return query.sample;
    } else {
      let spec = value;
      if (typeof value === "number") {
        spec =
          value > 0 && value < 1
            ? { perc: 100 * value, method }
            : { rows: Math.round(value), method };
      }
      query.sample = spec as Sample;
      return this;
    }
  }

  where(): Ref[];
  where(...expr: any[]): this;
  where(...expr: any[]) {
    const { query } = this;
    if (expr.length === 0) {
      return query.where;
    } else {
      query.where = query.where.concat(expr.flat().filter((x) => x));
      return this;
    }
  }

  $where(...expr: any[]) {
    this.query.where = [];
    return this.where(...expr);
  }

  groupby(): Ref[];
  groupby(...expr: (Ref | string | (Ref | string)[])[]): this;
  groupby(...expr: (Ref | string | (Ref | string)[])[]) {
    const { query } = this;
    if (expr.length === 0) {
      return query.groupby;
    } else {
      query.groupby = query.groupby.concat(
        expr
          .flat()
          .filter((x) => x)
          .map(asColumn)
      );
      return this;
    }
  }

  $groupby(...expr: (Ref | string)[]) {
    this.query.groupby = [];
    return this.groupby(...expr);
  }

  having(): Ref[];
  having(...expr: any[]): this;
  having(...expr: any[]) {
    const { query } = this;
    if (expr.length === 0) {
      return query.having;
    } else {
      query.having = query.having.concat(expr.flat().filter((x) => x));
      return this;
    }
  }

  window(): { as: string; expr: Ref }[];
  window(...expr: { [key: string]: string | Ref }[]): this;
  window(...expr: { [key: string]: string | Ref }[]) {
    const { query } = this;
    if (expr.length === 0) {
      return query.window;
    } else {
      const list: { as: string; expr: any }[] = [];
      expr.flat().forEach((e) => {
        if (e == null) {
          // do nothing
        } else {
          for (const as in e) {
            list.push({ as: unquote(as), expr: e[as] });
          }
        }
      });
      query.window = query.window.concat(list);
      return this;
    }
  }

  qualify(): Ref[];
  qualify(...expr: any[]): this;
  qualify(...expr: any[]) {
    const { query } = this;
    if (expr.length === 0) {
      return query.qualify;
    } else {
      query.qualify = query.qualify.concat(expr.flat().filter((x) => x));
      return this;
    }
  }

  orderby(): Ref[];
  orderby(
    ...expr: ((Ref | string | SQLExpression)[] | Ref | string | SQLExpression)[]
  ): this;
  orderby(...expr: (Ref | string | SQLExpression)[]) {
    const { query } = this;
    if (expr.length === 0) {
      return query.orderby;
    } else {
      query.orderby = query.orderby.concat(
        expr
          .flat()
          .filter((x) => x)
          .map(asColumn)
      );
      return this;
    }
  }

  limit(): number | undefined;
  limit(value?: number): this;
  limit(value?: number) {
    const { query } = this;
    if (arguments.length === 0) {
      return query.limit;
    } else {
      query.limit = Number.isFinite(value) ? value : undefined;
      return this;
    }
  }

  offset(): number | undefined;
  offset(value?: number): this;
  offset(value?: number) {
    const { query } = this;
    if (arguments.length === 0) {
      return query.offset;
    } else {
      query.offset = Number.isFinite(value) ? value : undefined;
      return this;
    }
  }

  get subqueries() {
    const { query, cteFor } = this;
    const ctes = (cteFor?.query || query).with;
    const cte = ctes?.reduce(
      (
        prev: { [key: string]: QueryFields },
        curr: { as: string; query: QueryFields }
      ) => {
        prev[curr.as] = curr.query;
        return prev;
      },
      {} as { [key: string]: QueryFields }
    );
    const q: (Query | QueryFields)[] = [];
    query.from.forEach(({ from }) => {
      if (isQuery(from)) {
        q.push(from as Query);
      } else if (cte[(from as Ref).table!]) {
        const sub = cte[(from as Ref).table!];
        q.push(sub);
      }
    });
    return q;
  }

  toString() {
    const {
      select,
      distinct,
      from,
      sample,
      where,
      groupby,
      having,
      window,
      qualify,
      orderby,
      limit,
      offset,
      with: cte,
    } = this.query;

    const sql: string[] = [];

    // WITH
    if (cte.length) {
      const list = cte.map(({ as, query }) => `"${as}" AS (${query})`);
      sql.push(`WITH ${list.join(", ")}`);
    }

    // SELECT
    const sels = select.map(({ as, expr }) =>
      isColumnRefFor(expr, as) && !expr.table ? `${expr}` : `${expr} AS "${as}"`
    );
    sql.push(`SELECT${distinct ? " DISTINCT" : ""} ${sels.join(", ")}`);

    // FROM
    if (from.length) {
      const rels = from.map(({ as, from }) => {
        const rel = isQuery(from) ? `(${from})` : `${from}`;
        return !as || as === (from as Ref).table ? rel : `${rel} AS "${as}"`;
      });
      sql.push(`FROM ${rels.join(", ")}`);
    }

    // WHERE
    if (where.length) {
      const clauses = where
        .map(String)
        .filter((x) => x)
        .join(" AND ");
      if (clauses) sql.push(`WHERE ${clauses}`);
    }

    // SAMPLE
    if (sample) {
      const { rows, perc, method, seed } = sample;
      const size = rows ? `${rows} ROWS` : `${perc} PERCENT`;
      const how = method
        ? ` (${method}${seed != null ? `, ${seed}` : ""})`
        : "";
      sql.push(`USING SAMPLE ${size}${how}`);
    }

    // GROUP BY
    if (groupby.length) {
      sql.push(`GROUP BY ${groupby.join(", ")}`);
    }

    // HAVING
    if (having.length) {
      const clauses = having
        .map(String)
        .filter((x) => x)
        .join(" AND ");
      if (clauses) sql.push(`HAVING ${clauses}`);
    }

    // WINDOW
    if (window.length) {
      const windows = window.map(({ as, expr }) => `"${as}" AS (${expr})`);
      sql.push(`WINDOW ${windows.join(", ")}`);
    }

    // QUALIFY
    if (qualify.length) {
      const clauses = qualify
        .map(String)
        .filter((x) => x)
        .join(" AND ");
      if (clauses) sql.push(`QUALIFY ${clauses}`);
    }

    // ORDER BY
    if (orderby.length) {
      sql.push(`ORDER BY ${orderby.join(", ")}`);
    }

    // LIMIT
    if (Number.isFinite(limit)) {
      sql.push(`LIMIT ${limit}`);
    }

    // OFFSET
    if (Number.isFinite(offset)) {
      sql.push(`OFFSET ${offset}`);
    }

    return sql.join(" ");
  }
}

export class SetOperation {
  op: string;
  queries: Query[];
  cteFor?: Query;
  query: {
    orderby: Ref[];
    limit?: number;
    offset?: number;
  };

  constructor(op: string, queries: Query[]) {
    this.op = op;
    this.queries = queries.map((q) => q.clone());
    this.query = { orderby: [] };
  }

  clone() {
    const q = new SetOperation(this.op, this.queries);
    q.query = { ...this.query };
    return q;
  }

  orderby(): Ref[];
  orderby(...expr: (Ref | string)[]): this;
  orderby(...expr: (Ref | string)[]) {
    const { query } = this;
    if (expr.length === 0) {
      return query.orderby;
    } else {
      query.orderby = query.orderby.concat(
        expr
          .flat()
          .filter((x) => x)
          .map(asColumn)
      );
      return this;
    }
  }

  limit(): number | undefined;
  limit(value?: number): this;
  limit(value?: number) {
    const { query } = this;
    if (arguments.length === 0) {
      return query.limit;
    } else {
      query.limit = Number.isFinite(value) ? value : undefined;
      return this;
    }
  }

  offset(): number | undefined;
  offset(value?: number): this;
  offset(value?: number) {
    const { query } = this;
    if (arguments.length === 0) {
      return query.offset;
    } else {
      query.offset = Number.isFinite(value) ? value : undefined;
      return this;
    }
  }

  get subqueries() {
    const { queries, cteFor } = this;
    if (cteFor) queries.forEach((q) => (q.cteFor = cteFor));
    return queries;
  }

  toString() {
    const {
      op,
      queries,
      query: { orderby, limit, offset },
    } = this;

    const sql = [queries.join(` ${op} `)];

    // ORDER BY
    if (orderby.length) {
      sql.push(`ORDER BY ${orderby.join(", ")}`);
    }

    // LIMIT
    if (Number.isFinite(limit)) {
      sql.push(`LIMIT ${limit}`);
    }

    // OFFSET
    if (Number.isFinite(offset)) {
      sql.push(`OFFSET ${offset}`);
    }

    return sql.join(" ");
  }
}

export function isQuery(value: any) {
  return value instanceof Query || value instanceof SetOperation;
}

function unquote(s: string) {
  return isDoubleQuoted(s) ? s.slice(1, -1) : s;
}

function isDoubleQuoted(s: string) {
  return s[0] === '"' && s[s.length - 1] === '"';
}
