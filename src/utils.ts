import { ComponentPublicInstance, h, render } from "vue";
import {
  AntdvTableVbrowseBinding,
  AntdvTableDOM,
  IFilteredDataIndex,
  IRowCol,
  Position,
  IAntdvTableVNode,
} from "./types";
import { debounce, memoize } from "lodash-es";
import { CONFIG_MSG, CONFIG_STYLE } from "./config";
import {
  CloseOutlined,
  DownCircleOutlined,
  HolderOutlined,
  LoadingOutlined,
  PushpinFilled,
  PushpinOutlined,
  SearchOutlined,
  UpCircleOutlined,
} from "@ant-design/icons-vue";

// 컬럼 정보를 메모이제이션하여 성능 최적화
export const memoizedGetColumns = memoize(
  (instance: ComponentPublicInstance<any>, vnode: IAntdvTableVNode) =>
    typeof instance.getColumns === "function"
      ? instance.getColumns()
      : vnode.ctx?.ctx?.columns
);

// 데이터 소스를 메모이제이션하여 성능 최적화
export const memoizedGetDataSource = memoize(
  (instance: ComponentPublicInstance<any>, vnode: IAntdvTableVNode) =>
    typeof instance.getDataSource === "function"
      ? instance.getDataSource()
      : vnode.ctx?.ctx?.dataSource
);

export const updateMemoizedFunctions = (
  instance: ComponentPublicInstance<any>,
  vnode: IAntdvTableVNode
) => {
  if (
    memoizedGetColumns.cache &&
    typeof memoizedGetColumns.cache.clear === "function"
  ) {
    memoizedGetColumns.cache.clear();
  }
  if (
    memoizedGetDataSource.cache &&
    typeof memoizedGetDataSource.cache.clear === "function"
  ) {
    memoizedGetDataSource.cache.clear();
  }
  memoizedGetColumns(instance, vnode);
  memoizedGetDataSource(instance, vnode);
};

// 활성 컬럼을 설정하고 셀을 하이라이트하는 함수
export const setActiveColAndHighlightCell = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode
) => {
  const instance: ComponentPublicInstance<any> = binding.instance;
  const columns = memoizedGetColumns(instance, vnode);

  // 숨겨지지 않고 dataIndex가 문자열인 컬럼만 필터링하여 활성 컬럼으로 설정
  el.activeCol = columns
    .filter(
      (column: { defaultHidden: boolean; dataIndex: unknown }) =>
        !column.defaultHidden && typeof column.dataIndex === "string"
    )
    .map((column: { dataIndex: unknown }) => column.dataIndex as string);

  // 검색창이 열려있으면 셀 하이라이트 실행
  if (el.isOpened) {
    requestAnimationFrame(() => highlightCells(el, binding, vnode));
  }
};

/**
 * 현재 page에서 searchKeyword가 포함된 cell의 색상 강조
 * @param el
 * @param binding
 */
