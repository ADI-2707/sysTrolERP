import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataGrid, type DataGridColumn } from "./DataGrid";

interface GridRow {
  id: string;
  project: string;
  mon: number;
  tue: number;
}

describe("DataGrid primitives", () => {
  const rows: GridRow[] = [
    { id: "1", project: "Project Alpha", mon: 8, tue: 6 },
    { id: "2", project: "Project Beta", mon: 4, tue: 0 },
  ];

  const columns: DataGridColumn<GridRow>[] = [
    {
      id: "project",
      header: "Project",
      sticky: true,
      renderCell: (r) => r.project,
    },
    {
      id: "mon",
      header: "Mon",
      isEditable: () => true,
      renderCell: (r) => `${r.mon}h`,
      renderEdit: (r, _ri, _ci, onCommit) => (
        <input
          data-testid="edit-mon"
          defaultValue={r.mon}
          onBlur={(e) => onCommit(Number(e.target.value))}
        />
      ),
    },
    {
      id: "tue",
      header: "Tue",
      isEditable: () => true,
      renderCell: (r) => `${r.tue}h`,
    },
  ];

  it("renders grid with sticky header and cells", () => {
    render(<DataGrid rows={rows} columns={columns} rowKey={(r) => r.id} />);

    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("8h")).toBeInTheDocument();
  });

  it("navigates cell focus with arrow keys", () => {
    render(<DataGrid rows={rows} columns={columns} rowKey={(r) => r.id} />);

    const grid = screen.getByRole("grid");
    const firstCell = screen.getByText("Project Alpha");

    fireEvent.click(firstCell);
    expect(firstCell.closest("td")).toHaveAttribute("data-focused", "true");

    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(screen.getByText("8h").closest("td")).toHaveAttribute("data-focused", "true");
  });

  it("triggers edit mode on enter and commits value change", () => {
    const handleCellChange = vi.fn();
    render(
      <DataGrid
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        onCellChange={handleCellChange}
      />
    );

    const monCell = screen.getByText("8h");
    fireEvent.click(monCell);

    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "Enter" });

    const editor = screen.getByTestId("edit-mon");
    expect(editor).toBeInTheDocument();

    fireEvent.change(editor, { target: { value: "10" } });
    fireEvent.blur(editor);

    expect(handleCellChange).toHaveBeenCalledWith(0, "mon", 10);
  });
});
