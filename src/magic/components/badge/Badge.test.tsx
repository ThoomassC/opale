/* Vendored from react-magic-ui — MIT, Copyright (c) 2025 tweeedlex.
   https://github.com/tweeedlex/react-magic-ui
   Kept byte-faithful on purpose: this file is NOT covered by Opale's colour
   contract and is not styled with Opale's tokens. See src/magic/README.md. */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Badge from "./Badge";

describe("Badge component", () => {
  it("renders children text content", () => {
    render(<Badge>active</Badge>);
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    render(<Badge>default</Badge>);
    const badge = screen.getByText("default");
    expect(badge.className).toContain("badge");
  });

  it("applies specific variant classes", () => {
    render(<Badge variant="positive">done</Badge>);
    const badge = screen.getByText("done");
    expect(badge.className).toContain("bg-positive");
  });

  it("renders leading and trailing icons", () => {
    render(
      <Badge
        leadingIcon={<span data-testid="leading">L</span>}
        trailingIcon={<span data-testid="trailing">R</span>}
      >
        icon badge
      </Badge>,
    );

    expect(screen.getByTestId("leading")).toBeInTheDocument();
    expect(screen.getByTestId("trailing")).toBeInTheDocument();
  });
});

