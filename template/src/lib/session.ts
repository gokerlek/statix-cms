import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}

// RSC (Server Component) için — redirect, asla catch'lenmez
export async function requireAdminOrRedirect() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");
  if (session.user.role !== "admin") redirect("/admin?error=forbidden");
  return session;
}

// Self veya admin için — avatar, profile update gibi
export async function requireSelfOrAdmin(targetUserId: string) {
  const session = await requireSession();
  if (session.user.id !== targetUserId && session.user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}
