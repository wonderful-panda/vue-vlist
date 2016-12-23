import * as tc from "vue-typed-component";
import * as types from "./types";

declare namespace VueVtable {
    export type VtableColumn<T> = types.VtableColumn<T>;
    export type VtableProps<T> = types.VtableProps<T>;
    export type VtableEvents<T> = types.VtableEvents<T>;
    export type VlistProps<T> = types.VlistProps<T>;
    export type VlistEvents<T> = types.VlistEvents<T>;
    export var Vlist: <T>() => tc.EvTypedComponent<VlistProps<T>, VlistEvents<T>>;
    export var Vtable: <T>() => tc.EvTypedComponent<VtableProps<T>, VtableEvents<T>>;
}

export = VueVtable;
