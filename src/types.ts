import { DirectiveBinding, VNode } from "vue";

export type Position = `${"left" | "right" | "center"} ${"top" | "bottom"}`;

export interface IAntdvTableVNode extends VNode {
  ctx?: {
    ctx?: {
      columns?: {
        align?: string;
        customTitle?: string;
        dataIndex?: string;
        ellipsis: boolean;
        key: string;
        label: string;
      };
      dataSource?: Array<{ [key: string]: any }>;
    };
  };
}

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
  fixed: boolean;
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
  movable?: boolean;
  smoothScroll?: boolean;
  zIndex?: number;

  loop?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
  };
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
