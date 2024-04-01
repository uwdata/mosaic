export type SpecSelection = {
  select: SelectionType,
  cross?: boolean
};

export type SelectionType =
  | 'crossfilter'
  | 'intersect'
  | 'single'
  | 'union';
