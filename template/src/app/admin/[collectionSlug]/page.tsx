import Link from "next/link";
import { notFound } from "next/navigation";

import { Plus } from "lucide-react";

import { CollectionList } from "@/components/cms/CollectionList";
import { Button } from "@/components/ui/button";
import ui from "@/content/ui.json";
import { ROUTES } from "@/lib/constants";
import { resolveContentTitle } from "@/lib/content-utils";
import { getGitHubCMS } from "@/lib/github-cms";
import { statixConfig } from "@/statix.config";
import { ContentData } from "@/types/content";

interface PageProps {
  params: Promise<{ collectionSlug: string }>;
}

export default async function CollectionPage({ params }: PageProps) {
  const { collectionSlug } = await params;
  const collection = statixConfig.collections.find(
    (c) => c.slug === collectionSlug,
  );

  if (!collection) {
    notFound();
  }

  if (collection.type === "singleton") {
    const { redirect } = await import("next/navigation");

    redirect(ROUTES.ADMIN.SINGLETON(collectionSlug));
  }

  const github = getGitHubCMS();
  const allFiles = await github.listFiles(collection.path, true);

  const files = await Promise.all(
    allFiles
      .filter((file) => file.name.endsWith(".json"))
      .map(async (file) => {
        try {
          const content = await github.getFile(file.path);
          const status =
            (content?.content as { status?: string })?.status || "draft";
          const title = resolveContentTitle(
            collection,
            content?.content as ContentData | null,
          );

          return {
            ...file,
            title,
            status,
          };
        } catch (error) {
          console.error(`Failed to fetch content for ${file.path}`, error);

          return {
            ...file,
            status: "unknown",
          };
        }
      }),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="mb-2">{collection.label}</h4>

          <p className="text-muted-foreground">
            {files.length} {files.length === 1 ? "entry" : "entries"}
          </p>
        </div>

        <Button variant="outline" size="icon" asChild>
          <Link
            href={ROUTES.ADMIN.COLLECTION_NEW(collectionSlug)}
            title={ui.common.createNew}
          >
            <Plus className="size-7" />
          </Link>
        </Button>
      </div>

      <CollectionList
        initialData={files}
        collectionSlug={collectionSlug}
        collectionLabel={collection.label}
      />
    </div>
  );
}
