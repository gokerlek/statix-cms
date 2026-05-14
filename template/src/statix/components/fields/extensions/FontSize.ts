import { defineCommands, defineMarkSpec, union } from "prosekit/core";
import type { Mark } from "prosekit/pm/model";
import type { EditorState, Transaction } from "prosekit/pm/state";

type Dispatch = (tr: Transaction) => void;
type Command = (state: EditorState, dispatch?: Dispatch) => boolean;

const fontSizeMarkSpec = defineMarkSpec({
  name: "fontSize",
  attrs: { size: { default: null } },
  parseDOM: [
    {
      style: "font-size",
      getAttrs: (value: string | Node) => {
        return typeof value === "string" && value ? { size: value } : false;
      },
    },
  ],
  toDOM: (mark: Mark) => {
    return ["span", { style: `font-size: ${mark.attrs.size}` }, 0];
  },
});

const fontSizeCommands = defineCommands({
  setFontSize:
    (size: string): Command =>
    (state, dispatch) => {
      const markType = state.schema.marks["fontSize"];
      if (!markType) return false;
      const { from, to } = state.selection;
      const tr = state.tr.addMark(from, to, markType.create({ size }));
      dispatch?.(tr);
      return true;
    },
  unsetFontSize:
    (): Command =>
    (state, dispatch) => {
      const markType = state.schema.marks["fontSize"];
      if (!markType) return false;
      const { from, to } = state.selection;
      const tr = state.tr.removeMark(from, to, markType);
      dispatch?.(tr);
      return true;
    },
});

export function defineFontSize() {
  return union(fontSizeMarkSpec, fontSizeCommands);
}
