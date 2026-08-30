import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const validNotes =
  "Photosynthesis is the process by which plants convert sunlight into chemical energy using chlorophyll.";

const mockResult = {
  summary: "Plants convert sunlight into chemical energy.",
  keyPoints: [
    "Plants use sunlight.",
    "Chlorophyll absorbs light.",
    "Chemical energy is produced.",
  ],
  terms: [
    {
      term: "Photosynthesis",
      definition: "The process plants use to convert light into chemical energy.",
    },
  ],
  questions: [
    "What is photosynthesis?",
    "What role does chlorophyll play?",
    "What type of energy is produced?",
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StudySpark AI", () => {
  it("renders the main interface", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: /turn messy notes into a clear study guide/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/study notes/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /generate study guide/i,
      })
    ).toBeInTheDocument();
  });

  it("shows validation for empty input", () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /generate study guide/i,
      })
    );

    expect(
      screen.getByText(/please enter some study notes before generating/i)
    ).toBeInTheDocument();
  });

  it("shows validation for notes shorter than 30 characters", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/study notes/i), {
      target: {
        value: "Very short notes",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /generate study guide/i,
      })
    );

    expect(
      screen.getByText(/please enter at least 30 characters/i)
    ).toBeInTheDocument();
  });

  it("updates the character count", () => {
    render(<App />);

    const textarea = screen.getByLabelText(/study notes/i);

    fireEvent.change(textarea, {
      target: {
        value: "Hello world",
      },
    });

    expect(screen.getByText("11 characters")).toBeInTheDocument();
  });

  it("generates and displays a study guide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      })
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText(/study notes/i), {
      target: {
        value: validNotes,
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /generate study guide/i,
      })
    );

    expect(
      screen.getByText(/analyzing your notes/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Plants convert sunlight into chemical energy.")
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Photosynthesis")).toBeInTheDocument();

    expect(
      screen.getByText("What is photosynthesis?")
    ).toBeInTheDocument();

    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("shows an API error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: "The AI service is currently unavailable.",
        }),
      })
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText(/study notes/i), {
      target: {
        value: validNotes,
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /generate study guide/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/the ai service is currently unavailable/i)
      ).toBeInTheDocument();
    });
  });

  it("handles a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error"))
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText(/study notes/i), {
      target: {
        value: validNotes,
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /generate study guide/i,
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("clears the study guide when Start Over is clicked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      })
    );

    render(<App />);

    const textarea = screen.getByLabelText(/study notes/i);

    fireEvent.change(textarea, {
      target: {
        value: validNotes,
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /generate study guide/i,
      })
    );

    await screen.findByText(
      "Plants convert sunlight into chemical energy."
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /start over/i,
      })
    );

    expect(textarea).toHaveValue("");

    expect(
      screen.getByText(/your results will appear here/i)
    ).toBeInTheDocument();
  });
});