import { union } from "prosekit/core";
import { defineBasicExtension } from "prosekit/basic";
import { defineDropCursor } from "prosekit/extensions/drop-cursor";
import { defineTextAlign } from "prosekit/extensions/text-align";

import { defineFontSize } from "../extensions/FontSize";

export function defineEditorExtension() {
  return union(
    defineBasicExtension(),
    defineDropCursor(),
    defineTextAlign({ types: ["paragraph", "heading"] }),
    defineFontSize(),
  );
}
