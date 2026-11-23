import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./FormField";
import { Input } from "./Input";
import { NumberInput } from "./NumberInput";
import { PasswordInput } from "./PasswordInput";
import { Textarea } from "./Textarea";

describe("Input components", () => {
  it("renders FormField with connected label, hint and error", () => {
    render(
      <FormField id="test-email" label="Email Address" required hint="We never share email" error="Invalid email">
        <Input id="test-email" error />
      </FormField>
    );

    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("toggles password visibility in PasswordInput", () => {
    render(<PasswordInput placeholder="Enter password" />);
    const input = screen.getByPlaceholderText("Enter password");
    const toggleBtn = screen.getByRole("button", { name: "Show password" });

    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(toggleBtn);
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  });

  it("renders Textarea and accepts text", () => {
    render(<Textarea placeholder="Notes" />);
    const textarea = screen.getByPlaceholderText("Notes");
    fireEvent.change(textarea, { target: { value: "Hello world" } });
    expect(textarea).toHaveValue("Hello world");
  });

  it("renders NumberInput with number type", () => {
    render(<NumberInput placeholder="Hours" min={0} max={24} />);
    const input = screen.getByPlaceholderText("Hours");
    expect(input).toHaveAttribute("type", "number");
  });
});
