# Stack Baseline Research

> Generated: 2026-04-02. Reference for Next.js 16 / React 19 / Tailwind CSS 4 / Jest 30.

---

## Next.js 16 (App Router)

### Conventions

1. **File-system routing** — every folder inside `app/` is a route segment. `page.tsx` makes it publicly accessible; `layout.tsx`, `loading.tsx`, `error.tsx`, and `not-found.tsx` are special co-located files.
2. **Server Components by default** — all components in `app/` are RSCs unless they contain `"use client"` at the top. Keep the "use client" boundary as deep (leaf-level) as possible.
3. **`params` is a Promise in v16** — dynamic segment params (`params.id`) must be `await`ed: `const { id } = await params`.
4. **Root layout is required** — `app/layout.tsx` must include `<html>` and `<body>` tags and accept a `children` prop.
5. **Metadata via export, not `<Head>`** — export a `metadata` object or a `generateMetadata` async function from any `page.tsx` or `layout.tsx`.
6. **Route Groups** — wrap folders in `(groupName)` to logically group routes without affecting the URL path; useful for separate layouts.
7. **`loading.tsx` = automatic Suspense boundary** — placing a `loading.tsx` file wraps the segment in a Suspense boundary automatically.
8. **Server Actions with `"use server"`** — mark async functions with `"use server"` to create server-side mutations callable from Client Components.
9. **`@` path alias** — `@/` maps to the project root by default; use for all internal imports to avoid relative path hell.
10. **`next/font` for fonts** — always load fonts through `next/font` to get automatic self-hosting and zero layout shift.

### Common Patterns

1. **Fetch in Server Components, pass data down** — fetch directly in an async Server Component and forward data as props to Client Components.
2. **Static / dynamic / revalidated fetch** — control caching per-request: `{ cache: 'force-cache' }` (static), `{ cache: 'no-store' }` (dynamic), `{ next: { revalidate: N } }` (ISR-style).
3. **Parallel Suspense boundaries** — wrap independent async sections in separate `<Suspense>` blocks to stream them independently.
4. **`revalidatePath` / `revalidateTag`** — call from Server Actions after mutations to purge the Data Cache for specific routes or tags.
5. **Client Component islands** — interactive widgets (`useState`, event handlers, browser APIs) live in a `"use client"` component that receives server-fetched data as props.
6. **Collocate non-page files** — utilities, components, and types can live inside `app/` alongside route files; only `page.tsx` / `route.ts` are publicly routable.
7. **`generateStaticParams`** — pre-render dynamic routes at build time by exporting this function from a dynamic segment page.
8. **Middleware in `middleware.ts`** — runs at the edge before a request is processed; suitable for auth redirects, locale detection, A/B flags.
9. **`next/image`** — always use for images; provides automatic optimization, lazy loading, and CLS prevention.
10. **API routes as `route.ts`** — export named HTTP-method handlers (`GET`, `POST`, etc.) from `app/api/.../route.ts`.

### Pitfalls to Avoid

1. **Forgetting `"use client"` on hook-using components** — using `useState`, `useEffect`, or browser APIs in a Server Component throws a runtime error. Add `"use client"` to the outermost component that needs it.
2. **Using `params` synchronously** — in Next.js 16, `params` and `searchParams` are Promises; accessing them without `await` silently returns undefined.
3. **Importing Server-only modules into Client Components** — database clients, `fs`, secrets-reading code must never be imported from a `"use client"` file. Use `server-only` package to enforce this.
4. **Putting large third-party libraries inside the client boundary** — marking a component `"use client"` pulls its entire import graph into the client bundle. Keep client components focused and thin.
5. **Skipping `error.tsx`** — without an error boundary file, unhandled errors in a segment crash the entire page rather than the segment.

### Testing Patterns