const highlightCells = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode
) => {
  if (!el.filteredDataIndex) return; // 검색 결과가 없으면 return
  const instance: ComponentPublicInstance<any> = binding.instance; // 컴포넌트 인스턴스
  let pagination =
    typeof instance.getPaginationRef === "function"
      ? instance.getPaginationRef()
      : binding.value.pagination; // 페이징 정보
  const _dataSource = memoizedGetDataSource(binding.instance, vnode);
  const smoothScroll = binding.value.smoothScroll || false;

  if (!pagination) {
    pagination = {
      current: 1,
      pageSize: _dataSource.length,
    };
  }

  // 현재 페이지의 시작과 끝 행 인덱스 계산
  const pgStartRowIdx = (pagination.current - 1) * pagination.pageSize;
  const pgEndRowIdx = Math.min(
    pagination.current * pagination.pageSize - 1,
    _dataSource.length
  );

  // 키워드가 포함된 데이터중 현재 페이지에 해당하는 데이터만 필터링
  const pgFilterdData = el.filteredDataIndex.filter((fd) => {
    return fd.rowIndex >= pgStartRowIdx && fd.rowIndex <= pgEndRowIdx;
  });

  clearCellColor(el); // 기존 하이라이트 제거

  if (el.searchKeyword) {
    pgFilterdData.forEach((fd) => {
      fd.matchedCellCols.forEach((colIdx) => {
        // 색이 칠해져야 하는 cell 검색
        const targetRowIndex = fd.rowIndex - pgStartRowIdx;

        // tbody에서 .ant-table-row를 모두 선택하고, .ant-table-measure-row를 제외한 실제 행을 찾습니다.
        const rows = el.querySelectorAll(
          "tbody .ant-table-row:not(.ant-table-measure-row)"
        );

        // 실제 행 중에서 targetRowIndex에 해당하는 행을 찾습니다.
        const row = rows[targetRowIndex] as HTMLElement;

        if (row) {
          const cell = row.querySelector(
            `td.ant-table-cell:nth-child(${colIdx + 1})`
          ) as HTMLElement;
          if (cell) {
            cell.setAttribute("data-searched-idx", `${fd.rowIndex}_${colIdx}`);
            // cell이 존재하면
            if (el.targetDataKey === `${fd.rowIndex}_${colIdx}`) {
              // 현재 타겟 cell이면 targetColor로 색상 변경
              cell.style.backgroundColor =
                binding.value.targetCellBgColor || "#ff000045";
            } else {
              // el.targetIdx를 계산하기 위한 targetCell용 data-searched-idx 속성 추가
              cell.style.backgroundColor =
                binding.value.searchedCellBgColor || "#ffff0035";
            }
          } else {
            // cell이 존재하지 않으면
            console.log(targetRowIndex, colIdx + 1);
            console.error("cell not found");
          }
        } else {
          console.error("row not found");
        }
      });
    });
  }

  // 타겟 셀로 스크롤 이동
  const cell = el.querySelector(
    `.ant-table-cell[data-searched-idx="${el.targetDataKey}"]`
  ) as HTMLElement;

  if (cell) {
    cell.style.backgroundColor = binding.value.targetCellBgColor || "#ff000045";
    cell.scrollIntoView({
      block: "center",
      inline: "center",
      behavior: smoothScroll ? "smooth" : "auto",
    }); // 해당 Cell로 스크롤 이동
  }
  // E : 타겟 Cell 찾기
};

// 검색 키워드가 변경되었을 때 호출되는 함수
const handleKeywordChange = debounce(
  (
    e: Event,
    el: AntdvTableDOM,
    binding: AntdvTableVbrowseBinding,
    vnode: IAntdvTableVNode
  ) => {
    const searchKeyword = (e.target as HTMLInputElement).value;
    if (searchKeyword === el.searchKeyword) return;

    el.searchKeyword = searchKeyword;
    const _dataSource = memoizedGetDataSource(binding.instance, vnode);

    const filteredDataIndex: IFilteredDataIndex[] = [];
    let totalMatches = 0;

    if (searchKeyword && searchKeyword.trim().length) {
      _dataSource.forEach((data: any, index: number) => {
        const matchedCellCols: number[] = el.activeCol.reduce(
          (acc: number[], col, i) => {
            if (data[col] && data[col].toString().includes(searchKeyword)) {
              totalMatches++;
              acc.push(i);
            }
            return acc;
          },
          []
        );

        if (matchedCellCols.length > 0) {
          filteredDataIndex.push({ rowIndex: index, matchedCellCols });
        }
      });
    }

    el.targetIdx = 0;
    el.filteredDataIndex = filteredDataIndex;
    el.totalMatches = totalMatches;

    setSearchInfoTxt(el, binding, vnode, 0, searchKeyword);

    if (filteredDataIndex.length > 0) {
      goNext(el, binding, vnode);
    } else {
      clearCellColor(el);
    }
  },
  300
);

