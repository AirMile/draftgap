/**
 * Acceptance tests for dynamic-role-champions feature.
 * Source-level verification: no runtime imports, only fs-based file reading.
 */
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

const ROOT = path.resolve(__dirname, "../..");

describe("dynamic-role-champions acceptance", () => {
  // A1: page.tsx fetcht /api/champions/{role}
  it("A1: page.tsx fetches /api/champions/", () => {
    const source = fs.readFileSync(path.join(ROOT, "app/page.tsx"), "utf-8");
    expect(source).toContain("/api/champions/");
  });

  // A2: page.tsx importeert role-mapping.json niet
  it("A2: page.tsx does not import role-mapping", () => {
    const source = fs.readFileSync(path.join(ROOT, "app/page.tsx"), "utf-8");
    expect(source).not.toContain("role-mapping");
  });

  // A3: data/role-mapping.json bestaat niet
  it("A3: data/role-mapping.json does not exist", () => {
    const exists = fs.existsSync(path.join(ROOT, "data/role-mapping.json"));
    expect(exists).toBe(false);
  });

  // A4: Geen source file importeert role-mapping
  it("A4: no source file references role-mapping", () => {
    const files = glob.sync("**/*.{ts,tsx}", {
      cwd: ROOT,
      ignore: [
        "node_modules/**",
        ".next/**",
        "__tests__/acceptance/**",
        "*.config.*",
      ],
      absolute: true,
    });

    const offenders: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      if (content.includes("role-mapping")) {
        offenders.push(path.relative(ROOT, file));
      }
    }

    expect(offenders).toEqual([]);
  });

  // A5: page.tsx fetcht /api/champions/ bij role change
  it("A5: page.tsx fetches /api/champions/ on role change", () => {
    const source = fs.readFileSync(path.join(ROOT, "app/page.tsx"), "utf-8");
    expect(source).toContain("/api/champions/");
  });

  // A6: page.tsx heeft loading state voor champions
  it("A6: page.tsx has a loading state for champions", () => {
    const source = fs.readFileSync(path.join(ROOT, "app/page.tsx"), "utf-8");
    const hasLoadingState =
      source.includes("championsLoading") ||
      source.includes("Champions laden") ||
      source.includes("loading");
    expect(hasLoadingState).toBe(true);
  });
});
