const ADMIN_ROOT = "/admin";

export const ROUTES = {
  ADMIN: {
    ROOT: ADMIN_ROOT,
    MEDIA: `${ADMIN_ROOT}/media`,
    TRASH: `${ADMIN_ROOT}/trash`,
    ACTIVITY: `${ADMIN_ROOT}/activity`,
    COLLECTION: (slug: string) => `${ADMIN_ROOT}/${slug}`,
    COLLECTION_NEW: (slug: string) => `${ADMIN_ROOT}/${slug}/new`,
    COLLECTION_ITEM: (slug: string, id: string) =>
      `${ADMIN_ROOT}/${slug}/${id}`,
    SINGLETON: (slug: string) => `${ADMIN_ROOT}/${slug}/index`,
  },
  AUTH: {
    SIGNIN: "/api/auth/signin",
  },
};
