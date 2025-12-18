import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";

import { FontSize } from "../extensions/FontSize";

export const getEditorExtensions = () => [
  StarterKit.configure({
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal pl-6",
      },
    },
    bulletList: {
      HTMLAttributes: {
        class: "list-disc pl-6",
      },
    },
  }),
  TextStyle,
  Underline,
  FontSize,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "text-blue-500 underline cursor-pointer",
    },
  }),
];
