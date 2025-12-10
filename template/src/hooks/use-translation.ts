import ui from "@/content/ui.json";

// Helper to get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return path.split(".").reduce((prev, curr) => {
    return prev ? (prev as Record<string, unknown>)[curr] : null;
  }, obj as unknown) as string;
}

export function useTranslation() {
  const t = (key: string, params?: Record<string, string | number>) => {
    let value = getNestedValue(ui, key);

    if (!value) return key;

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v));
      });
    }

    return value;
  };

  return { t };
}
