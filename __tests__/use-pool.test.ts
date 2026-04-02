import { renderHook, act } from "@testing-library/react";
import { usePool } from "@/lib/use-pool";

const mockStorage: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  jest
    .spyOn(Storage.prototype, "getItem")
    .mockImplementation((key: string) => mockStorage[key] ?? null);
  jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation((key: string, value: string) => {
      mockStorage[key] = value;
    });
  jest
    .spyOn(Storage.prototype, "removeItem")
    .mockImplementation((key: string) => {
      delete mockStorage[key];
    });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("usePool", () => {
  it("starts with null pool when no localStorage data", () => {
    const { result } = renderHook(() => usePool());
    expect(result.current.pool).toBeNull();
    expect(result.current.isValid).toBe(false);
  });

  it("loads existing pool from localStorage", () => {
    mockStorage["lol-pool-optimizer-pool"] = JSON.stringify({
      role: "top",
      champions: ["Darius", "Garen"],
    });
    const { result } = renderHook(() => usePool());
    expect(result.current.pool?.role).toBe("top");
    expect(result.current.pool?.champions).toEqual(["Darius", "Garen"]);
  });

  it("sets role and persists to localStorage", () => {
    const { result } = renderHook(() => usePool());
    act(() => {
      result.current.setRole("mid");
    });
    expect(result.current.pool?.role).toBe("mid");
    expect(mockStorage["lol-pool-optimizer-pool"]).toContain('"mid"');
  });

  it("adds champion up to max 5", () => {
    const { result } = renderHook(() => usePool());
    act(() => result.current.setRole("top"));
    act(() => result.current.addChampion("Darius"));
    act(() => result.current.addChampion("Garen"));
    act(() => result.current.addChampion("Sett"));
    act(() => result.current.addChampion("Mordekaiser"));
    act(() => result.current.addChampion("Fiora"));
    expect(result.current.pool?.champions).toHaveLength(5);

    // 6th should be blocked
    act(() => result.current.addChampion("Camille"));
    expect(result.current.pool?.champions).toHaveLength(5);
    expect(result.current.pool?.champions).not.toContain("Camille");
  });

  it("prevents duplicate champions", () => {
    const { result } = renderHook(() => usePool());
    act(() => result.current.setRole("top"));
    act(() => result.current.addChampion("Darius"));
    act(() => result.current.addChampion("Darius"));
    expect(result.current.pool?.champions).toHaveLength(1);
  });

  it("removes champion", () => {
    const { result } = renderHook(() => usePool());
    act(() => result.current.setRole("top"));
    act(() => result.current.addChampion("Darius"));
    act(() => result.current.addChampion("Garen"));
    act(() => result.current.removeChampion("Darius"));
    expect(result.current.pool?.champions).toEqual(["Garen"]);
  });

  it("isValid requires minimum 2 champions", () => {
    const { result } = renderHook(() => usePool());
    act(() => result.current.setRole("top"));
    expect(result.current.isValid).toBe(false);

    act(() => result.current.addChampion("Darius"));
    expect(result.current.isValid).toBe(false);

    act(() => result.current.addChampion("Garen"));
    expect(result.current.isValid).toBe(true);
  });

  it("clearPool removes data from localStorage", () => {
    const { result } = renderHook(() => usePool());
    act(() => result.current.setRole("top"));
    act(() => result.current.addChampion("Darius"));
    act(() => result.current.addChampion("Garen"));
    act(() => result.current.clearPool());
    expect(result.current.pool).toBeNull();
    expect(mockStorage["lol-pool-optimizer-pool"]).toBeUndefined();
  });
});