1. **Unit-test Server Components with direct function calls** — RSCs are async functions; `await Page({ params: Promise.resolve({ id: '1' }) })` in Jest works without a renderer.
2. **Use `jest-environment-jsdom`** for Client Components; use `jest-environment-node` for Server Components and API route handlers.
3. **Mock `next/navigation`** — stub `useRouter`, `usePathname`, `useSearchParams` via `jest.mock('next/navigation', ...)` before rendering Client Components.
4. **`@testing-library/react` for Client Component integration** — render with `renderWithProviders` wrappers that include any context providers the component needs.

---

## React 19

### Conventions

1. **Actions** — async functions passed to `action` / `formAction` props are "Actions"; they automatically track pending state, handle errors, and reset forms on success.
2. **`useActionState`** — primary hook for form/mutation state: `const [state, submitAction, isPending] = useActionState(asyncFn, initialState)`. Replaces the deprecated `useFormState`.
3. **`ref` as a plain prop** — `forwardRef` is no longer needed; function components accept `ref` directly in their props destructuring.
4. **`use(promise)`** — reads a Promise or Context inside render. Suspends the component until the promise resolves. Can be called conditionally (unlike other hooks).
5. **`useOptimistic`** — apply an optimistic UI update immediately, automatically rolled back if the underlying Action errors.
6. **`useFormStatus`** — child of a `<form>` reads the parent form's pending state without prop-drilling.
7. **Server Functions (`"use server"`)** — async functions callable from Client Components that execute on the server; can be passed as Action props.
8. **Context as `<Context>` not `<Context.Provider>`** — `<MyContext value={...}>` is the new shorthand.
9. **Document metadata in JSX** — `<title>`, `<meta>`, and `<link>` tags inside components are automatically hoisted to `<head>`.
10. **`React.memo` / `useMemo` / `useCallback` less necessary** — the React Compiler (opt-in) handles memoization automatically; avoid premature manual memoization.

### Common Patterns

1. **Form with `useActionState`** — wrap an async server-or-client action; bind the returned `submitAction` to `<form action={submitAction}>`.
2. **Optimistic list update** — `useOptimistic` to append an item immediately while the server mutation is in flight.
3. **`useTransition` for non-form mutations** — wrap server function calls in `startTransition` to get `isPending` without blocking the UI.
4. **Pass Server Functions as props** — a Server Component can pass a `"use server"` function as an `action` prop to a Client Component form.
5. **`<Suspense>` + `use(promise)`** — pass a promise created in a Server Component (or via a data library) down to a Client Component that calls `use()` to unwrap it.
6. **Error Boundaries for Action errors** — wrap Action-driven UI in an Error Boundary to catch and display server errors declaratively.
7. **Context at the module level** — create context in a dedicated file, export the provider as a `"use client"` component wrapping children.
8. **Ref callbacks for setup/teardown** — return a cleanup function from a ref callback (new in React 19) instead of a `useEffect` pair.
9. **`useId` for accessibility** — generate stable IDs for label/input pairs; never use `Math.random()` for IDs.
10. **`startTransition` for route changes** — wrap navigation or state changes that trigger expensive re-renders to keep the current UI interactive.

### Pitfalls to Avoid

1. **Calling `useFormState` (deprecated)** — it's been renamed to `useActionState`. Using `useFormState` will print a deprecation warning and may be removed.
2. **Async functions outside of Actions/transitions** — triggering async state updates outside `startTransition` or an Action still causes the "Cannot update a component while rendering a different component" warning.
3. **`use()` only for Suspense-integrated sources** — calling `use(promise)` with a new Promise created on every render causes an infinite Suspense loop. The promise must be stable (created once, cached, or passed from a parent).
4. **Over-using `"use client"`** — marking a layout or high-level component as a Client Component forces all its children into the client bundle. Prefer thin client wrappers.
5. **Ignoring cleanup in ref callbacks** — if you return a cleanup function from a ref callback, it must undo exactly what the setup did; otherwise you get double-invocation side effects in Strict Mode.

### Testing Patterns

