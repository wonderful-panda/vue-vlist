import Vue from "vue";
import { CssProperties } from "vue-css-definition";
import * as t from "../types";
import * as resizeSensor from "vue-resizesensor";
import * as tc from "vue-typed-component";
import { props as p } from "vue-typed-component";
import * as tsx from "vue-tsx-support";
import { px } from "./utils";

const ResizeSensor = tsx.ofType<{ debounce?: number }, { onResized: void }>().convert(resizeSensor);

export interface VlistData {
    scrollLeft: number;
    scrollTop: number;
    bodyWidth: number;
    bodyHeight: number;
    vScrollBarWidth: number;
    hScrollBarHeight: number;
}

@tc.component<t.VlistProps<T>>({
    props: {
        items: p.Arr.Required,
        getItemKey: p.Func.Required,
        contentWidth: p.ofType([Number, String]),
        rowHeight: p.Num.Required.$positive(),
        rowStyleCycle: p.Num.Default(1).$positive()
    },
    watch: {
        contentWidth: "onContentWidthChanged",
        contentHeight: "onContentHeightChanged"
    }
})
export class Vlist<T> extends tc.StatefulEvTypedComponent<
    t.VlistProps<T>,
    t.VlistEvents<T>,
    VlistData,
    t.VlistEventsOn<T>,
    { row: t.VlistSlotRowProps<T> }
> {
    $refs: { scrollable: Element; content: Element };

    data(): VlistData {
        return {
            scrollLeft: 0,
            scrollTop: 0,
            bodyWidth: 0,
            bodyHeight: 0,
            vScrollBarWidth: 0,
            hScrollBarHeight: 0
        };
    }

    /* styles */
    private get containerStyle(): CssProperties {
        return {
            display: "flex",
            flexFlow: "column nowrap",
            overflow: "hidden"
        };
    }
    private get headerStyle(): CssProperties {
        return {
            display: "flex",
            flex: "0 0 auto",
            boxSizing: "border-box",
            minWidth: px(this.$props.contentWidth),
            position: "relative",
            left: px(this.$data.scrollLeft * -1),
            overflow: "hidden",
            padding: `0 ${px(this.$data.vScrollBarWidth)} 0 0`
        };
    }
    private get scrollableStyle(): CssProperties {
        return {
            overflow: "auto",
            position: "relative",
            flex: "1 1 0px",
            boxSizing: "border-box",
            margin: 0,
            padding: 0,
            border: 0
        };
    }
    private get contentStyle(): CssProperties {
        return {
            display: "flex",
            flexFlow: "column nowrap",
            flex: "1 1 auto",
            position: "relative",
            boxSizing: "border-box",
            height: px(this.contentHeight),
            overflow: "hidden",
            minWidth: px(this.$props.contentWidth)
        };
    }
    private get spacerStyle(): CssProperties {
        return {
            height: px(this.$props.rowHeight * this.firstIndex),
            flex: "0 0 auto"
        };
    }
    private get rowStyle(): CssProperties {
        return {
            display: "flex",
            width: "100%",
            height: px(this.$props.rowHeight)
        };
    }

    /* computed */
    private get firstIndex() {
        let value = Math.floor(this.$data.scrollTop / this.$props.rowHeight);
        const { rowStyleCycle } = this.$props;
        if (rowStyleCycle && rowStyleCycle > 1) {
            value -= value % rowStyleCycle;
        }
        return value;
    }
    private get lastIndex() {
        const { scrollTop, bodyHeight } = this.$data;
        return Math.ceil((scrollTop + bodyHeight) / this.$props.rowHeight);
    }
    private get renderedItems() {
        return this.$props.items.slice(this.firstIndex, this.lastIndex + 1);
    }
    private get contentHeight() {
        return this.$props.rowHeight * this.$props.items.length;
    }

    /* methods */
    updateBodySize() {
        const sc = this.$refs.scrollable;
        const bound = sc.getBoundingClientRect();
        const bodyWidth = sc.clientWidth;
        const bodyHeight = sc.clientHeight;
        const vScrollBarWidth = Math.floor(bound.width - bodyWidth);
        const hScrollBarHeight = Math.floor(bound.height - bodyHeight);
        const data = this.$data;
        if (
            data.bodyWidth !== bodyWidth ||
            data.bodyHeight !== bodyHeight ||
            data.vScrollBarWidth !== vScrollBarWidth ||
            data.hScrollBarHeight !== hScrollBarHeight
        ) {
            data.bodyWidth = bodyWidth;
            data.bodyHeight = bodyHeight;
            data.vScrollBarWidth = vScrollBarWidth;
            data.hScrollBarHeight = hScrollBarHeight;
        }
    }
    onScroll(event: Event) {
        const { scrollLeft, scrollTop } = this.$refs.scrollable;
        this.$data.scrollLeft = scrollLeft;
        this.$data.scrollTop = scrollTop;
        this.$events.emit("scroll", { scrollLeft, scrollTop, event });
    }
    onRowEvent(eventName: string, item: T, physicalIndex: number, event: Event) {
        this.$events.emit(("row" + eventName) as any, {
            item,
            index: physicalIndex + this.firstIndex,
            event
        });
    }
    onContentHeightChanged(newValue: number, oldValue: number) {
        const hScrollBarHeight = this.$data.hScrollBarHeight;
        const height = this.$data.bodyHeight + hScrollBarHeight;
        if (0 < hScrollBarHeight === newValue < height) {
            // must re-check scrollbar visibilities
            this.updateBodySize();
        }
    }

    onContentWidthChanged(newValue: number, oldValue: number) {
        const vScrollBarWidth = this.$data.vScrollBarWidth;
        const width = this.$data.bodyWidth + vScrollBarWidth;
        if (0 < vScrollBarWidth === newValue < width) {
            // must re-check scrollbar visibilities
            this.updateBodySize();
        }
    }

    /* render */
    private get rows() {
        const p = this.$props;
        const row = this.$scopedSlots.row;
        return this.renderedItems.map((item, index) => (
            <div
                staticClass="vlist-row"
                key={p.getItemKey(item)}
                style={this.rowStyle}
                onClick={e => this.onRowEvent("click", item, index, e)}
                onDblclick={e => this.onRowEvent("dblclick", item, index, e)}
                onDragenter={e => this.onRowEvent("dragenter", item, index, e)}
                onDragleave={e => this.onRowEvent("dragleave", item, index, e)}
                onDragstart={e => this.onRowEvent("dragstart", item, index, e)}
                onDragend={e => this.onRowEvent("dragend", item, index, e)}
                onDragover={e => this.onRowEvent("dragover", item, index, e)}
                onDrop={e => this.onRowEvent("drop", item, index, e)}
            >
                {row({ item, index: index + this.firstIndex })}
            </div>
        ));
    }

    render(): Vue.VNode {
        return (
            <div staticClass="vlist-container" style={this.containerStyle}>
                <div staticClass="vlist-header-row" style={this.headerStyle}>
                    {this.$slots.header}
                </div>
                <div
                    staticClass="vlist-scrollable"
                    ref="scrollable"
                    style={this.scrollableStyle}
                    onScroll={this.onScroll}
                >
                    <ResizeSensor debounce={50} onResized={this.updateBodySize} />
                    <div staticClass="vlist-content" ref="content" style={this.contentStyle}>
                        <div staticClass="vlist-spacer" style={this.spacerStyle} />
                        {this.rows}
                    </div>
                </div>
            </div>
        );
    }
}
