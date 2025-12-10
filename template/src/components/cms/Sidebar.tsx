"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Trash2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ui from "@/content/ui.json";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { statixConfig } from "@/statix.config";

import { SignOutButton } from "./SignOutButton";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onSignOut: () => Promise<void>;
}

const navItems = [
  {
    label: "Dashboard",
    href: ROUTES.ADMIN.ROOT,
    icon: LayoutDashboard,
  },
];

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground h-screen flex flex-col py-6 px-2 border-r border-sidebar-border">
      <div className="mb-8 px-4">
        <Image
          src="/logo-label.svg"
          alt="Logo"
          width={136}
          height={33}
          priority
        />
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        <div className="mb-4">
          <small className="text-muted-foreground uppercase tracking-wider px-4 block mb-2">
            {ui.sidebar.menu}
          </small>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                pathname === item.href
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />

              {ui.sidebar.dashboard}
            </Link>
          ))}
        </div>

        <div className="pt-4 pb-2">
          <small className="text-muted-foreground uppercase tracking-wider px-4 block mb-2">
            {ui.sidebar.collections}
          </small>
        </div>

        {statixConfig.collections
          .filter((c) => c.type !== "singleton")
          .map((collection) => (
            <Link
              key={collection.slug}
              href={ROUTES.ADMIN.COLLECTION(collection.slug)}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                pathname.startsWith(ROUTES.ADMIN.COLLECTION(collection.slug))
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <FileText className="mr-3 h-5 w-5" />

              {collection.label}
            </Link>
          ))}

        {statixConfig.collections.some((c) => c.type === "singleton") && (
          <>
            <div className="pt-4 pb-2">
              <small className="text-muted-foreground uppercase tracking-wider px-4 block mb-2">
                {ui.sidebar.singletons}
              </small>
            </div>

            {statixConfig.collections
              .filter((c) => c.type === "singleton")
              .map((collection) => (
                <Link
                  key={collection.slug}
                  href={ROUTES.ADMIN.SINGLETON(collection.slug)}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname.startsWith(ROUTES.ADMIN.SINGLETON(collection.slug))
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <FileText className="mr-3 h-5 w-5" />

                  {collection.label}
                </Link>
              ))}
          </>
        )}

        <div className="pt-4 pb-2">
          <small className="text-muted-foreground uppercase tracking-wider px-4 block mb-2">
            Assets
          </small>
        </div>

        <Link
          href={ROUTES.ADMIN.MEDIA}
          className={cn(
            "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
            pathname.startsWith(ROUTES.ADMIN.MEDIA)
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
          )}
        >
          <ImageIcon className="mr-3 h-5 w-5" />

          {ui.sidebar.mediaLibrary}
        </Link>

        <Link
          href={ROUTES.ADMIN.TRASH}
          className={cn(
            "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
            pathname.startsWith(ROUTES.ADMIN.TRASH)
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
          )}
        >
          <Trash2 className="mr-3 h-5 w-5" />

          {ui.sidebar.trash}
        </Link>
      </nav>

      <div className="pt-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user?.image || undefined}
              alt={user?.name || "User"}
            />

            <AvatarFallback>
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || "User"}
            </p>

            <small className="text-muted-foreground truncate block">
              {user?.email}
            </small>
          </div>
        </div>

        <SignOutButton onSignOut={onSignOut} />
      </div>
    </div>
  );
}
