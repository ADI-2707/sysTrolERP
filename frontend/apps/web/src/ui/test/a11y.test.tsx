import { render, screen, fireEvent } from "@testing-library/react";
import axe from "axe-core";
import { describe, it, expect, vi } from "vitest";
import { Button, IconButton } from "../components/Button";
import { Input, PasswordInput, NumberInput, Textarea, FormField } from "../components/Input";
import { Checkbox, Radio, RadioGroup, Switch } from "../components/Selection";
import { Select, Combobox } from "../components/Select";
import { DropdownMenu, Tooltip, Popover } from "../components/Overlays";
import { Modal, ConfirmDialog } from "../components/Modal";
import { Breadcrumbs, Tabs } from "../components/Navigation";
import { Table } from "../components/Table";
import { DataGrid } from "../components/DataGrid";
import { Stepper, type StepperItem } from "../components/Stepper";
import { Sidebar, Topbar } from "../components/Layout";
import { IconSearch } from "../icons";

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

describe("Component Accessibility and Interactions", () => {
  describe("Button components", () => {
    it("passes axe checks and responds to click", async () => {
      const handleClick = vi.fn();
      const { container } = render(
        <div>
          <Button variant="primary" onClick={handleClick}>
            Save Record
          </Button>
          <IconButton
            icon={<IconSearch size={16} />}
            label="Search Records"
            onClick={handleClick}
          />
        </div>
      );
      await expectNoAxeViolations(container);
      fireEvent.click(screen.getByRole("button", { name: "Save Record" }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("handles loading and disabled states", async () => {
      const { container } = render(
        <div>
          <Button loading>Loading Action</Button>
          <Button disabled>Disabled Action</Button>
        </div>
      );
      await expectNoAxeViolations(container);
      expect(screen.getByRole("button", { name: "Loading Action" })).toHaveAttribute(
        "aria-busy",
        "true"
      );
      expect(screen.getByRole("button", { name: "Disabled Action" })).toBeDisabled();
    });
  });

  describe("Form Input components", () => {
    it("passes axe checks for labeled fields", async () => {
      const { container } = render(
        <form>
          <FormField id="email-input" label="Email Address">
            <Input id="email-input" type="email" placeholder="user@company.com" />
          </FormField>
          <FormField id="password-input" label="Secret Password">
            <PasswordInput id="password-input" placeholder="Password" />
          </FormField>
          <FormField id="hours-input" label="Work Hours">
            <NumberInput id="hours-input" min={0} max={24} defaultValue={8} />
          </FormField>
          <FormField id="notes-input" label="Task Notes">
            <Textarea id="notes-input" placeholder="Notes" />
          </FormField>
        </form>
      );
      await expectNoAxeViolations(container);
    });
  });

  describe("Selection controls", () => {
    it("passes axe checks and toggles states", async () => {
      const handleCheck = vi.fn();
      const handleSwitch = vi.fn();
      const handleRadio = vi.fn();

      const { container } = render(
        <div>
          <Checkbox label="Confirm Overtime" checked={false} onChange={handleCheck} />
          <Switch label="Notify Manager" checked={false} onChange={handleSwitch} />
          <RadioGroup name="priority" value="med" onChange={handleRadio}>
            <Radio value="low" label="Low Priority" />
            <Radio value="med" label="Medium Priority" />
          </RadioGroup>
        </div>
      );

      await expectNoAxeViolations(container);
      fireEvent.click(screen.getByLabelText("Confirm Overtime"));
      expect(handleCheck).toHaveBeenCalledWith(true);
      fireEvent.click(screen.getByLabelText("Notify Manager"));
      expect(handleSwitch).toHaveBeenCalledWith(true);
    });
  });

  describe("Select and Combobox", () => {
    it("passes axe checks and allows selection", async () => {
      const handleSelect = vi.fn();
      const options = [
        { value: "p1", label: "Project Alpha" },
        { value: "p2", label: "Project Beta" },
      ];

      const { container } = render(
        <div>
          <Select
            aria-label="Select Project"
            options={options}
            value="p1"
            onChange={handleSelect}
          />
          <Combobox
            aria-label="Filter Projects"
            options={options}
            value="p1"
            onChange={handleSelect}
          />
        </div>
      );

      await expectNoAxeViolations(container);
    });
  });

  describe("Overlay and Dialog components", () => {
    it("passes axe checks for menus and tooltips", async () => {
      const { container } = render(
        <div>
          <DropdownMenu
            trigger={<Button>Options</Button>}
            items={[{ key: "edit", label: "Edit Entry" }]}
          />
          <Tooltip content="Helper hint">
            <Button>Hinted Action</Button>
          </Tooltip>
          <Popover
            trigger={<Button>Pop</Button>}
            content={<div>Popover details</div>}
          />
        </div>
      );
      await expectNoAxeViolations(container);
    });

    it("passes axe checks for modal dialogs", async () => {
      const { container } = render(
        <div>
          <Modal isOpen title="Edit Entry" onClose={() => {}}>
            <div>Modal dialog content</div>
          </Modal>
          <ConfirmDialog
            isOpen
            title="Confirm Delete"
            description="Proceed with delete?"
            onClose={() => {}}
            onConfirm={() => {}}
          />
        </div>
      );
      await expectNoAxeViolations(container);
    });
  });

  describe("Navigation components", () => {
    it("passes axe checks for breadcrumbs and tabs", async () => {
      const { container } = render(
        <div>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Timesheets", isCurrent: true },
            ]}
          />
          <Tabs
            aria-label="Section Tabs"
            activeTab="tab1"
            onChange={() => {}}
            tabs={[
              { id: "tab1", label: "First Tab" },
              { id: "tab2", label: "Second Tab" },
            ]}
          />
          <div role="tabpanel" id="tabpanel-tab1" aria-labelledby="tab-tab1">
            First Tab Content
          </div>
          <div role="tabpanel" id="tabpanel-tab2" aria-labelledby="tab-tab2" hidden>
            Second Tab Content
          </div>
        </div>
      );
      await expectNoAxeViolations(container);
    });
  });

  describe("Table and DataGrid", () => {
    it("passes axe checks for data displays", async () => {
      const tableData = [{ id: "1", name: "Alpha", status: "Active" }];
      const tableCols = [
        { key: "name", header: "Name", render: (r: { name: string }) => r.name },
        { key: "status", header: "Status", render: (r: { status: string }) => r.status },
      ];

      const gridData = [{ id: "1", colA: "Data 1", colB: "Data 2" }];
      const gridCols = [
        { id: "colA", header: "Col A", renderCell: (r: { colA: string }) => r.colA },
        { id: "colB", header: "Col B", renderCell: (r: { colB: string }) => r.colB },
      ];

      const { container } = render(
        <div>
          <Table data={tableData} columns={tableCols} rowKey={(r) => r.id} />
          <DataGrid rows={gridData} columns={gridCols} rowKey={(r) => r.id} />
        </div>
      );
      await expectNoAxeViolations(container);
    });
  });

  describe("Stepper component", () => {
    it("passes axe checks with ordered progression", async () => {
      const steps: StepperItem[] = [
        { id: "1", title: "Enquiry", status: "COMPLETED", position: 1 },
        { id: "2", title: "Procurement", status: "IN_PROGRESS", position: 2 },
        { id: "3", title: "Manufacturing", status: "NOT_STARTED", position: 3 },
      ];

      const { container } = render(<Stepper items={steps} />);
      await expectNoAxeViolations(container);
    });
  });

  describe("Layout landmarks", () => {
    it("passes axe checks for sidebar and topbar", async () => {
      const { container } = render(
        <div>
          <Topbar
            breadcrumbs={<span>Navigation</span>}
            actions={<Button>Action</Button>}
          />
          <Sidebar
            logo={<span>Brand</span>}
            items={[
              {
                key: "home",
                label: "Dashboard",
                icon: <IconSearch size={16} />,
                isActive: true,
              },
            ]}
          />
        </div>
      );
      await expectNoAxeViolations(container);
    });
  });
});
