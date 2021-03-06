import Vue, { VNode } from "vue";
import { Component, Prop } from "vue-property-decorator";
import { CssProperties } from "vue-css-definition";
import {
  GetClassFunction,
  GetKeyFunction,
  SliceFunction,
  VtableColumn,
  VtableSlotCellProps,
  VlistEvents,
  VlistEventsOn
} from "../types";
import { px } from "./utils";
import { Vlist } from "./vlist";
import { VtableRow } from "./vtablerow";
import { VtableSplitter } from "./vtablesplitter";
import {
  InnerScopedSlots,
  DeclareProps,
  DeclareOn,
  DeclareOnEvents,
  AutoProps
} from "vue-tsx-support";
import { DeclareAutoProps } from "./tsx-util";

@Component
export class VtableBase<T> extends Vue {
  $refs!: { header: Element; vlist: Vlist<T> };
  $scopedSlots!: InnerScopedSlots<{ cell: VtableSlotCellProps<T> }>;
  _tsx!: DeclareAutoProps<VtableBase<T>, Vue, "ensureVisible"> &
    DeclareOn<VlistEvents<T>> &
    DeclareOnEvents<VlistEventsOn<T>>;

  @Prop(Number) rowHeight!: number;
  @Prop(Number) headerHeight!: number;
  @Prop(Array) columns!: ReadonlyArray<VtableColumn>;
  @Prop(Number) itemCount!: number;
  @Prop(Function) sliceItems!: SliceFunction<T>;
  @Prop(Number) rowStyleCycle?: number;
  @Prop(Number) splitterWidth?: number;
  @Prop(String) rowClass?: string;
  @Prop(Function) getRowClass?: GetClassFunction<T>;
  @Prop(Function) getItemKey!: GetKeyFunction<T>;
  @Prop(Object) widths?: Record<string, number>;
  @Prop(Number) overscan?: number;

  private widthsPrivate: Record<string, number> = {};
  private draggingSplitter = -1;

  /* style */
  private get headerStyle(): CssProperties {
    return {
      display: "flex",
      position: "relative",
      flex: "1 1 auto",
      width: "100%",
      height: px(this.actualHeaderHeight),
      lineHeight: px(this.actualHeaderHeight),
      boxSizing: "border-box",
      margin: "0",
      whiteSpace: "none"
    };
  }

  private headerCellStyle(width: number): CssProperties {
    return {
      minWidth: px(width),
      width: px(width),
      lineHeight: px(this.actualHeaderHeight),
      boxSizing: "border-box",
      margin: "0",
      overflow: "hidden"
    };
  }

  private actualRowClass(item: T, index: number) {
    const { getRowClass, rowClass } = this;
    if (getRowClass) {
      return getRowClass(item, index);
    } else {
      return rowClass || "vtable-row";
    }
  }

  private get actualSplitterWidth() {
    return this.splitterWidth || 3;
  }

  private get actualHeaderHeight(): number {
    const { headerHeight, rowHeight } = this;
    return headerHeight && headerHeight > 0 ? headerHeight : rowHeight;
  }

  private get actualWidths(): Record<string, number> {
    return this.widths || this.widthsPrivate;
  }

  private get contentWidth(): number {
    const widths = this.actualWidths;
    let sum = 0;
    for (const c of this.columns) {
      sum += (widths[c.id] || c.defaultWidth) + (this.splitterWidth || 3);
    }
    return sum;
  }

  /* methods */
  ensureVisible(index: number) {
    this.$refs.vlist.ensureVisible(index);
  }

  private setColumnWidth(c: VtableColumn, width: number): void {
    if (this.widths) {
      const newWidths = { ...this.widths, [c.id]: width };
      this.$emit("update:widths", newWidths);
    } else {
      this.widthsPrivate = { ...this.widthsPrivate, [c.id]: width };
    }
  }

  private onSplitterMouseDown(index: number, clientX: number) {
    const headerCell = this.$refs.header.querySelectorAll(
      "div.vtable-header-cell"
    )[index];
    const column = this.columns[index];
    const startWidth = headerCell.clientWidth;
    const startX = clientX;
    const minWidth = column.minWidth || 5;
    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const offset = e.clientX - startX;
      const width = Math.max(startWidth + offset, minWidth);
      this.setColumnWidth(column, width);
      this.draggingSplitter = index;
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      this.draggingSplitter = -1;
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    this.draggingSplitter = index;
  }

  /* render */
  private splitter(index: number) {
    return (
      <VtableSplitter
        key={`splitter-${index}`}
        dragging={index === this.draggingSplitter}
        width={this.actualSplitterWidth}
        mousedownCallback={clientX => this.onSplitterMouseDown(index, clientX)}
      />
    );
  }

  private get headerCells() {
    const widths = this.actualWidths;
    return this.columns.map((c, index) => [
      <div
        staticClass="vtable-header-cell"
        class={c.className}
        key={`cell-${c.id}`}
        style={this.headerCellStyle(widths[c.id] || c.defaultWidth)}
      >
        {c.title === undefined ? c.id : c.title}
      </div>,
      this.splitter(index)
    ]);
  }

  render(): VNode {
    const VlistT = Vlist as new () => Vlist<T>;
    const VtableRowT = VtableRow as new () => VtableRow<T>;
    const {
      rowHeight,
      itemCount,
      sliceItems,
      rowStyleCycle,
      getItemKey,
      columns,
      overscan
    } = this;
    return (
      <VlistT
        ref="vlist"
        style={{ flex: "1 1 auto" }}
        rowHeight={rowHeight}
        itemCount={itemCount}
        sliceItems={sliceItems}
        rowStyleCycle={rowStyleCycle}
        contentWidth={this.contentWidth}
        getItemKey={getItemKey}
        overscan={overscan}
        scopedSlots={{
          row: ({ item, index }) => (
            <VtableRowT
              class={this.actualRowClass(item, index)}
              columns={columns}
              columnWidths={this.actualWidths}
              item={item}
              index={index}
              height={rowHeight}
              scopedSlots={{
                splitter: ({ index: i }) => this.splitter(i),
                cell: this.$scopedSlots.cell
              }}
            />
          )
        }}
        on={this.$listeners}
      >
        <div
          staticClass="vtable-header"
          slot="header"
          ref="header"
          style={this.headerStyle}
        >
          {this.headerCells}
        </div>
      </VlistT>
    );
  }
}