// 검색 열기
export const openSearch = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode
) => {
  el.isOpened = true;
  const searchArea = el.querySelector(
    ".antdv-table-vbrowse-search-area"
  ) as HTMLElement;

  const input = searchArea.querySelector("input");
  if (input) {
    input.focus();
  }
  highlightCells(el, binding, vnode);

  el.classList.add("antdv-table-vbrowse-opened");
};

// 검색 닫기
export const closeSearch = (el: AntdvTableDOM) => {
  el.isOpened = false;
  clearCellColor(el);
  el.classList.remove("antdv-table-vbrowse-opened");
};

// 숫자를 입력하여 searched data의 해당 index로 바로 이동
const handleJumperChange = (
  event: Event,
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode
) => {
  let jumpTo = parseInt((event.target as HTMLInputElement).value);

  // 입력 받은 값이 숫자가 아니면 기존 targetIdx 값으로 롤백
  if (isNaN(jumpTo)) {
    el.targetIdx -= 1;
    goNext(el, binding, vnode);
    return;
  }

  // 입력 받은 값이 totalMatches 보다 크거나 1보다 작을 때 max, min 처리
  jumpTo = jumpTo > el.totalMatches ? el.totalMatches : jumpTo;
  jumpTo = jumpTo < 1 ? 1 : jumpTo;

  el.targetIdx = jumpTo - 1;
  goNext(el, binding, vnode);
};

// 검색결과 text 업데이트
const setSearchInfoTxt = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode,
  targetIdx: number,
  searchKeyword: string,
  isEnd?: boolean
) => {
  if (isEnd) {
    doShake(el);
    return;
  }

  const searchInfoSpan = el.querySelector(
    ".antdv-table-vbrowse-search-info"
  ) as HTMLElement;
  const jumperInput = document.createElement("input");
  const domTotalMatches = document.createElement("span");
  const pallete = getPallete(binding);

  domTotalMatches.textContent = ` / ${el.totalMatches}`;
  jumperInput.type = "text";
  jumperInput.value = (targetIdx + 1).toString();
  jumperInput.style.width = "60px";
  jumperInput.style.textAlign = "right";
  jumperInput.style.backgroundColor = pallete.backgroundColor;
  jumperInput.style.color = pallete.color;
  jumperInput.onchange = (event) => {
    handleJumperChange(event, el, binding, vnode);
  };

  searchInfoSpan!.innerHTML = "";

  if (searchInfoSpan && searchKeyword) {
    searchInfoSpan.style.maxWidth = "500px";
    searchInfoSpan.style.opacity = "1";
    if (el.totalMatches) {
      searchInfoSpan.style.color = "#fff";
      searchInfoSpan.appendChild(jumperInput);
      searchInfoSpan.appendChild(domTotalMatches);
    } else if (el.totalMatches === 0) {
      searchInfoSpan.style.color = "#ff935e";
      searchInfoSpan.innerHTML =
        binding.value.noResultText || CONFIG_MSG.NO_RESULT;
      doShake(el);
    }
  } else {
    searchInfoSpan.style.maxWidth = "0";
    searchInfoSpan.style.opacity = "0";
    searchInfoSpan.innerHTML = "";
  }
};

// 더이상 동작할 수 없는 경우 검색박스 흔들기 애니메이션
export const doShake = (el: AntdvTableDOM) => {
  const shaker = el.querySelector(".shaker");
  shaker!.classList.add("shake");
  setTimeout(() => {
    shaker!.classList.remove("shake");
  }, 300);
};

