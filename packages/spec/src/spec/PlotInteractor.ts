export type PlotInteractor = {
  select: string;
} & {
  // todo: specific interactors
  [key: string]: any;
};
