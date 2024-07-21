"use strict";

import { ComponentPublicInstance, ObjectDirective, type App } from "vue";
import "./index.css";
import {
  AntdvTableVbrowseOptions,
  AntdvTableVbrowseBinding,
  AntdvTableDOM,
} from "./types";
import {
  setActiveColAndHighlightCell,
  setLoading,
  initializeElement,
  validateColumns,
  setActiveColumns,
  createSearchArea,
  addGlobalKeyboardListener,
} from "./utils";

export const antdvTableVbrowse: ObjectDirective<
  AntdvTableDOM,
  AntdvTableVbrowseOptions
> = {
  /**
   * 디렉티브가 바인딩된 엘리먼트가 처음으로 부모 컴포넌트에 연결될 때 한 번만 호출
   * @param el
   * @param binding
   * @returns
   */
  created(el, binding: AntdvTableVbrowseBinding) {
    el.active = binding.value.active ?? true;
    if (!el.active) return;

    const instance: ComponentPublicInstance<any> = binding.instance;
    const columns = instance.getColumns();

    initializeElement(el, binding);
    validateColumns(columns);
    setActiveColumns(el, columns);
    createSearchArea(el, binding);
    addGlobalKeyboardListener(el);
  },
  beforeMount(el, binding: AntdvTableVbrowseBinding) {
    if (!el.active) return;
    const defaultOpen = binding.value.defaultOpen ?? false;
    // el에 클래스 추가
    el.classList.add("antdv-table-vbrowse");
    if (defaultOpen) {
      el.classList.add("antdv-table-vbrowse-opened");
    }
  },
  beforeUpdate(el) {
    if (!el.active) return;
    setLoading(el, true);
  },
  /**
   * 컴포넌트의 VNode가 업데이트될 때마다 호출
   * @param el
   * @param binding
   */
  updated(el, binding: AntdvTableVbrowseBinding) {
    if (!el.active) return;
    setActiveColAndHighlightCell(el, binding);
    setLoading(el, false);
  },
  /**
   * unmounted 훅은 컴포넌트의 VNode가 제거될 때 호출
   * @param el
   */
  unmounted(el) {
    // cleanup 실행
    if (el._cleanup) {
      // 전역 키보드 이벤트 리스너 제거
      el._cleanup();
    }
  },
};

export function setupVsearchDirective(app: App) {
  app.directive("antdv-table-vbrowse", antdvTableVbrowse);
}
