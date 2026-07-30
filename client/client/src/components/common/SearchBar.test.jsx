import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SearchBar from "./SearchBar";

describe("SearchBar Component", () => {
  it("renders with placeholder", () => {
    render(
      <SearchBar
        placeholder="Search accounts..."
        value=""
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByPlaceholderText(/search accounts.../i),
    ).toBeInTheDocument();
  });

  it("calls onChange when input changes", () => {
    const handleChange = vi.fn();
    render(
      <SearchBar placeholder="Search..." value="" onChange={handleChange} />,
    );
    fireEvent.change(screen.getByPlaceholderText(/search.../i), {
      target: { value: "checking" },
    });
    expect(handleChange).toHaveBeenCalledWith("checking");
  });
});
