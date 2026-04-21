# Next.js 16 + React 19.2 + Better Auth 1.5.6 Canary Audit

**Tarih:** 2026-04-21
**Mevcut sürümler:**
- `next@16.1.0-canary.19` (Next 16 stable güncel: 16.2.4)
- `react@19.2.0` + `react-dom@19.2.0`
- `better-auth@1.5.6`
- `eslint-config-next@16.0.4`
- `babel-plugin-react-compiler@1.0.0`

Bu doküman Faz 1 (middleware/proxy rename) ve Faz 5 (cache migration) için zorunlu input.

---

## 1. `middleware.ts` → `proxy.ts` rename + Edge runtime kaldırıldı

**🔴 Breaking change (Next.js 16):**

- `middleware.ts` dosya adı **deprecated**, yeni ad: `proxy.ts`
- Function named export `middleware` → `proxy` rename
- **Edge runtime desteklenMİYOR proxy.ts'de** — varsayılan ve tek runtime: **nodejs**
- Config flag'ları: `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`
- Codemod: `npx @next/codemod@canary upgrade latest` (otomatik yapar)

**Plan'a etki (Faz 1):**

- ✅ Edge runtime sorunu yok — proxy.ts zaten nodejs (in-memory Map güvenilir)
- ✅ `export const runtime = "nodejs"` gereksiz (default)
- ❌ `experimental.nodeMiddleware` flag gereksiz (proxy'de edge yok)
- ✅ Dosya adı değişikliği: `src/middleware.ts` → `src/proxy.ts`
- ✅ Function rename: `export async function middleware(...)` → `export async function proxy(...)`

**Karar:** Faz 1 başlamadan önce codemod çalıştır (`upgrade latest`) — dosya rename + config flag rename otomatik yapılsın.

---

## 2. `cookies()`, `headers()`, `params`, `searchParams` **tam async** (Next 15'ten beri, Next 16'da zorunlu)

**🔴 Breaking change:**

- Senkron erişim tamamen kaldırıldı (Next 15'te deprecated, Next 16'da error)
- Tüm call-site'lar `await` kullanmalı

**Repo taraması gerekiyor:**

```bash
grep -rn "cookies()\|headers()" src/ --include="*.ts" --include="*.tsx" | grep -v "await"
```

**Codemod otomatik yapar** — `next typegen` ile `PageProps`, `LayoutProps`, `RouteContext` tip yardımcıları da üretilir.

**Plan'a etki (Faz 0 madde 2):**
- ✅ Codemod çalıştır + manuel grep doğrula → 0 sync call-site kalmalı
- ✅ `src/middleware.ts:63` `request.cookies.has(SESSION_COOKIE)` **NextRequest** tabanlı — bu sync kalabilir (global `cookies()` değil, instance property)

---

## 3. `unstable_cache` → `"use cache"` + `cacheComponents: true`

**🟡 Migration önerilir ama zorunlu değil (Next 16):**

- `unstable_cache` hâlâ çalışıyor ama **Cache Components** modelinin `"use cache"` directive'i önerilir
- `"use cache"` kullanabilmek için `next.config.ts`'de `cacheComponents: true` flag set etmek gerekli
- `cacheLife` ve `cacheTag` stable oldu — `unstable_` prefix kaldırıldı
- **Kısıtlama:** `"use cache"` içinde `cookies()`, `headers()`, `params` doğrudan kullanılamaz — dışarıdan arg geçilmeli

**Repo taraması:**
- `src/statix/lib/content-index.ts:11` — `unstable_cache`
- `src/statix/lib/dashboard-data.ts:209` — `unstable_cache`
- `src/statix/lib/monitor-data.ts:110` — `unstable_cache`

**Plan'a etki (Faz 5):**
- ✅ 3 call-site `"use cache"` + `cacheTag`/`cacheLife` ile migrate
- ✅ `next.config.ts`'ye `cacheComponents: true` ekle
- ⚠️ `revalidateTag` yeni imza: **2. argüman `cacheLife` profile zorunlu** (`revalidateTag('slugs-blog', 'max')`). Eski tek-argüman kullanım TypeScript error verir.
- ✅ `updateTag` alternatifi var (Server Actions only, read-your-writes semantiği)

**Karar:** `"use cache"` directive'ine geç, `unstable_cache` kaldır.

---

## 4. Server Actions `bodySizeLimit`

**✅ Hâlâ aktif, değişiklik yok:**

- `experimental.serverActions.bodySizeLimit` çalışıyor, default 1MB
- Template'te zaten 50MB explicit set (`next.config.ts:17-19`)

**Plan'a etki:** Yok.

---

## 5. React 19.2 `use()`, `<form action>`

**✅ Desteklenen:**

- `use()` hook tüm conditional hook case'lerinde stable
- `<form action={serverAction}>` native form handling
- Yeni React 19.2 özellikleri: **View Transitions**, **useEffectEvent**, **Activity**

**Plan'a etki:** Yok (mevcut auth form'ları React Hook Form kullanıyor, native action'a geçmek için hızlı sebep yok).

---

## 6. Better Auth `rateLimit.customRules` API şekli (v1.5.6)

**✅ İki format desteklenir:**

```ts
rateLimit: {
  enabled: true,
  window: 60,         // default window (seconds)
  max: 100,           // default max requests
  customRules: {
    "/sign-in/email": { window: 10, max: 3 },                    // static
    "/two-factor/*":  async (request) => ({ window: 10, max: 3 }), // function
  },
}
```

- **Default storage: memory** — serverless için uygun değil (her cold-start sıfırlanır). Prod'da Redis/Upstash önerilir.
- **Key strategy:** IP-based default. Email/user bazlı key için function-based rule + manual key gen (Better Auth henüz built-in email key sunmuyor).
- **Plugin endpoint path'leri:** `/email-otp/send-verification-otp` ve `/sign-in/email-otp` ayrı endpoint'ler (OTP send + OTP verify).
- **Feature request açık:** `emailOTP` plugin'ine direkt `rateLimit` prop gelecek (v1.6+); şu an `customRules` ile kontrol edilmeli.

**Plan'a etki (Faz 1):**
- ✅ `customRules` ile endpoint'ler hedeflenebilir
- ⚠️ Email bazlı key için function-based rule + hash (middleware level değil, Better Auth config'inde)
- ⚠️ Memory storage — prod deploy README'sinde "Redis/Upstash önerisi" notu gerekli

---

## 7. Env validation bootstrap

**Karar sabitlendi:**

- `src/statix/lib/env.ts`'deki top-level `throw` korunur
- Seed/drizzle-kit için ayrı mini schema: `src/statix/db/env-migration.ts` (sadece `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` parse eder)
- `drizzle.config.ts` ve `scripts/seed-admin.ts` bu mini schema'yı kullanır

**Plan'a etki (Faz 0):** Yeni dosya `env-migration.ts` oluştur, `drizzle.config.ts` + `seed-admin.ts` import'larını güncelle.

---

## 8. CSP `style-src 'unsafe-inline'` gerçekten gerekli mi?

**🟡 Kısmen gerekli, doğrulama planda:**

- **ProseKit:** DOM manipülasyonları. Inline style attribute kullanıyor mu? Kontrol gerekiyor.
- **Recharts (2.15.0):** SVG styled. Inline `<style>` inject etmez — prop-based style; **CSS-in-JS (styled-components/emotion) kullanmaz**. Teorik olarak `'unsafe-inline'` gerekli değil.
- **Next.js 16 flight payload:** Inline bootstrap script yok (script-src için değil); inline style için `<style>` block kullanıyor olabilir.

**Plan'a etki (Faz 3a):**
- Report-Only 7 gün boyunca gözlem → violation çıkarsa `'unsafe-inline'` veya nonce-based gerekli
- Nonce-based migration path v0.4 roadmap'e not (CSP Level 3 nonce tercih edilir)

---

## 9. Next.js 16 diğer breaking değişiklikler (heads-up)

**🟡 Template'in package.json güncellemesi gerekecek:**

1. **Turbopack default** — `next dev` / `next build` default Turbopack. `--turbopack` flag gereksiz. Webpack custom config yoksa sorun yok.
2. **`next lint` kaldırıldı** — `scripts.lint: "eslint"` zaten (template güncel). `eslint-config-next` ile flat config formatı geçerli.
3. **`next/image` defaults değişti:**
   - `minimumCacheTTL`: 60s → 4h
   - `imageSizes`: 16 removed
   - `qualities`: [75] (tüm qualities değil)
   - `dangerouslyAllowLocalIP: false` default (prod için OK)
   - `maximumRedirects: 3` default
4. **React Compiler stable** — `experimental.reactCompiler: true` → top-level `reactCompiler: true`. Mevcut `next.config.ts:4` zaten `reactCompiler: true`. ✓
5. **Parallel routes `default.js` zorunlu** — şu an parallel route kullanılmıyor (repo'da `@slot` konvansiyonu yok). Etki yok.
6. **`revalidateTag` yeni imza** — 2 argüman zorunlu: `revalidateTag('tag', 'max')`. Faz 5 cache invalidation kodu bu şekilde yazılmalı.
7. **`cacheLife`, `cacheTag` stable** — `unstable_` prefix kaldırıldı. Eski aliased import'lar güncellenmeli.

---

## Audit özet — Plan'a etkiler

| Madde | Faz | Etki | Karar |
|---|---|---|---|
| 1. middleware → proxy rename | Faz 1 | 🔴 Breaking | Codemod çalıştır, sonra Faz 1 başla |
| 2. cookies()/headers() async | Faz 0 | 🟡 Codemod | `next typegen` + grep doğrula |
| 3. unstable_cache → "use cache" | Faz 5 | 🟡 Migrate | `cacheComponents: true` + 3 dosya migrate |
| 4. Server Actions bodySize | — | ✅ OK | Değişiklik yok |
| 5. React 19.2 features | — | ✅ OK | Şimdilik kullanmıyoruz |
| 6. Better Auth customRules | Faz 1 | ✅ OK | Function-based rule, README'de Redis notu |
| 7. Env bootstrap | Faz 0 | ✅ OK | env-migration.ts yan dosya |
| 8. CSP `'unsafe-inline'` | Faz 3a | 🟡 Doğrula | Report-Only 7 gün gözlem |
| 9. Diğer Next 16 breaking | Faz 0 | 🟡 Opsiyonel | Next stable'a geçiş opsiyonel; canary.19 çalışır durumda |

---

## Önerilen aksiyon sırası

1. **Faz 0 ilk adım:** `npx @next/codemod@canary upgrade latest` çalıştır
   - `middleware.ts` → `proxy.ts`
   - `cookies()/headers()` async codemod
   - `unstable_` prefix temizliği
   - `experimental_ppr` kaldırma
2. **Manuel doğrulama:** codemod'un dokunmadığı yerleri grep ile kontrol
3. **Sonra:** plan sırasıyla faz 1, 2, 3a, 4, 5 devam

---

## Known limitations (bu audit kapsamı dışı)

- **Next canary.19 → stable 16.2.4 upgrade** — opsiyonel; plan scope'u dışında (kullanıcı kararı). Canary'de kalmak Turbopack tracing, Cache Components, View Transitions vs. beta davranışı demek.
- **`"use cache"` dynamic route ignore bug** (`vercel/next.js#85240`) — eğer Faz 5 migration sonrası bir cache miss pattern görürsek bu bug olabilir; issue tracker'da takip.
