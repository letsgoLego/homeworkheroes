import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return { ...actual, useNavigate: () => navigateMock };
});

const signInMock = vi.fn();
const signUpMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...a: unknown[]) => signInMock(...a),
      signUp: (...a: unknown[]) => signUpMock(...a),
    },
  },
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn() } },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import AuthPage from "@/pages/AuthPage";
import ChildLoginPage from "@/pages/ChildLoginPage";

const renderAuth = () =>
  render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>
  );

const renderChild = () =>
  render(
    <MemoryRouter>
      <ChildLoginPage />
    </MemoryRouter>
  );

beforeEach(() => {
  navigateMock.mockReset();
  signInMock.mockReset();
  signUpMock.mockReset();
  localStorage.clear();
});

describe("AuthPage", () => {
  const submitButton = () =>
    document.querySelector('button[type="submit"]') as HTMLButtonElement;

  it("signs in existing user and navigates to /", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    renderAuth();
    // default view is signup — switch to login first
    await user.click(screen.getByRole("button", { name: /^Logga in$/i }));
    await user.type(screen.getByPlaceholderText(/du@exempel/i), "p@x.se");
    await user.type(screen.getByPlaceholderText(/••••••••/i), "secret123");
    await user.click(submitButton());
    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        email: "p@x.se",
        password: "secret123",
      });
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });

  it("creates a new account with active session and navigates to /onboarding", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue({
      data: { user: { id: "u2" }, session: { access_token: "t" } },
      error: null,
    });
    renderAuth();
    // signup is the default view
    await user.type(screen.getByPlaceholderText(/du@exempel/i), "n@x.se");
    await user.type(screen.getByPlaceholderText(/••••••••/i), "secret123");
    await user.click(submitButton());
    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("shows 'check inbox' screen when signup requires email confirmation", async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValue({
      data: { user: { id: "u3" }, session: null },
      error: null,
    });
    renderAuth();
    await user.type(screen.getByPlaceholderText(/du@exempel/i), "v@x.se");
    await user.type(screen.getByPlaceholderText(/••••••••/i), "secret123");
    await user.click(submitButton());
    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalled();
      expect(screen.getByText(/Kolla din inkorg/i)).toBeInTheDocument();
    });
    expect(navigateMock).not.toHaveBeenCalledWith("/onboarding");
  });

  it("rejects too-short password", async () => {
    const user = userEvent.setup();
    renderAuth();
    await user.type(screen.getByPlaceholderText(/du@exempel/i), "a@b.se");
    await user.type(screen.getByPlaceholderText(/••••••••/i), "123");
    await user.click(submitButton());
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("shows opt-in dialog on invalid credentials and creates account on confirm", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });
    signUpMock.mockResolvedValue({
      data: { user: { id: "u4" }, session: { access_token: "t" } },
      error: null,
    });
    renderAuth();
    await user.click(screen.getByRole("button", { name: /^Logga in$/i }));
    await user.type(screen.getByPlaceholderText(/du@exempel/i), "new@x.se");
    await user.type(screen.getByPlaceholderText(/••••••••/i), "secret123");
    await user.click(submitButton());
    const createBtn = await screen.findByRole("button", { name: /^Skapa konto$/i });
    await user.click(createBtn);
    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith(
        expect.objectContaining({ email: "new@x.se", password: "secret123" })
      );
      expect(navigateMock).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("opt-in create with email confirmation required shows inbox screen", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });
    signUpMock.mockResolvedValue({
      data: { user: { id: "u5" }, session: null },
      error: null,
    });
    renderAuth();
    await user.click(screen.getByRole("button", { name: /^Logga in$/i }));
    await user.type(screen.getByPlaceholderText(/du@exempel/i), "new2@x.se");
    await user.type(screen.getByPlaceholderText(/••••••••/i), "secret123");
    await user.click(submitButton());
    const createBtn = await screen.findByRole("button", { name: /^Skapa konto$/i });
    await user.click(createBtn);
    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalled();
      expect(screen.getByText(/Kolla din inkorg/i)).toBeInTheDocument();
    });
  });
});

describe("ChildLoginPage", () => {
  it("logs in child using username@laxhjalpen.child and navigates to /", async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValue({ data: { user: { id: "c1" } }, error: null });
    renderChild();
    await user.type(screen.getByPlaceholderText(/ditt_användarnamn/i), "tuva");
    await user.type(screen.getByPlaceholderText(/••••••••/i), "secret123");
    await user.click(screen.getByRole("button", { name: /^Logga in$/i }));
    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        email: "tuva@laxhjalpen.child",
        password: "secret123",
      });
      expect(navigateMock).toHaveBeenCalledWith("/");
      expect(localStorage.getItem("lastChildUsername")).toBe("tuva");
    });
  });
});
