# `@repo/languages`

**One place to edit** supported languages for **Next.js** and **Sanity Studio**.

## Why not root `.env`?

`web` and `studio` are often deployed on **different hosts** (e.g. Vercel + `sanity deploy`). They do **not** share a filesystem or a single `.env` at runtime. Duplicating `SITE_LOCALES=en,de` in two dashboards is easy to get wrong and does not give Studio human-readable titles without extra parsing.

Keeping languages in **this package** (versioned in Git) means:

- Every deploy that builds from the same commit sees the **same** list.
- TypeScript checks that **labels exist** for every locale id (`SITE_LOCALE_LABELS`).
- No secrets involved — env files are the wrong tool for this.

If you ever need **different** languages per environment (rare), you could add a small build script that emits this module from env — start from Git as source of truth first.

## Edit

Open [`src/index.ts`](./src/index.ts): `SITE_LOCALES`, `SITE_DEFAULT_LOCALE`, `SITE_LOCALE_LABELS`.

Then restart `pnpm web:dev` and `pnpm studio:dev` (or rebuild both deploys).
