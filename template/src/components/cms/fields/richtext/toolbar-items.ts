import { type ComponentType } from "react";

import {
  IconAlignCenter,
  IconAlignJustified,
  IconAlignLeft,
  IconAlignRight,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBlockquote,
  IconBold,
  IconBraces,
  IconCode,
  IconH1,
  IconH2,
  IconH3,
  IconItalic,
  IconList,
  IconListNumbers,
  IconMinus,
  IconStrikethrough,
  IconUnderline,
} from "@tabler/icons-react";

import ui from "@/content/ui.json";

export interface ToolbarItem {
  key: string;
  icon: ComponentType<{ size: number }>;
  title: string;
  action: (cmds: Record<string, ((...args: unknown[]) => void) | undefined>) => void;
  isActive?: (ctx: {
    markActive: (n: string) => boolean;
    nodeActive: (n: string, a?: Record<string, unknown>) => boolean;
  }) => boolean;
  variant?: "ghost";
}

const t = ui.richTextToolbar;

export const TOOLBAR_ITEMS: ToolbarItem[] = [
  { key: "undo", icon: IconArrowBackUp, title: t.undo, action: (c) => c.undo?.(), variant: "ghost" },
  { key: "redo", icon: IconArrowForwardUp, title: t.redo, action: (c) => c.redo?.(), variant: "ghost" },
  { key: "heading1", icon: IconH1, title: t.heading1, action: (c) => c.toggleHeading?.({ level: 1 }), isActive: (ctx) => ctx.nodeActive("heading", { level: 1 }) },
  { key: "heading2", icon: IconH2, title: t.heading2, action: (c) => c.toggleHeading?.({ level: 2 }), isActive: (ctx) => ctx.nodeActive("heading", { level: 2 }) },
  { key: "heading3", icon: IconH3, title: t.heading3, action: (c) => c.toggleHeading?.({ level: 3 }), isActive: (ctx) => ctx.nodeActive("heading", { level: 3 }) },
  { key: "bold", icon: IconBold, title: t.bold, action: (c) => c.toggleBold?.(), isActive: (ctx) => ctx.markActive("bold") },
  { key: "italic", icon: IconItalic, title: t.italic, action: (c) => c.toggleItalic?.(), isActive: (ctx) => ctx.markActive("italic") },
  { key: "underline", icon: IconUnderline, title: t.underline, action: (c) => c.toggleUnderline?.(), isActive: (ctx) => ctx.markActive("underline") },
  { key: "strike", icon: IconStrikethrough, title: t.strike, action: (c) => c.toggleStrike?.(), isActive: (ctx) => ctx.markActive("strike") },
  { key: "code", icon: IconCode, title: t.code, action: (c) => c.toggleCode?.(), isActive: (ctx) => ctx.markActive("code") },
  { key: "bulletList", icon: IconList, title: t.bulletList, action: (c) => c.toggleList?.({ kind: "bullet" }), variant: "ghost" },
  { key: "orderedList", icon: IconListNumbers, title: t.orderedList, action: (c) => c.toggleList?.({ kind: "ordered" }), variant: "ghost" },
  { key: "blockquote", icon: IconBlockquote, title: t.blockquote, action: (c) => c.toggleBlockquote?.(), variant: "ghost" },
  { key: "codeBlock", icon: IconBraces, title: t.codeBlock, action: (c) => c.insertCodeBlock?.({ language: "javascript" }), isActive: (ctx) => ctx.nodeActive("codeBlock") },
  { key: "horizontalRule", icon: IconMinus, title: t.horizontalRule, action: (c) => c.insertHorizontalRule?.(), variant: "ghost" },
];

export const ALIGN_ITEMS = [
  { align: "left" as const, Icon: IconAlignLeft },
  { align: "center" as const, Icon: IconAlignCenter },
  { align: "right" as const, Icon: IconAlignRight },
  { align: "justify" as const, Icon: IconAlignJustified },
];
