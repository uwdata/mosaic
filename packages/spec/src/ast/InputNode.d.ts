export type SpecInput = {
  input: 'menu' | 'search' | 'slider' | 'table';
} & {
  [key: string]: any
};
