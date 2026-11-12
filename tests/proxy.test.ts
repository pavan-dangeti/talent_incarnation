import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "../src/proxy";

const request = (path: string, cookie?: string) =>
  new NextRequest(`https://example.test${path}`, cookie ? { headers: { cookie } } : undefined);

describe("proxy", () => {
  it("redirects requests without a session cookie to the home page", () => {
    for (const path of ["/assessment", "/assessment/123", "/chat", "/profile"]) {
      const res = proxy(request(path));
      expect(res.status, path).toBe(307);
      expect(res.headers.get("location"), path).toBe("https://example.test/");
    }
  });

  it("does not treat unrelated cookies as a session", () => {
    expect(proxy(request("/profile", "theme=dark; other=1")).status).toBe(307);
  });

  it("lets requests with a session cookie through to the page, which validates it", () => {
    for (const name of ["authjs.session-token", "__Secure-authjs.session-token"]) {
      const res = proxy(request("/profile", `${name}=anything`));
      expect(res.headers.get("location")).toBeNull();
      expect(res.headers.get("x-middleware-next")).toBe("1");
    }
  });

  it("covers every protected route and nothing public", () => {
    expect(config.matcher).toEqual(["/assessment/:path*", "/chat/:path*", "/profile/:path*"]);
  });
});
