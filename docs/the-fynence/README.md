# THE FYNENCE: Digital Retro Financial Newspaper

THE FYNENCE is a digital retro financial newspaper system delivering broadsheet editions through Telegram.

## Architecture & Integration

Per project mandate, this module integrates directly into the existing repository at `../Fynence-Project`:

* **Module Core:** `../Fynence-Project/src/fynence/` (symlinked here as `src/`)
* **Database Migration:** `../Fynence-Project/migrations/20260927000000_create-the-fynence-newspaper-schema.sql` (symlinked as `migrations/`)
* **Documentation:** `../Fynence-Project/docs/the-fynence/` (symlinked as `docs/`)
* **InsForge Client:** Reuses existing `@insforge/sdk` integration (`../Fynence-Project/src/lib/insforge.ts`)

## Key Principles

1. **Retro Broadsheet Aesthetic:** Aged cream paper, deep black ink, serif typography, dense columns, halftone imagery.
2. **Deterministic Rendering:** AI never generates layout, HTML, or CSS. The renderer consumes strongly typed structured JSON.
3. **Strict Anti-AI Image Rule:** AI image generation is prohibited for news stories. All photography comes from verified publisher sources. Fallback to typography, charts, or text-only.
4. **InsForge as Single Source of Truth:** Reuses `auth.users` and `public.profiles`. No secondary database or Prisma instance.
5. **Configurable Defaults:** Daily Edition defaults to `Magelang, Jawa Tengah, Indonesia` for weather, but is dynamically configurable.

## Documentation

* [System Architecture](docs/ARCHITECTURE.md)
* [Data Contracts & Schemas](docs/DATA_CONTRACTS.md)
