import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SampleText } from "./SampleText";

describe("SampleText", () => {
  it("renders children with css module class", () => {
    render(<SampleText>Hello UI</SampleText>);
    expect(screen.getByText("Hello UI")).toBeInTheDocument();
  });
});