// 다음 검색 결과로 이동
export const goNext = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode
) => {
  const instance: ComponentPublicInstance<any> = binding.instance; // 컴포넌트 인스턴스
  let pagination =
    typeof instance.getPaginationRef === "function"
      ? instance.getPaginationRef()
      : binding.value.pagination; // 페이징 정보
  let singlePage = false;

  if (!pagination) {
    singlePage = true;
    const _dataSource = memoizedGetDataSource(binding.instance, vnode);
    pagination = {
      current: 1,
      pageSize: _dataSource.length,
    };
  }

  const filteredDataIndex = el.filteredDataIndex!;
  const searchKeyword = el.searchKeyword!;
  let targetIdx = el.targetIdx;
  let isEnd = targetIdx == el.totalMatches;
  const isLoop = binding.value.loop || false;

  if (!filteredDataIndex || filteredDataIndex.length === 0 || !searchKeyword)
    return;

  if (isLoop && isEnd) {
    targetIdx = 0;
    isEnd = false;
  }

  setSearchInfoTxt(el, binding, vnode, targetIdx, searchKeyword, isEnd);

  if (isEnd) return; // 마지막 검색결과면 종료

  const targetRowCol = getCombinedValue(filteredDataIndex, targetIdx); // 현재 타겟 Cell 데이터 키 저장

  const dataAt = targetRowCol.row / pagination.pageSize;
  let page = dataAt < 1 ? 1 : Math.ceil(dataAt);

  const scrollPer = parseFloat(dataAt.toString()) - Math.floor(dataAt);

  if (scrollPer === 0 && dataAt >= 1) {
    // scrollPer가 0이면 다음페이지의 첫번째 row로 생성됨
    page += 1;
  }

  if (!searchKeyword || (searchKeyword && !searchKeyword.trim().length)) {
    return;
  }

  // page가 넘어가야하는 경우 페이징 정보 변경
  const setPagination = instance.setPagination; // 페이징 정보 변경 메소드
  if (page !== pagination.current && !singlePage) {
    if (setPagination) {
      setPagination({
        ...pagination,
        current: page,
      });
    } else {
      pagination.current = page;
    }
  } else {
    requestAnimationFrame(() => {
      setActiveColAndHighlightCell(el, binding, vnode);
    });
  }

  el.targetDataKey = `${targetRowCol.row}_${targetRowCol.col}`;
  el.targetIdx = targetIdx + 1;

  instance.$nextTick(() => {});
};

// 검색 결과에서 targetIndex에 해당하는 데이터의 키를 찾는 함수 [row_columnIdx 형식 : (예)2097_2]
const getCombinedValue = (
  data: IFilteredDataIndex[],
  targetIndex: number
): IRowCol => {
  let currentIndex = 0;

  for (const item of data) {
    for (const col of item.matchedCellCols) {
      if (currentIndex === targetIndex) {
        return {
          row: item.rowIndex,
          col: col,
        };
      }
      currentIndex++;
    }
  }

  // 매칭된 CombinedValue가 없을 때
  return {
    row: 0,
    col: 0,
  };
};

// 하이라이팅 전 || esc(검색 종료) 누를 시 셀 컬러 비우기
const clearCellColor = (el: AntdvTableDOM) => {
  const cells = el.querySelectorAll("td.ant-table-cell");
  cells.forEach((cell) => {
    // 기존 mark 태그 제거
    (cell as HTMLElement).style.backgroundColor = "";
    cell.removeAttribute("data-searched-idx");
  });
};

export function setLoading(el: AntdvTableDOM, onFlag: boolean) {
  const loading = el.querySelector(
    ".antdv-table-vbrowse-loading"
  ) as HTMLElement;
  loading!.style.display = onFlag ? "inline-block" : "none";
}

const getPositionStyle = (
  binding: AntdvTableVbrowseBinding
): Record<string, string> => {
  const position: Position = validatePosition(binding.value.position);
  const [horizontal, vertical] = position.split(" ") as [string, string];
  const style: Record<string, string> = {};

  style.zIndex = "1"; // 초기값은 absolute이므로 1

  if (horizontal === "left") {
    style.left = CONFIG_STYLE.POS_X;
  } else if (horizontal === "right") {
    style.right = CONFIG_STYLE.POS_X;
  } else if (horizontal === "center") {
    style.left = "50%";
    style.transform = "translateX(-50%)";
  }

  if (vertical === "top") {
    style.top = CONFIG_STYLE.POS_Y;
  } else if (vertical === "bottom") {
    style.bottom = CONFIG_STYLE.POS_Y;
  }

  return style;
};

