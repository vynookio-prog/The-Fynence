export * from '../types/image';
export * from '../contracts/image.contract';

export interface ColumnDimensionConfig {
  width: number;
  defaultHeight: number;
}

export const BROADSHEET_COLUMN_WIDTHS: Record<1 | 2 | 3 | 4, number> = {
  1: 300,
  2: 620,
  3: 940,
  4: 1260,
};
