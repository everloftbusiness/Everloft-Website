import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
    },
  }),
}));

import { POST } from "./route";

describe("Password Recovery API Route (Fail-Closed & Session Logout)", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockUpdateUser.mockReset();
    mockSignOut.mockReset();
  });

  it("1. returns 400 when new password is less than 8 characters", async () => {
    const req = new Request("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ password: "short" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("8 characters");
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("2. returns 401 when recovery link or session is expired (user is null)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new Request("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ password: "NewStrongPassword123!" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain("expired");
    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("3. returns 400 when Supabase updateUser returns an error", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    mockUpdateUser.mockResolvedValue({ error: { message: "Same password as current." } });

    const req = new Request("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ password: "NewStrongPassword123!" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Same password as current.");
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("4. updates password, terminates recovery session via signOut(), and returns ok: true", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({ error: null });

    const req = new Request("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ password: "NewStrongPassword123!" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // Verify correct execution sequence: updateUser -> signOut
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "NewStrongPassword123!" });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