export const getPallete = (binding: AntdvTableVbrowseBinding) => {
  return {
    backgroundColor: binding.value.searchAreaBgColor || "#333",
    color: binding.value.searchAreaFontColor || "#fff",
  };
};

// position 유효성 체크 (유효하지 않으면 left bottom)
export const validatePosition = (
  position = CONFIG_STYLE.POSITION
): Position => {
  const validHorizontal = new Set(["left", "right", "center"]);
  const validVertical = new Set(["top", "bottom"]);

  const parts = position.split(" ");

  if (parts.length !== 2) {
    return CONFIG_STYLE.POSITION;
  }

  const [horizontal, vertical] = parts;

  if (validHorizontal.has(horizontal) && validVertical.has(vertical)) {
    return position as Position;
  }

  return CONFIG_STYLE.POSITION;
};

export const initializeElement = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding
) => {
  el.position = validatePosition(binding.value.position);
  el.targetIdx = 0;
  el.isOpened = binding.value.defaultOpen ?? false;
};

export const validateColumns = (columns: any[]) => {
  if (!columns) {
    console.error("columns is required");
    return false;
  }
  return true;
};

export const setActiveColumns = (el: AntdvTableDOM, columns: any[]) => {
  const activeColumns: Array<string> = [];
  columns.forEach((column) => {
    if (column.dataIndex) activeColumns.push(column.dataIndex);
  });
  el.activeCol = activeColumns;
};

export const createSearchArea = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode
) => {
  const searchAreaElement = createSearchAreaVNode(el, binding, vnode);
  el.appendChild(searchAreaElement);
};

const createSearchAreaVNode = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode
) => {
  const movable = binding.value.movable ?? true;
  let hideHandleTimeoutId: number | null = null;

  const searchArea = h(
    "div",
    {
      class: "antdv-table-vbrowse-search-area",
      style: getPositionStyle(binding),
      onMouseenter: () => {
        if (hideHandleTimeoutId !== null) {
          clearTimeout(hideHandleTimeoutId);
          hideHandleTimeoutId = null;
        }
        el.classList.add("show-move-handle");
      },
      onMouseleave: () => {
        hideHandleTimeoutId = window.setTimeout(() => {
          el.classList.remove("show-move-handle");
          hideHandleTimeoutId = null;
        }, 2000);
      },
    },
    h("div", { class: "shaker", style: getPallete(binding) }, [
      createSearchButton(el, binding, vnode),
      h("div", { class: "antdv-table-vbrowse-open-target" }, [
        createSearchInput(el, binding, vnode),
        createDivider(),
        createSearchInfo(),
        createUpButton(el, binding, vnode),
        createDownButton(el, binding, vnode),
        createCloseButton(el),
        // createLoadingIcon(),
      ]),
    ])
  );

  const container = document.createElement("div");
  render(searchArea, container);
  const searchAreaElement = container.firstChild as HTMLElement;

  // Create move handle and append to the search area
  if (movable) {
    const moveHandle = createMoveHandle(el, searchAreaElement);
    const fixedHandle = createFixedToggle(el, binding, searchAreaElement);
    searchAreaElement.appendChild(moveHandle);
    searchAreaElement.appendChild(fixedHandle);
  }

  return searchAreaElement;
};

const createSearchButton = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode
) => {
  return h(
    "button",
    {
      class: "antdv-table-vsearch-btn-search",
      onClick: () => openSearch(el, binding, vnode),
      // onMouseenter: () => {
      //   el.classList.add('focused');
      // },
      // onMouseleave: () => {
      //   el.classList.remove('focused');
      // },
    },
    h(SearchOutlined)
  );
};

const createSearchInput = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode
) => {
  return h("input", {
    lazy: false,
    placeholder: binding.value.placeholder || CONFIG_MSG.PLACEHOLDER,
    class: "antdv-table-vbrowse-input",
    style: getPallete(binding),
    onInput: (e) => handleKeywordChange(e, el, binding, vnode),
    onKeydown: (e) => {
      if ((e as KeyboardEvent).keyCode == 13) goNext(el, binding, vnode);
    },
  });
};

