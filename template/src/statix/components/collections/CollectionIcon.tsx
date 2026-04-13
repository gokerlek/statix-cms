"use client";

import { ElementType } from "react";

import { IconFileText, IconSettings, IconUsers } from "@tabler/icons-react";

interface CollectionIconProps {
  icon?: string;
  className?: string;
}

const IconMap: Record<string, ElementType> = {
  FileText: IconFileText,
  Users: IconUsers,
  Settings: IconSettings,
};

export function CollectionIcon({ icon, className }: CollectionIconProps) {
  if (!icon) return <IconFileText className={className} />;

  // Check if it's an SVG path
  if (icon.startsWith("M")) {
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

  const LucideIcon = IconMap[icon] || IconFileText;

  return <LucideIcon className={className} />;
}
