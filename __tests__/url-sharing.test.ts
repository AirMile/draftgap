import { buildShareUrl, parseShareParams } from "@/lib/url-sharing";

describe("buildShareUrl", () => {
  it("builds URL with role and champions", () => {
    const url = buildShareUrl("top", ["Darius", "Garen"], "emerald_plus");
    expect(url).toContain("role=top");
    expect(url).toContain("champs=Darius%2CGaren");
    // Default tier should be omitted
    expect(url).not.toContain("tier=");
  });

  it("includes tier when not default", () => {
    const url = buildShareUrl("mid", ["Ahri"], "platinum_plus");
    expect(url).toContain("tier=platinum_plus");
  });
});

describe("parseShareParams", () => {
  it("parses valid params", () => {
    const params = new URLSearchParams("role=top&champs=Darius,Garen");
    const result = parseShareParams(params);
    expect(result).toEqual({
      role: "top",
      champions: ["Darius", "Garen"],
      tier: "emerald_plus",
    });
  });

  it("parses tier param", () => {
    const params = new URLSearchParams(
      "role=mid&champs=Ahri&tier=platinum_plus",
    );
    const result = parseShareParams(params);
    expect(result?.tier).toBe("platinum_plus");
  });

  it("returns null for missing role", () => {
    const params = new URLSearchParams("champs=Darius");
    expect(parseShareParams(params)).toBeNull();
  });

  it("returns null for missing champs", () => {
    const params = new URLSearchParams("role=top");
    expect(parseShareParams(params)).toBeNull();
  });

  it("returns null for invalid role", () => {
    const params = new URLSearchParams("role=adc&champs=Jinx");
    expect(parseShareParams(params)).toBeNull();
  });

  it("returns null for empty champs", () => {
    const params = new URLSearchParams("role=top&champs=");
    expect(parseShareParams(params)).toBeNull();
  });

  it("filters empty segments from champs", () => {
    const params = new URLSearchParams("role=top&champs=Darius,,Garen,");
    const result = parseShareParams(params);
    expect(result?.champions).toEqual(["Darius", "Garen"]);
  });

  it("defaults to emerald_plus for invalid tier", () => {
    const params = new URLSearchParams("role=top&champs=Darius&tier=invalid");
    const result = parseShareParams(params);
    expect(result?.tier).toBe("emerald_plus");
  });

  it("round-trips with buildShareUrl", () => {
    const url = buildShareUrl("jungle", ["LeeSin", "Viego"], "overall");
    const queryString = url.split("?")[1];
    const parsed = parseShareParams(new URLSearchParams(queryString));
    expect(parsed).toEqual({
      role: "jungle",
      champions: ["LeeSin", "Viego"],
      tier: "overall",
    });
  });
});