const createDivider = () => {
  return h("span", { class: "antdv-table-vbrowse-divider" });
};

const createSearchInfo = () => {
  return h(
    "span",
    {
      class: "antdv-table-vbrowse-search-info",
      style: { color: "#fff", fontSize: "12px" },
    },
    ""
  );
};

const createUpButton = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode
) => {
  return h(
    "button",
    {
      class: "antdv-table-vsearch-btn-control",
      onClick: () => handleUpButtonClick(el, binding, vnode),
    },
    h(UpCircleOutlined)
  );
};

const createCloseButton = (el: AntdvTableDOM) => {
  return h(
    "button",
    {
      class: "antdv-table-vsearch-btn-control",
      onClick: () => closeSearch(el),
    },
    h(CloseOutlined)
  );
};

// create loading icon
const createLoadingIcon = () => {
  return h(LoadingOutlined, {
    class: "antdv-table-vbrowse-loading",
    style: { color: "#009fff" },
  });
};

// create move handle
const createMoveHandle = (el: AntdvTableDOM, searchArea: HTMLElement) => {
  const moveHandle = document.createElement("span");
  render(h(HolderOutlined), moveHandle);
  moveHandle.className = "antdv-table-vbrowse-move-handle";
  moveHandle.style.cursor = "move";
  moveHandle.style.userSelect = "none";
  moveHandle.style.touchAction = "none"; // 터치 동작 방지
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const downEvent = isTouchDevice ? "touchstart" : "mousedown";
  const moveEvent = isTouchDevice ? "touchmove" : "mousemove";
  const upEvent = isTouchDevice ? "touchend" : "mouseup";

  let isDragging = false;
  let startX: number, startY: number;

  const onDown = (e: Event) => {
    e.stopPropagation();
    isDragging = false;
    searchArea.style.transitionDuration = "unset";

    const event = (e as TouchEvent).touches
      ? (e as TouchEvent).touches[0]
      : (e as MouseEvent);

    startX = event.clientX - searchArea.offsetLeft;
    startY = event.clientY - searchArea.offsetTop;

    document.addEventListener(moveEvent, onMove);
    document.addEventListener(upEvent, onUp);
  };

  const onMove = (e: Event) => {
    e.stopPropagation();

    const event = (e as TouchEvent).touches
      ? (e as TouchEvent).touches[0]
      : (e as MouseEvent);

    const moveX = event.clientX - startX;
    const moveY = event.clientY - startY;

    if (Math.abs(moveX) > 5 || Math.abs(moveY) > 5) {
      isDragging = true;
    }

    if (!isDragging) return;

    let newX = event.clientX - startX;
    let newY = event.clientY - startY;

    // 테이블 영역 내로 제한
    const movableRect = el.fixed
      ? document.body.getBoundingClientRect()
      : el.getBoundingClientRect();
    const searchRect = searchArea.getBoundingClientRect();

    newX = Math.max(0, Math.min(newX, movableRect.width - searchRect.width));
    newY = Math.max(0, Math.min(newY, movableRect.height - searchRect.height));

    searchArea.style.left = `${newX}px`;
    searchArea.style.top = `${newY}px`;
    searchArea.style.bottom = "";
    searchArea.style.right = "";
  };

  const onUp = (e: Event) => {
    searchArea.style.transitionDuration = "0.3s";
    e.stopPropagation();
    document.removeEventListener(moveEvent, onMove);
    document.removeEventListener(upEvent, onUp);

    const event = (e as TouchEvent).changedTouches
      ? (e as TouchEvent).changedTouches[0]
      : (e as MouseEvent);

    const endX = event.clientX;
    const endY = event.clientY;

    const moveX = endX - (startX + searchArea.offsetLeft);
    const moveY = endY - (startY + searchArea.offsetTop);

    const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);

    if (!isDragging && moveDistance < 5) {
      const clickEvent = new Event("click");
      (e.target as HTMLElement).dispatchEvent(clickEvent);
    }

    // 화면 밖으로 나가지 않도록 위치 조정
    const movableRect = el.fixed
      ? document.body.getBoundingClientRect()
      : el.getBoundingClientRect();
    const searchRect = searchArea.getBoundingClientRect();

    const tableCenterX = movableRect.left + movableRect.width / 2;
    const searchCenterX = searchRect.left + searchRect.width / 2;

    if (searchCenterX < tableCenterX) {
      searchArea.style.left = `${searchRect.left - movableRect.left}px`;
      searchArea.style.right = "";
    } else {
      searchArea.style.left = "";
      searchArea.style.right = `${movableRect.right - searchRect.right}px`;
    }

    isDragging = false;
  };

  moveHandle.addEventListener(downEvent, onDown);

  // Clean up function
  el._cleanupDrag = () => {
    moveHandle.removeEventListener(downEvent, onDown);
    document.removeEventListener(moveEvent, onMove);
    document.removeEventListener(upEvent, onUp);
  };

  return moveHandle;
};

