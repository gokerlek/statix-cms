"use client";

import { ListDiffView } from "@/statix/components/editor/diff/ListDiffView";

interface BlockDiffViewProps {
  previous: unknown[] | undefined | null;
  current: unknown[] | undefined | null;
}

/**
 * Blocks are list items plus a `type` discriminator — the add/remove/move
 * semantics are identical, so we reuse `ListDiffView` and just steer the
 * title toward the block's `type` label.
 */
export function BlockDiffView({ previous, current }: BlockDiffViewProps) {
  return <ListDiffView previous={previous} current={current} titleKey="type" />;
}