1. **`act()` around async Actions** — wrap form submissions and `useTransition` calls in `act(async () => { ... })` to flush state updates.
2. **Mock Server Functions** — `jest.mock('./actions', () => ({ updateName: jest.fn().mockResolvedValue(null) }))` to test Client Components that call server functions.
3. **Test optimistic state** — assert intermediate optimistic UI before `await`ing the mocked promise resolution.
4. **`@testing-library/user-event`** — prefer `userEvent.type` / `userEvent.click` over `fireEvent` for realistic interaction simulation.
5. **`renderHook`** — use for testing custom hooks that use `useActionState`, `useOptimistic`, or `useTransition` in isolation.

---

## Tailwind CSS 4

### Conventions

1. **CSS-first configuration** — no `tailwind.config.js` by default. All customisation lives in your CSS file using `@theme {}`.
2. **`@import "tailwindcss"`** — single import replaces the old `@tailwind base/components/utilities` directives.
3. **Design tokens as CSS custom properties** — `@theme` emits tokens as `:root` CSS variables (e.g. `--color-brand-500`), making them available to non-Tailwind CSS and JavaScript.
4. **Naming conventions match CSS variable keys** — `--color-*`, `--font-*`, `--breakpoint-*`, `--spacing-*` map directly to utility class namespaces.
5. **Utility-first composition** — build UI by composing small, single-purpose classes directly in markup; avoid writing custom CSS unless abstracting a repeated multi-class pattern with `@layer components`.
6. **Responsive prefix order** — always write breakpoints from mobile-first: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`.
7. **State variants** — `hover:`, `focus:`, `active:`, `disabled:`, `aria-*:`, `data-*:` variants handle interactive states without custom CSS.
8. **`@custom-variant` for custom variants** — define project-specific variants (e.g. dark mode driven by a data attribute) with `@custom-variant`.
9. **Dark mode via variant** — default is `prefers-color-scheme`; override with `@custom-variant dark (&:where(.dark, .dark *))` for class-based toggling.
10. **No `purge` config needed** — v4 auto-detects class usage via content scanning; manual `content` paths are only needed for non-standard locations.

### Common Patterns

1. **Class-based dark mode** — add `@custom-variant dark (&:where(.dark, .dark *))` in CSS; toggle the `.dark` class on `<html>` via JavaScript.
2. **Data-attribute dark mode** — `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *))` for theme systems using `data-theme`.
3. **Custom colour palette** — define `--color-brand-{n}` tokens in `@theme`; use as `bg-brand-500`, `text-brand-200`, etc.
4. **Component abstraction with `@layer components`** — group repeated utility combos (e.g. `.btn-primary`) inside `@layer components {}` to keep HTML readable without losing utility benefits.
5. **Arbitrary values** — `w-[337px]`, `bg-[#1a2b3c]`, `grid-cols-[1fr_2fr]` for one-off values that don't warrant a token.
6. **Group and peer variants** — `group-hover:`, `peer-checked:` for styling children/siblings based on parent/sibling state.
7. **`size-*` shorthand** — `size-8` sets both `width` and `height` simultaneously.
8. **`@apply` sparingly** — use only inside `@layer components` or `@layer utilities`; never inside component-scoped CSS where it breaks the cascade.
9. **Inline theme access** — reference tokens as CSS variables in arbitrary values: `bg-[var(--color-brand-500)]`.
10. **`screen()` helper in CSS** — use `@media screen(md)` in hand-written CSS to reference breakpoint tokens instead of hard-coding pixel values.

### Pitfalls to Avoid

1. **Dynamic class construction** — do not build class strings dynamically with string interpolation (`"bg-" + color`); Tailwind's scanner won't detect them and they'll be purged. Use a full class name lookup map instead.
2. **Mixing v3 config with v4** — `tailwind.config.js` is not loaded automatically in v4. Migrating a v3 project requires converting JS config to `@theme` CSS or using the compatibility shim.
3. **`@apply` outside layers** — using `@apply` in a scoped `.module.css` or inside a Shadow DOM context can produce ordering/specificity bugs because utilities are injected at a different cascade layer.
4. **Overriding base tokens unintentionally** — redefining a `--spacing-*` or `--color-*` token in `@theme` replaces the entire default scale for that namespace; use `@theme default {}` or extend selectively.
5. **Not using `dark:` systematically** — adding `dark:` variants inconsistently (some components missing them) produces partially-themed UIs. Audit with a forced dark class on `<html>` during development.

---

## Jest 30

### Conventions

1. **Config in `jest.config.ts`** — use a typed config file: `import type {Config} from 'jest'`.
2. **Environment per test** — set `testEnvironment: 'node'` globally and override per-file with `@jest-environment jsdom` docblock for browser-context tests.
3. **Explicit imports from `@jest/globals`** — when using ESM, import `jest`, `test`, `expect`, `describe` from `@jest/globals` rather than relying on globals.
4. **Transform for TypeScript** — use `ts-jest` or `@swc/jest` as the transform; configure `extensionsToTreatAsEsm` when using ESM.
5. **`projects` for monorepos** — split configurations via the `projects` array with per-project `testMatch` globs.
6. **Snapshot files in version control** — commit `.snap` files; treat unexpected snapshot diffs as a code review signal.
7. **`--coverage` thresholds** — set `coverageThreshold` in config to enforce minimums; fail CI on regressions.

### Common Patterns

1. **Async mock resolved/rejected values** — `jest.fn().mockResolvedValue(data)` / `.mockRejectedValue(new Error(...))` for async functions; use `.mockResolvedValueOnce` for sequential scenarios.
2. **Module mocking with `jest.mock`** — hoisted to the top of the file automatically (CJS); for ESM use `jest.unstable_mockModule` with dynamic `import()` after the mock declaration.
3. **TypeScript-safe mocking** — `jest.createMockFromModule<typeof import('../module')>('../module')` generates a fully-typed auto-mock.
4. **`jest.doMock` for per-test mocks** — combine with `jest.resetModules()` in `beforeEach` to isolate module registry state between tests.
5. **Fake timers** — `jest.useFakeTimers()` / `jest.runAllTimers()` for `setTimeout`/`setInterval` dependent code; call `jest.useRealTimers()` in `afterEach`.
6. **`beforeEach` / `afterEach` for setup/teardown** — prefer over `beforeAll`/`afterAll` to keep tests isolated and order-independent.
7. **`describe` blocks for grouping** — group related tests in `describe` to share setup and scope mocks; keep nesting to 2 levels maximum.

### Pitfalls to Avoid

1. **ESM + `jest.mock` hoisting** — `jest.mock()` is not hoisted for ESM modules. Use `jest.unstable_mockModule` and dynamically `import()` the module under test after the mock is declared.
2. **Overriding after `jest.unstable_unmockModule`** — calling `jest.unstable_mockModule` again on a module that was already imported and unmocked has no effect (the module is cached). Reset modules first.
3. **`--runInBand` masking parallelism bugs** — tests that pass only with `--runInBand` have hidden shared-state coupling. Fix the root cause (shared module-level state, missing mock resets).
4. **Not cleaning up fake timers** — if `jest.useFakeTimers()` is called without a matching `jest.useRealTimers()` / `afterEach` cleanup, subsequent test files in the same worker may behave unexpectedly.
5. **Snapshot over-testing** — snapshotting large component trees makes tests brittle and diffs unreadable. Prefer targeted `expect(element).toHaveTextContent(...)` assertions.

---

## Context7 Library IDs

| Technology | Context7 Library ID | Notes |
|---|---|---|
| Next.js 16 | `/vercel/next.js/v16.1.6` | Versioned; highest benchmark for v16 |
| Next.js (full docs) | `/llmstxt/nextjs_llms-full_txt` | 40k+ snippets, broad coverage |
| React 19 | `/websites/react_dev` | Highest benchmark (90), react.dev source |
| React 19 (reference) | `/websites/react_dev_reference` | API reference focus |
| React (source) | `/facebook/react/v19_1_1` | Source-level, versioned |
| Tailwind CSS 4 | `/tailwindlabs/tailwindcss.com` | Official docs site, v4 content |
| Jest 30 | `/websites/jestjs_io_next` | "next" branch = v30 docs |
| Jest (stable) | `/jestjs/jest` | v29.7.0, highest benchmark score |
