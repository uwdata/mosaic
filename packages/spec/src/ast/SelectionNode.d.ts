export type SelectionType =
  | 'crossfilter'
  | 'intersect'
  | 'single'
  | 'union';

export interface SpecSelection {
  select: SelectionType;
  cross?: boolean;
}
