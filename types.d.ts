import * as Vue from "vue"
import { CssProperties } from "vue-css-definition";

type $createElement = typeof Vue.prototype.$createElement;

export interface VtableColumn<T> {
    title: string;
    defaultWidth: number;
    minWidth?: number;
    className?: string;
    render: (h: $createElement, item: T, index: number, ctx: any) => Vue.VNode|string;
}

export interface VtableListCtx<T> {
    ctx: any;
    columns: VtableColumn<T>[],
    getRowClass: (item: T, index: number) => string;
    widths: number[];
    splitterWidth: number;
    draggingSplitter: number;
    onSplitterMouseDown: (index: number, event: MouseEvent) => void;
}

export interface VtableProps<T> {
    rowHeight: number;
    headerHeight: number;
    columns: VtableColumn<T>[];
    items: T[];
    rowStyleCycle: number;
    splitterWidth: number;
    rowClass: string;
    getRowClass: (item: T, index: number) => string;
    ctx: any;
    getItemKey: (item: T) => number | string;
}

export interface VlistProps<T> {
    rowComponent: string | Vue;
    items: T[];
    getItemKey: (item: T) => number | string;
    contentWidth?: number | string;
    ctx?: any;
    rowHeight: number;
    rowStyleCycle?: number;
    style?: CssProperties;
}

export interface RowEventArgs<T, TEvent> {
    index: number;
    item: T;
    event: TEvent;
}

export type RowClickEventArgs<T> = RowEventArgs<T, MouseEvent>;
export type RowDragEventArgs<T> = RowEventArgs<T, DragEvent>;

export interface ScrollEventArgs {
    scrollLeft: number;
    scrollTop: number;
    event: Event;
}

export interface VlistEvents<T> {
    "row-click": RowClickEventArgs<T>;
    "row-dblclick": RowClickEventArgs<T>;
    "row-dragenter": RowDragEventArgs<T>;
    "row-dragleave": RowDragEventArgs<T>;
    "row-dragstart": RowDragEventArgs<T>;
    "row-dragend": RowDragEventArgs<T>;
    "row-dragover": RowDragEventArgs<T>;
    "row-drop": RowDragEventArgs<T>;
    "scroll": ScrollEventArgs;
}

export interface VtableEvents<T> {
    "row-click": RowClickEventArgs<T>;
    "row-dblclick": RowClickEventArgs<T>;
    "row-dragenter": RowDragEventArgs<T>;
    "row-dragleave": RowDragEventArgs<T>;
    "row-dragstart": RowDragEventArgs<T>;
    "row-dragend": RowDragEventArgs<T>;
    "row-dragover": RowDragEventArgs<T>;
    "row-drop": RowDragEventArgs<T>;
}
