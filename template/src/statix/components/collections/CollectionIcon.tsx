"use client";

import { ElementType } from "react";

import {
  IconFile,
  IconFileText,
  IconFolder,
  IconHome,
  IconLayoutDashboard,
  IconMail,
  IconNews,
  IconPhoto,
  IconSettings,
  IconStar,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";

interface CollectionIconProps {
  /**
   * Either a known Tabler icon name (e.g. "Mail", "Users") or an inline
   * SVG path data string starting with the `M x,y` move command.
   */
  icon?: string;
  className?: string;
}

// Common Tabler icons available by name from `statix.config.ts`.
// Extend this map to expose more icons to user-authored config.
const IconMap: Record<string, ElementType> = {
  File: IconFile,
  FileText: IconFileText,
  Folder: IconFolder,
  Home: IconHome,
  Dashboard: IconLayoutDashboard,
  Mail: IconMail,
  News: IconNews,
  Photo: IconPhoto,
  Settings: IconSettings,
  Star: IconStar,
  User: IconUser,
  Users: IconUsers,
};

/**
 * Heuristic: a real SVG path data string looks like `M 10,10 L 20,20 …`
 * — the `M` (move-to) command is followed by whitespace, a digit, or
 * a sign. Plain icon names like "Mail" start with `M` too, so we need
 * to disambiguate; without this check the icon name was being rendered
 * as broken path data.
 */
const SVG_PATH_PATTERN = /^M[\s\d+\-.]/;

export function CollectionIcon({ icon, className }: CollectionIconProps) {
  if (!icon) return <IconFileText className={className} />;

  // Named icon wins over the SVG-path heuristic so names starting with
  // "M" (Mail, Menu, Map, …) resolve correctly.
  const Named = IconMap[icon];
  if (Named) return <Named className={className} />;

  if (SVG_PATH_PATTERN.test(icon)) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d={icon} />
      </svg>
    );
  }

  return <IconFileText className={className} />;
}
