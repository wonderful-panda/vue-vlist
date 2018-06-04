import Vue, { VNode, VNodeChildrenArrayContents } from "vue";
import { CssProperties } from "vue-css-definition";
import p from "vue-strict-prop";
import * as tsx from "vue-tsx-support";
import * as tc from "vue-typed-component";
import {
    GetClassFunction,
    GetKeyFunction,
    TreeNode,
    TreeNodeWithState,
    VtableColumn,
    VtableEvents,
    VtableEventsOn,
    VtableSlotCellProps,
    VtreeProps
} from "../types";
import { px } from "./utils";
import { VtableBase, VtableBaseProps } from "./vtablebase";

const m = tsx.modifiers;
export interface VtreeTableData {
    expandMap: { [key: string]: boolean };
}

const ExpandButton = tsx.component(
    {
        name: "ExpandButton",
        functional: true,
        props: {
            expanded: p(Boolean).required,
            size: p(Number).required
        },
        render(_h, { props }): VNode {
            const { expanded, size } = props;
            const transform = `rotate(${expanded ? 90 : 0}deg)`;
            const transition = "0.1s transform ease";
            const style = { transform, transition };
            return (
                <svg class="vtreetable-button" width={size} height={size} style={style}>
                    <polygon
                        transform={`translate(${size / 2}, ${size / 2})`}
                        points="-1,-4 3,0 -1,4"
                    />
                </svg>
            );
        }
    },
    ["expanded", "size"]
);
const TreeHeadCell = tsx.component(
    {
        name: "TreeHeadCell",
        functional: true,
        props: {
            level: p(Number).required,
            indentWidth: p(Number).required,
            expanded: p(Boolean).required,
            hasChildren: p(Boolean).required,
            toggleExpand: p.ofFunction<() => void>().required
        },
        render(_h, { props, children }) {
            const { level, expanded, indentWidth, hasChildren, toggleExpand } = props;
            const indent = px(level * indentWidth);
            const expandButtonStyle: CssProperties = {
                marginLeft: indent,
                marginRight: "4px",
                marginTop: "auto",
                marginBottom: "auto",
                textAlign: "center",
                minWidth: "12px",
                cursor: "pointer"
            };

            return (
                <div style={{ display: "flex" }}>
                    <div style={expandButtonStyle} onClick={m.stop.prevent(toggleExpand)}>
                        {hasChildren ? (
                            <ExpandButton v-show={hasChildren} expanded={expanded} size={12} />
                        ) : (
                            undefined
                        )}
                    </div>
                    {children}
                </div>
            );
        }
    },
    ["level", "expanded", "indentWidth", "hasChildren", "toggleExpand"]
);

@tc.component(Vtreetable, {
    props: {
        rowHeight: p(Number).required,
        headerHeight: p(Number).optional,
        indentWidth: p(Number).optional,
        columns: p.ofRoArray<VtableColumn>().required,
        rootNodes: p.ofRoArray<TreeNode<T>>().required,
        rowStyleCycle: p(Number).default(1),
        splitterWidth: p(Number).default(3),
        rowClass: p(String).optional,
        getRowClass: p.ofFunction<GetClassFunction<TreeNodeWithState<T>>>().optional,
        widths: p.ofObject<{ [columnId: string]: number }>().optional,
        getItemKey: p.ofFunction<GetKeyFunction<T>>().required
    }
})
export class Vtreetable<T> extends tc.StatefulEvTypedComponent<
    VtreeProps<T>,
    VtableEvents<TreeNodeWithState<T>>,
    VtreeTableData,
    VtableEventsOn<TreeNodeWithState<T>>,
    { cell: VtableSlotCellProps<TreeNodeWithState<T>> }
> {
    data(): VtreeTableData {
        return {
            expandMap: {}
        };
    }
    get flattenVisibleItems(): ReadonlyArray<TreeNodeWithState<T>> {
        const ret = [] as Array<TreeNodeWithState<T>>;
        this.$props.rootNodes.forEach(root => this.addDescendentVisibleItems(root, 0, ret));
        return ret;
    }
    get itemCount(): number {
        return this.flattenVisibleItems.length;
    }
    get firstColumnId(): string {
        const firstColumn = this.$props.columns[0];
        return firstColumn ? firstColumn.id : "";
    }
    addDescendentVisibleItems(
        parent: TreeNode<T>,
        level: number,
        arr: Array<TreeNodeWithState<T>>
    ) {
        const key = this.$props.getItemKey(parent.data).toString();
        const expanded = !!this.$data.expandMap[key];
        arr.push({ ...parent, expanded, level });
        if (!expanded || !parent.children) {
            return;
        }
        for (const child of parent.children) {
            this.addDescendentVisibleItems(child, level + 1, arr);
        }
    }

    sliceItems(start: number, end: number): ReadonlyArray<TreeNodeWithState<T>> {
        return this.flattenVisibleItems.slice(start, end);
    }

    getItemKey_({ data }: TreeNodeWithState<T>): string | number {
        return this.$props.getItemKey(data);
    }

    toggleExpand(data: T) {
        const expandMap = this.$data.expandMap;
        const key = this.$props.getItemKey(data).toString();
        const newValue = !expandMap[key];
        if (newValue) {
            Vue.set(expandMap, key, true);
        } else {
            Vue.delete(expandMap, key);
        }
    }

    renderCell(
        props: VtableSlotCellProps<TreeNodeWithState<T>>
    ): string | VNodeChildrenArrayContents {
        const content = this.$scopedSlots.cell(props);
        const { level, data, expanded, children } = props.item;
        if (props.columnId === this.firstColumnId) {
            return [
                <TreeHeadCell
                    level={level}
                    expanded={expanded}
                    indentWidth={this.$props.indentWidth || this.$props.rowHeight}
                    hasChildren={(children || []).length > 0}
                    toggleExpand={() => this.toggleExpand(data)}
                >
                    {content}
                </TreeHeadCell>
            ];
        } else {
            return content;
        }
    }

    render(): VNode {
        const VtableBaseT = VtableBase as new () => VtableBase<TreeNodeWithState<T>>;
        const { rootNodes, indentWidth, ...others } = this.$props;
        const props: VtableBaseProps<TreeNodeWithState<T>> = {
            ...others,
            itemCount: this.itemCount,
            sliceItems: this.sliceItems,
            getItemKey: this.getItemKey_
        };
        return (
            <VtableBaseT
                {...{ props, on: this.$listeners }}
                scopedSlots={{ cell: cellprops => this.renderCell(cellprops) }}
            />
        );
    }
}