import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// --- Mocks ---------------------------------------------------------------

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return { ...actual, useNavigate: () => navigateMock };
});

const useFamilyMock = vi.fn();
vi.mock("@/hooks/useFamily", () => ({
  useFamily: () => useFamilyMock(),
}));

const rpcMock = vi.fn();
const getUserMock = vi.fn();
const fromMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: (...a: unknown[]) => getUserMock(...a) },
    rpc: (...a: unknown[]) => rpcMock(...a),
    from: (...a: unknown[]) => fromMock(...a),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import OnboardingPage from "@/pages/OnboardingPage";

const renderPage = () =>
  render(
    <MemoryRouter>
      <OnboardingPage />
    </MemoryRouter>
  );

beforeEach(() => {
  navigateMock.mockReset();
  useFamilyMock.mockReset();
  rpcMock.mockReset();
  getUserMock.mockReset();
  fromMock.mockReset();
});

// --- Guard tests ---------------------------------------------------------

describe("OnboardingPage guards", () => {
  it("redirects parents with existing role to /", async () => {
    useFamilyMock.mockReturnValue({
      userRole: "parent",
      loading: false,
      familyError: null,
    });
    renderPage();
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("redirects child accounts to / instead of showing onboarding", async () => {
    useFamilyMock.mockReturnValue({
      userRole: "child",
      loading: false,
      familyError: null,
    });
    renderPage();
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("shows onboarding when no role is set", async () => {
    useFamilyMock.mockReturnValue({
      userRole: null,
      loading: false,
      familyError: null,
    });
    renderPage();
    expect(
      await screen.findByText(/Välkommen till Läxhjälpen/i)
    ).toBeInTheDocument();
  });

  it("does not block onboarding when family lookup errors", async () => {
    useFamilyMock.mockReturnValue({
      userRole: null,
      loading: true, // still loading...
      familyError: new Error("network down"),
    });
    renderPage();
    // Should bypass the spinner immediately because of the error.
    expect(
      await screen.findByText(/Välkommen till Läxhjälpen/i)
    ).toBeInTheDocument();
  });
});

// --- Step sequence tests -------------------------------------------------

describe("OnboardingPage step sequence", () => {
  beforeEach(() => {
    useFamilyMock.mockReturnValue({
      userRole: null,
      loading: false,
      familyError: null,
    });
  });

  it("create path: welcome → choice → create → children", async () => {
    const user = userEvent.setup();
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    rpcMock.mockResolvedValue({ data: "fam-123", error: null });

    renderPage();

    await user.click(screen.getByRole("button", { name: /Kom igång/i }));
    expect(
      await screen.findByText(/Hur vill du börja/i)
    ).toBeInTheDocument();

    await user.click(
      await screen.findByRole("button", { name: /Skapa ny familj/i })
    );
    expect(await screen.findByText(/Skapa din familj/i)).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/Familjen Svensson/i),
      "Familjen Test"
    );
    await user.click(screen.getByRole("button", { name: /Fortsätt/i }));

    expect(rpcMock).toHaveBeenCalledWith("create_family_with_role", {
      _family_name: "Familjen Test",
    });
    // Heading for the children step
    expect(
      await screen.findByRole("heading", { name: /Lägg till barn/i })
    ).toBeInTheDocument();
  });

  it("join path: welcome → choice → join (skips children step)", async () => {
    const user = userEvent.setup();
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    rpcMock.mockResolvedValue({
      data: [{ id: "fam-x", name: "Familjen X" }],
      error: null,
    });
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
        }),
      }),
      insert: () => Promise.resolve({ error: null }),
    });

    renderPage();

    await user.click(screen.getByRole("button", { name: /Kom igång/i }));
    await user.click(
      await screen.findByRole("button", { name: /Gå med i befintlig familj/i })
    );
    expect(
      await screen.findByRole("heading", { name: /Gå med i familj/i })
    ).toBeInTheDocument();

    // Should NOT show the children heading in the join branch
    expect(
      screen.queryByRole("heading", { name: /Lägg till barn/i })
    ).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/xxxxxxxx/i), "abcdef12");
    await user.click(
      screen.getByRole("button", { name: /Gå med i familjen/i })
    );

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith("lookup_family_by_invite_code", {
        code: "abcdef12",
      });
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });

  it("back button from create returns to choice step", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /Kom igång/i }));
    await user.click(
      await screen.findByRole("button", { name: /Skapa ny familj/i })
    );
    expect(await screen.findByText(/Skapa din familj/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Tillbaka/i }));
    expect(await screen.findByText(/Hur vill du börja/i)).toBeInTheDocument();
  });
});
