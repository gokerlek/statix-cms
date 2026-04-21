"use client";

import { useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { IconSearch } from "@tabler/icons-react";

import { SearchResultItem, SearchHit } from "@/statix/components/admin/SearchResultItem";
import { buttonVariants } from "@/statix/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/statix/components/ui/dialog";
import { Kbd, KbdGroup } from "@/statix/components/ui/kbd";
import { CMSSearch } from "@/statix/components/shared/CMSSearch";
import ui from "@/statix/content/ui.json";
import { ROUTES } from "@/statix/lib/constants";
import { cn } from "@/statix/lib/utils";

interface SearchResponse {
  query: string;
  results: SearchHit[];
  truncated: boolean;
}

async function search(q: string): Promise<SearchResponse> {
  if (!q.trim()) {
    return { query: "", results: [], truncated: false };
  }
  const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return (await res.json()) as SearchResponse;
}

/** Simple 250ms debounce — avoids hammering the backend on every keystroke. */
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * ⌘K / Ctrl+K global search palette.
 *
 * Composition — reuses what the rest of the admin already ships:
 * - `<CMSSearch>` for the input (same icon + class you see elsewhere).
 * - `<SearchResultItem>` for each hit (Card/Badge, matches `UserListItem`).
 * - `<Dialog>` + `<Kbd>` + `buttonVariants` — no new primitive invented here.
 *
 * No `cmdk` dependency.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);

  // Global ⌘K / Ctrl+K shortcut.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => search(debouncedQuery),
    enabled: open && debouncedQuery.trim().length > 0,
    staleTime: 30_000,
  });

  // Reset query when the dialog closes so next open starts fresh.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = data?.results ?? [];

  const metaSymbol = useMemo(() => {
    if (typeof navigator === "undefined") return "⌘";
    return navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl";
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label={ui.search.trigger}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "gap-2 text-muted-foreground font-normal",
        )}
      >
        <IconSearch className="h-4 w-4" />
        <span className="hidden sm:inline">{ui.search.trigger}</span>
        <KbdGroup className="ml-auto pl-2">
          <Kbd>{metaSymbol}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </DialogTrigger>

      <DialogContent
        className="p-0 overflow-hidden sm:max-w-lg"
        aria-describedby={undefined}
      >
        {/* Input — reuse the same search bar that lives everywhere else */}
        <div className="border-b p-3">
          <CMSSearch
            value={query}
            onChange={setQuery}
            placeholder={ui.search.placeholder}
          />
        </div>

        {/* Body — state messages use the same muted style as empty states elsewhere */}
        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
          {!query.trim() && (
            <EmptyMessage>{ui.search.typing}</EmptyMessage>
          )}

          {query.trim() && isFetching && (
            <EmptyMessage>{ui.search.searching}</EmptyMessage>
          )}

          {query.trim() && !isFetching && results.length === 0 && (
            <EmptyMessage>{ui.search.empty}</EmptyMessage>
          )}

          {results.map((hit) => (
            <SearchResultItem
              key={`${hit.collection}-${hit.id}`}
              hit={hit}
              href={ROUTES.ADMIN.COLLECTION_ITEM(hit.collection, hit.id)}
              onSelect={() => setOpen(false)}
            />
          ))}

          {data?.truncated && (
            <p className="px-3 py-2 text-[11px] text-muted-foreground border-t">
              {ui.search.truncatedHint}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
  );
}
