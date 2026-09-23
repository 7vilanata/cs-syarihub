import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "./login/route";
import { POST as logout } from "./logout/route";

describe("redirect autentikasi di belakang reverse proxy", () => {
  beforeEach(() => {
    vi.stubEnv("DASHBOARD_USERNAME", "cs");
    vi.stubEnv("DASHBOARD_PASSWORD", "rahasia");
    vi.stubEnv("SESSION_SECRET", "secret-test-minimal-tiga-puluh-dua-karakter");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("login berhasil memakai redirect relatif dan membuat session", async () => {
    const request = new Request("https://0.0.0.0:3000/api/auth/login", {
      method: "POST",
      body: new URLSearchParams({ username: "cs", password: "rahasia" }),
    });

    const response = await login(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/");
    expect(response.headers.get("set-cookie")).toContain("syarihub_cs_session=");
  });

  it("login gagal kembali ke form dengan redirect relatif", async () => {
    const request = new Request("https://0.0.0.0:3000/api/auth/login", {
      method: "POST",
      body: new URLSearchParams({ username: "cs", password: "salah" }),
    });

    const response = await login(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login?error=1");
  });

  it("logout kembali ke login dengan redirect relatif", async () => {
    const response = await logout();

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/login");
  });
});
