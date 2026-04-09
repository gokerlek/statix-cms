import { union } from "prosekit/core";
import { defineBasicExtension } from "prosekit/basic";
import { defineTextAlign } from "prosekit/extensions/text-align";

import { defineFontSize } from "../extensions/FontSize";

export function defineEditorExtension() {
  return union(
    defineBasicExtension(),
    defineTextAlign({ types: ["paragraph", "heading"] }),
    defineFontSize(),
  );
}
