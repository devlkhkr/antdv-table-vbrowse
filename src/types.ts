import { DirectiveBinding } from "vue";

export type Position = `${"left" | "right" | "center"} ${"top" | "bottom"}`;

export interface AntdvTableDOM extends HTMLElement {
  active: boolean;
  isOpened: boolean;
  targetIdx: number;
  activeCol: Array<string>;
  filteredDataIndex: {
    rowIndex: number;
    matchedCellCols: Array<number>;
  }[];
  targetDataKey: string;
  totalMatches: number;
  position: Position;
  searchKeyword: string;
  _cleanup: () => void;
  _cleanupDrag: () => void;
}

export interface AntdvTableVbrowseOptions {
  active?: boolean;
  defaultOpen?: boolean;
  placeholder?: string;
  noResultText?: string;

  searchAreaBgColor?: string;
  searchAreaFontColor?: string;

  searchedCellBgColor?: string;
  targetCellBgColor?: string;

  position?: Position;
  moveable?: boolean;
  smoothScroll?: boolean;

  loop?: boolean;
}

export interface AntdvTableVbrowseBinding
  extends Omit<DirectiveBinding, "value"> {
  value: AntdvTableVbrowseOptions;
}

export interface IFilteredDataIndex {
  rowIndex: number;
  matchedCellCols: Array<number>;
}

export interface IRowCol {
  row: number;
  col: number;
}

export interface IConfigStyle {
  POS_X: string;
  POS_Y: string;
  POS_H: string;

  POSITION: Position;
  SEARCH_AREA_BG_COLOR: string;
  SEARCH_AREA_FONT_COLOR: string;

  SEARCHED_CELL_BG_COLOR: string;
  TARGET_CELL_BG_COLOR: string;
}

export interface IConfigMsg {
  NO_RESULT: string;
  PLACEHOLDER: string;
}
