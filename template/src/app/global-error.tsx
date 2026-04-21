"use client";

/**
 * Root error boundary — renders when the root layout itself throws. Must
 * define its own <html> + <body> because no layout is available above it.
 *
 * Keep this file dependency-free (no Tailwind, no UI kit): if the main bundle
 * is broken, those imports would also throw. Inline styles only.
 */
interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
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
        <main
          style={{
            maxWidth: 480,
            padding: "32px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#6b7280", marginBottom: 24, lineHeight: 1.5 }}>
            The application hit an unrecoverable error. Please try again. If
            the problem persists, contact support with the ID below.
          </p>
          {error.digest ? (
            <p
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Liberation Mono", monospace',
                fontSize: 12,
                color: "#9ca3af",
                marginBottom: 24,
                wordBreak: "break-all",
              }}
            >
              Error ID: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