const createFixedToggle = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  searchArea: HTMLElement
) => {
  // Create fixed toggle button
  const toggleLabelWrap = document.createElement("label");
  const toggleStatusIcon = document.createElement("span");

  render(h(PushpinOutlined), toggleStatusIcon);

  toggleLabelWrap.className = "antdv-table-vbrowse-fixed-toggle";

  const fixedToggle = document.createElement("input");
  fixedToggle.type = "checkbox";
  render(h(PushpinOutlined), fixedToggle);

  // fixedToggle의 checked 상태에 따라 searchArea의 position 변경
  fixedToggle.addEventListener("change", () => {
    const searchAreaRect = searchArea.getBoundingClientRect();
    el.fixed = fixedToggle.checked;
    searchArea.style.transitionDuration = "unset";

    toggleStatusIcon.innerHTML = "";
    if (fixedToggle.checked) {
      searchArea.style.position = "fixed";
      searchArea.style.zIndex = binding.value.zIndex?.toString() ?? "999";
      searchArea.style.right = "";
      searchArea.style.bottom = "";
      searchArea.style.top = `${searchAreaRect.top}px`;
      searchArea.style.left = `${searchAreaRect.left}px`;
      render(h(PushpinFilled), toggleStatusIcon);
    } else {
      searchArea.style.position = "absolute";
      const defaultPosition = getPositionStyle(binding);
      searchArea.style.zIndex = "1";
      searchArea.style.left = defaultPosition.left || "";
      searchArea.style.right = defaultPosition.right || "";
      searchArea.style.top = defaultPosition.top || "";
      searchArea.style.bottom = defaultPosition.bottom || "";
      render(h(PushpinOutlined), toggleStatusIcon);
    }
  });

  toggleLabelWrap.appendChild(fixedToggle);
  toggleLabelWrap.appendChild(toggleStatusIcon);

  return toggleLabelWrap;
};

// up button click event handler
const handleUpButtonClick = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode
) => {
  if (el.targetIdx !== 1) {
    el.targetIdx -= 2;
    goNext(el, binding, vnode);
  } else {
    const isLoop = binding.value.loop || false;
    if (isLoop) {
      el.targetIdx = el.totalMatches - 1;
      goNext(el, binding, vnode);
    } else {
      doShake(el);
    }
  }
};

// down button click event handler
const createDownButton = (
  el: AntdvTableDOM,
  binding: AntdvTableVbrowseBinding,
  vnode: IAntdvTableVNode
) => {
  return h(
    "button",
    {
      class: "antdv-table-vsearch-btn-control",
      onClick: () => goNext(el, binding, vnode),
    },
    h(DownCircleOutlined)
  );
};

// bind keyboard event for open and close
export const addGlobalKeyboardListener = (el: AntdvTableDOM) => {
  const keydownHandler = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeSearch(el);
    }
  };

  document.addEventListener("keydown", keydownHandler);

  el._cleanup = () => {
    document.removeEventListener("keydown", keydownHandler);
  };
};
