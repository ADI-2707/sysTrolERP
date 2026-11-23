import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";
import { Radio, RadioGroup } from "./Radio";
import { Switch } from "./Switch";

describe("Selection components", () => {
  it("toggles Checkbox on click", () => {
    const handleChange = vi.fn();
    render(<Checkbox label="Accept terms" checked={false} onChange={handleChange} />);
    const box = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(box).not.toBeChecked();
    fireEvent.click(box);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("selects Radio option within RadioGroup", () => {
    const handleChange = vi.fn();
    render(
      <RadioGroup value="admin" onChange={handleChange}>
        <Radio value="admin" label="Admin" />
        <Radio value="employee" label="Employee" />
      </RadioGroup>
    );

    const empRadio = screen.getByRole("radio", { name: "Employee" });
    expect(screen.getByRole("radio", { name: "Admin" })).toBeChecked();
    expect(empRadio).not.toBeChecked();

    fireEvent.click(empRadio);
    expect(handleChange).toHaveBeenCalledWith("employee");
  });

  it("toggles Switch on click", () => {
    const handleChange = vi.fn();
    render(<Switch label="Dark mode" checked={false} onChange={handleChange} />);
    const sw = screen.getByRole("switch", { name: "Dark mode" });
    expect(sw).not.toBeChecked();
    fireEvent.click(sw);
    expect(handleChange).toHaveBeenCalledWith(true);
  });
});
