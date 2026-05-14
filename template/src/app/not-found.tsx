import Link from "next/link";

/**
 * Root-level 404 — catches unknown URLs that don't match any route group.
 * Keep it minimal and framework-independent so it renders even when feature
 * bundles fail to load.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          background: "#fafafa",
          color: "#111827",
        }}
      >
        <main style={{ maxWidth: 480, padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            Page not found
          </h1>
          <p style={{ color: "#6b7280", marginBottom: 24, lineHeight: 1.5 }}>
            The page you&apos;re looking for doesn&apos;t exist or has moved.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "#111827",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            Go home
          </Link>
        </main>
      </body>
    </html>
  );
}
