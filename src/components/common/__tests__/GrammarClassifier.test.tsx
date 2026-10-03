import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GrammarClassifier } from "../GrammarClassifier";

describe("GrammarClassifier Component", () => {
  it("should render all CEFR level options initially", () => {
    render(
      <GrammarClassifier
        level=""
        setLevel={vi.fn()}
        grammarTopic=""
        setGrammarTopic={vi.fn()}
        grammarLesson=""
        setGrammarLesson={vi.fn()}
      />
    );

    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("A2")).toBeInTheDocument();
    expect(screen.getByText("B1")).toBeInTheDocument();
    expect(screen.getByText("B2")).toBeInTheDocument();
    expect(screen.getByText("C1")).toBeInTheDocument();

    // Step 2 & 3 shouldn't be rendered before a level is selected
    expect(screen.queryByText(/Bước 2 — Chủ đề/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bước 3 — Bài học/i)).not.toBeInTheDocument();
  });

  it("should call setLevel and reset topic/lesson when a level is selected", () => {
    const setLevel = vi.fn();
    const setGrammarTopic = vi.fn();
    const setGrammarLesson = vi.fn();

    render(
      <GrammarClassifier
        level=""
        setLevel={setLevel}
        grammarTopic=""
        setGrammarTopic={setGrammarTopic}
        grammarLesson=""
        setGrammarLesson={setGrammarLesson}
      />
    );

    fireEvent.click(screen.getByText("A1"));

    expect(setLevel).toHaveBeenCalledWith("a1");
    expect(setGrammarTopic).toHaveBeenCalledWith("");
    expect(setGrammarLesson).toHaveBeenCalledWith("");
  });

  it("should render Step 2 (Topics) when level is selected", () => {
    const setGrammarTopic = vi.fn();

    render(
      <GrammarClassifier
        level="a1"
        setLevel={vi.fn()}
        grammarTopic=""
        setGrammarTopic={setGrammarTopic}
        grammarLesson=""
        setGrammarLesson={vi.fn()}
      />
    );

    expect(screen.getByText(/Bước 2 — Chủ đề/i)).toBeInTheDocument();
    // Tenses is available in A1
    const tensesButton = screen.getByRole("button", { name: /Tenses/i });
    expect(tensesButton).toBeInTheDocument();

    fireEvent.click(tensesButton);
    expect(setGrammarTopic).toHaveBeenCalledWith("tenses");
  });

  it("should render Step 3 (Lessons) and summary when level and topic are selected", () => {
    const setGrammarLesson = vi.fn();

    render(
      <GrammarClassifier
        level="a1"
        setLevel={vi.fn()}
        grammarTopic="tenses"
        setGrammarTopic={vi.fn()}
        grammarLesson=""
        setGrammarLesson={setGrammarLesson}
      />
    );

    expect(screen.getByText(/Bước 3 — Bài học/i)).toBeInTheDocument();
    const psButton = screen.getByRole("button", { name: "Present Simple" });
    expect(psButton).toBeInTheDocument();

    fireEvent.click(psButton);
    expect(setGrammarLesson).toHaveBeenCalledWith("present-simple");
  });

  it("should allow clearing selection with the deselect button", () => {
    const setLevel = vi.fn();
    const setGrammarTopic = vi.fn();
    const setGrammarLesson = vi.fn();

    render(
      <GrammarClassifier
        level="a1"
        setLevel={setLevel}
        grammarTopic="tenses"
        setGrammarTopic={setGrammarTopic}
        grammarLesson="present-simple"
        setGrammarLesson={setGrammarLesson}
      />
    );

    const clearButton = screen.getByText(/Bỏ chọn/i);
    fireEvent.click(clearButton);

    expect(setLevel).toHaveBeenCalledWith("");
    expect(setGrammarTopic).toHaveBeenCalledWith("");
    expect(setGrammarLesson).toHaveBeenCalledWith("");
  });
});
