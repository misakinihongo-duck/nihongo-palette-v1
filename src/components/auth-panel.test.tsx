import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthPanel } from "./auth-panel";

describe("AuthPanel", () => {
  it("shows setup guidance before Supabase is configured", () => {
    render(<AuthPanel isConfigured={false} />);

    expect(screen.getByText("Supabase環境変数が未設定です")).toBeInTheDocument();
  });

  it("shows Google and Email auth controls when configured", () => {
    render(<AuthPanel isConfigured />);

    expect(screen.getByRole("button", { name: "Googleで続ける" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Emailで接続確認" })).toBeInTheDocument();
  });
});
