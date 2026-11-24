import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Table, type TableColumn } from "./Table";

interface TestRow {
  id: string;
  code: string;
  name: string;
}

describe("Table component", () => {
  const data: TestRow[] = [
    { id: "1", code: "PRJ-001", name: "Alpha Project" },
    { id: "2", code: "PRJ-002", name: "Beta Project" },
  ];

  const columns: TableColumn<TestRow>[] = [
    { key: "code", header: "Code", sortable: true },
    { key: "name", header: "Name", sortable: true },
  ];

  it("renders table columns and data rows", () => {
    render(<Table data={data} columns={columns} rowKey={(r) => r.id} />);

    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("PRJ-001")).toBeInTheDocument();
    expect(screen.getByText("Beta Project")).toBeInTheDocument();
  });

  it("triggers sort callback on sortable header click", () => {
    const handleSort = vi.fn();
    render(
      <Table
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        sortColumn="code"
        sortDirection="asc"
        onSort={handleSort}
      />
    );

    fireEvent.click(screen.getByText("Code"));
    expect(handleSort).toHaveBeenCalledWith("code", "desc");
  });

  it("renders loading state", () => {
    render(<Table data={[]} columns={columns} rowKey={(r) => r.id} loading />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("renders empty state message", () => {
    render(
      <Table
        data={[]}
        columns={columns}
        rowKey={(r) => r.id}
        emptyMessage="No projects available"
      />
    );
    expect(screen.getByText("No projects available")).toBeInTheDocument();
  });
});
