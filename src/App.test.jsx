import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("StudySpark AI", () => {
  it("renders the main heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /turn messy notes into a clear study guide/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the notes input", () => {
    render(<App />);

    expect(screen.getByLabelText(/study notes/i)).toBeInTheDocument();
  });

  it("renders the generate button", () => {
    render(<App />);

    expect(
      screen.getByRole("button", {
        name: /generate study guide/i,
      })
    ).toBeInTheDocument();
  });
});