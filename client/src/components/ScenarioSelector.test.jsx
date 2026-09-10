import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ScenarioSelector from "./ScenarioSelector.jsx";

describe("ScenarioSelector Component", () => {
  it("renders all three scenario option cards", () => {
    render(<ScenarioSelector selectedScenario="Balanced" />);
    expect(screen.getByTestId("scenario-selector")).toBeInTheDocument();
    expect(
      screen.getByTestId("scenario-card-conservative"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("scenario-card-balanced")).toBeInTheDocument();
    expect(screen.getByTestId("scenario-card-aggressive")).toBeInTheDocument();
  });

  it("indicates the active scenario with an Active badge", () => {
    render(<ScenarioSelector selectedScenario="Balanced" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Balanced Scenario Summary")).toBeInTheDocument();
  });

  it("triggers onSelectScenario when a card is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <ScenarioSelector
        selectedScenario="Balanced"
        onSelectScenario={handleSelect}
      />,
    );

    const aggCard = screen.getByTestId("scenario-card-aggressive");
    fireEvent.click(aggCard);

    expect(handleSelect).toHaveBeenCalledWith("Aggressive");
  });
});
