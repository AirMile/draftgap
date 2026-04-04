# LoL Pool Optimizer

## Commands

```bash
npm run dev            # Next.js dev server (Turbopack)
npm test               # Jest test suite
npm run build          # Production build
npm run lint           # ESLint
npm run generate-data  # Regenerate matchup data from U.GG
```

## Project

Champion pool optimizer — selecteer je role en champions, krijg een matchup matrix met winrates, coverage gaps en suggesties.

### Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Testing**: Jest 30 + ts-jest + React Testing Library
- **Data**: Statische JSON (U.GG Platinum+ World), DDragon CDN
- **Deployment**: Vercel

### Architecture

```
app/page.tsx              → Landing: role selectie + champion picker
app/pool/page.tsx         → Matrix view + quick pick + gaps + suggesties
app/api/matchups/[role]   → Serveert data/matchups/{role}.json
app/api/champions/[role]  → Serveert champions[] uit matchup JSON
app/api/champions         → DDragon champion proxy (24h cache)
lib/matchup-engine.ts     → Pure functions: bestPick, findGaps, suggestChampions
lib/ddragon.ts            → DDragon fetch + MonkeyKing mapping
lib/opgg.ts               → OP.GG MCP client (used by generate script)
data/matchups/*.json      → Statische matchup data per role
scripts/generate-matchup-data.ts → U.GG data scraper
```

### Key Patterns

- **Bi-directionele matchup lookups**: `findMatchup()` in matchup-engine.ts zoekt directe EN omgekeerde entries (A vs B = 42% → B vs A ≈ 58%)
- **DDragon ID mapping**: OP.GG/U.GG gebruiken display namen, intern altijd DDragon IDs (PascalCase). MonkeyKing → Wukong mapping in ddragon.ts
- **Sparse data aware**: UI toont alleen opponents waarvoor matchup data bestaat, geen lege cellen
- **Path alias**: `@/*` → project root (tsconfig.json)

### Testing

- Unit tests in `__tests__/` — mock `next/server` + `fs` voor route tests
- Acceptance tests in `__tests__/acceptance/` — source file analysis + contract verification
- `jest.config.ts` met jsdom environment en `@/` path alias

## Project Context

Dashboard bestanden in `.project/`:

- `project.json` — stack, features, endpoints
- `project-context.json` — structure, routing, patterns, architecture, learnings

### Animation & Transitions

Apple-geïnspireerde motion design. Consistente patronen:

- **View transitions** (`animate-fade-in` in `globals.css`): `opacity + scale(0.97) + blur(4px)`, 450ms, `cubic-bezier(0.16, 1, 0.3, 1)` — voor schermwissels (role picker → champion picker → dashboard)
- **Hover/interactive**: `transition-colors` of `transition-all` met `duration-200` voor buttons, cards, interactieve elementen
- **Hover emphasis** (role picker cards): `duration-300` voor hover states met meerdere properties (scale, glow, color)
- **Image zoom** (role picker): `duration-500` voor subtiele achtergrond-zoom op hover
- **Loading states**: `transition-opacity duration-200` voor dim/undim, `animate-pulse` voor skeleton placeholders
- **Click feedback**: `active:scale-95` of `active:scale-[0.98]` voor tactiele feedback

**Principes:**

- Geen `translateY` voor view transitions — scale + blur geeft diepte zonder "webby" gevoel
- Easing: altijd `ease-out` of Apple's `cubic-bezier(0.16, 1, 0.3, 1)` — nooit linear
- Snelheid: interactieve feedback (150-200ms) < hover states (200-300ms) < view transitions (400-500ms)

## User Preferences

- Language: Nederlands
