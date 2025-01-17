"use strict";

import { ComponentPublicInstance, ObjectDirective, type App } from "vue";
import "./index.css";
import {
  IAntdvTableVNode,
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
  updateMemoizedFunctions,
  memoizedGetColumns,
  memoizedGetDataSource,
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
  created(el, binding: AntdvTableVbrowseBinding, vnode: IAntdvTableVNode) {
    el.active = binding.value.active ?? true;
    if (!el.active) return;

    const instance: ComponentPublicInstance<any> = binding.instance;
    const columns =
      typeof instance.getColumns === "function"
        ? instance.getColumns()
        : vnode.ctx?.ctx?.columns;

    initializeElement(el, binding);
    validateColumns(columns);
    setActiveColumns(el, columns);
    createSearchArea(el, binding, vnode);
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
  },
  /**
   * 컴포넌트의 VNode가 업데이트될 때마다 호출
   * @param el
   * @param binding
   * @param vnode
   */
  updated(el, binding: AntdvTableVbrowseBinding, vnode: IAntdvTableVNode) {
    if (!el.active) return;
    setActiveColAndHighlightCell(el, binding, vnode);
    updateMemoizedFunctions(binding.instance, vnode);

    const instance: ComponentPublicInstance<any> = binding.instance;
    const newColumns =
      instance.getColumns === "function"
        ? instance.getColumns()
        : vnode.ctx?.ctx?.columns;
    const newDataSource =
      typeof instance.getDataSource === "function"
        ? instance.getDataSource()
        : vnode.ctx?.ctx?.dataSource;

    if (
      JSON.stringify(newColumns) !==
        JSON.stringify(memoizedGetColumns(instance, vnode)) ||
      JSON.stringify(newDataSource) !==
        JSON.stringify(memoizedGetDataSource(instance, vnode))
    ) {
      updateMemoizedFunctions(instance, vnode);
    }
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
