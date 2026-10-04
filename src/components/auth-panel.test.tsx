import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthPanel } from "./auth-panel";

describe("AuthPanel", () => {
  it("shows a simple preparation message before Supabase is configured", () => {
    render(<AuthPanel isConfigured={false} />);

    expect(screen.getByText("ログインの準備中です")).toBeInTheDocument();
  });

  it("shows Google as the primary auth control and keeps Email as a secondary option", () => {
    render(<AuthPanel isConfigured />);

    expect(screen.getByRole("button", { name: "Googleで続ける" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "メールアドレスで続ける" })).toBeInTheDocument();
  });
});
