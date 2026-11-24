import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "./Combobox";
import { Select } from "./Select";

describe("Select and Combobox components", () => {
  const options = [
    { value: "p1", label: "Project Alpha" },
    { value: "p2", label: "Project Beta" },
    { value: "p3", label: "Project Gamma" },
  ];

  it("opens Select on click and selects an option", () => {
    const handleChange = vi.fn();
    render(<Select options={options} value="p1" onChange={handleChange} />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Project Alpha");

    fireEvent.click(trigger);
    const betaOption = screen.getByRole("option", { name: "Project Beta" });
    fireEvent.click(betaOption);

    expect(handleChange).toHaveBeenCalledWith("p2");
  });

  it("filters items in Combobox and selects matching option", () => {
    const handleChange = vi.fn();
    render(<Combobox options={options} onChange={handleChange} />);

    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText("Type to filter...");
    fireEvent.change(searchInput, { target: { value: "gamma" } });

    expect(screen.queryByText("Project Alpha")).not.toBeInTheDocument();
    const gammaOption = screen.getByText("Project Gamma");
    expect(gammaOption).toBeInTheDocument();

    fireEvent.click(gammaOption);
    expect(handleChange).toHaveBeenCalledWith("p3");
  });
});
