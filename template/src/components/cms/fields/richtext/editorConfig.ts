import {
  defineBaseCommands,
  defineBaseKeymap,
  defineHistory,
  union,
} from "prosekit/core";
import { defineBlockquote } from "prosekit/extensions/blockquote";
import { defineBold } from "prosekit/extensions/bold";
import { defineDoc } from "prosekit/extensions/doc";
import { defineHardBreak } from "prosekit/extensions/hard-break";
import { defineItalic } from "prosekit/extensions/italic";
import { defineLink } from "prosekit/extensions/link";
import { defineList } from "prosekit/extensions/list";
import { defineParagraph } from "prosekit/extensions/paragraph";
import { defineText } from "prosekit/extensions/text";
import { defineTextAlign } from "prosekit/extensions/text-align";
import { defineUnderline } from "prosekit/extensions/underline";

import { defineFontSize } from "../extensions/FontSize";

export function defineEditorExtension() {
  return union(
    // Core nodes
    defineDoc(),
    defineText(),
    defineParagraph(),
    defineHardBreak(),
    // Marks
    defineBold(),
    defineItalic(),
    defineUnderline(),
    defineLink(),
    defineFontSize(),
    // Block nodes
    defineList(),
    defineBlockquote(),
    // Block attributes
    defineTextAlign({ types: ["paragraph"] }),
    // Editor features
    defineBaseKeymap(),
    defineBaseCommands(),
    defineHistory(),
  );
}
