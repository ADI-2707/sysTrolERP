import { useState, type ChangeEvent } from "react";
import {
  ThemeProvider,
  ThemeToggle,
  Button,
  IconButton,
  Input,
  PasswordInput,
  Textarea,
  NumberInput,
  FormField,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Select,
  Combobox,
  DropdownMenu,
  Tooltip,
  Popover,
  Modal,
  ConfirmDialog,
  Drawer,
  ToastProvider,
  useToast,
  Badge,
  Chip,
  Avatar,
  Card,
  Skeleton,
  Spinner,
  ProgressBar,
  ProgressRing,
  EmptyState,
  Breadcrumbs,
  Tabs,
  Table,
  type TableColumn,
  DataGrid,
  type DataGridColumn,
  Stepper,
  type StepperItem,
  Sidebar,
  Topbar,
  IconCalendar,
  IconCheck,
  IconLock,
  IconSearch,
  IconUser,
  IconSun,
  IconMoon,
} from "@systrol/ui";
import styles from "./ComponentGallery.module.css";

interface GridRowData {
  id: string;
  project: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
  total: number;
}

interface UserRowData {
  code: string;
  name: string;
  role: string;
}

function InteractiveShowcase() {
  const [text, setText] = useState("");
  const [password, setPassword] = useState("");
  const [area, setArea] = useState("");
  const [numVal, setNumVal] = useState("8");
  const [checked, setChecked] = useState(false);
  const [radioVal, setRadioVal] = useState("opt1");
  const [switchVal, setSwitchVal] = useState(false);
  const [selectVal, setSelectVal] = useState("a");
  const [comboVal, setComboVal] = useState("p1");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const toastCtx = useToast();

  const stepperItems: StepperItem[] = [
    { id: "1", title: "Enquiry", status: "COMPLETED", position: 1 },
    { id: "2", title: "Procurement", status: "IN_PROGRESS", position: 2 },
    { id: "3", title: "Manufacturing", status: "NOT_STARTED", position: 3 },
  ];

  const gridRows: GridRowData[] = [
    {
      id: "row-1",
      project: "Project Alpha",
      mon: 8.0,
      tue: 8.0,
      wed: 8.0,
      thu: 8.0,
      fri: 8.0,
      sat: 0.0,
      sun: 0.0,
      total: 40.0,
    },
  ];

  const gridCols: DataGridColumn<GridRowData>[] = [
    {
      id: "project",
      header: "Project",
      width: 180,
      renderCell: (r: GridRowData) => r.project,
    },
    { id: "mon", header: "Mon", renderCell: (r: GridRowData) => r.mon.toFixed(1) },
    { id: "tue", header: "Tue", renderCell: (r: GridRowData) => r.tue.toFixed(1) },
    { id: "wed", header: "Wed", renderCell: (r: GridRowData) => r.wed.toFixed(1) },
    { id: "thu", header: "Thu", renderCell: (r: GridRowData) => r.thu.toFixed(1) },
    { id: "fri", header: "Fri", renderCell: (r: GridRowData) => r.fri.toFixed(1) },
    { id: "sat", header: "Sat", renderCell: (r: GridRowData) => r.sat.toFixed(1) },
    { id: "sun", header: "Sun", renderCell: (r: GridRowData) => r.sun.toFixed(1) },
    { id: "total", header: "Total", renderCell: (r: GridRowData) => r.total.toFixed(1) },
  ];

  const tableData: UserRowData[] = [
    { code: "SYS-0001", name: "Admin User", role: "ADMIN" },
    { code: "SYS-0002", name: "Engineer One", role: "EMPLOYEE" },
  ];

  const tableColumns: TableColumn<UserRowData>[] = [
    { key: "code", header: "Code", render: (r: UserRowData) => r.code },
    { key: "name", header: "Name", render: (r: UserRowData) => r.name },
    { key: "role", header: "Role", render: (r: UserRowData) => r.role },
  ];

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Interactive Components</h2>

      <div className={styles.row}>
        <Button variant="primary" onClick={() => toastCtx.toast.success("Action succeeded!")}>
          Primary Toast
        </Button>
        <Button variant="secondary" onClick={() => toastCtx.toast.error("Something went wrong")}>
          Secondary Toast
        </Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          Open Confirm Modal
        </Button>
        <Button variant="ghost" onClick={() => setModalOpen(true)}>
          Open Regular Modal
        </Button>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
          Open Drawer
        </Button>
        <IconButton
          icon={<IconSearch size={16} />}
          label="Search items"
          variant="secondary"
        />
      </div>

      <div className={styles.row}>
        <FormField label="Standard Input">
          <Input
            value={text}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
            placeholder="Type here..."
          />
        </FormField>
        <FormField label="Password Input">
          <PasswordInput
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="Password..."
          />
        </FormField>
        <FormField label="Number Input">
          <NumberInput
            value={numVal}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNumVal(e.target.value)}
            min={0}
            max={24}
          />
        </FormField>
        <FormField label="Notes">
          <Textarea
            value={area}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setArea(e.target.value)}
            placeholder="Additional notes"
          />
        </FormField>
      </div>

      <div className={styles.row}>
        <Checkbox
          label="Accept Terms"
          checked={checked}
          onChange={(newChecked: boolean) => setChecked(newChecked)}
        />
        <Switch
          label="Auto Submit"
          checked={switchVal}
          onChange={(val: boolean) => setSwitchVal(val)}
        />
        <RadioGroup
          name="gallery-radio"
          value={radioVal}
          onChange={setRadioVal}
        >
          <Radio value="opt1" label="Option 1" />
          <Radio value="opt2" label="Option 2" />
        </RadioGroup>
      </div>

      <div className={styles.row}>
        <FormField label="Status">
          <Select
            value={selectVal}
            onChange={setSelectVal}
            options={[
              { value: "a", label: "Active" },
              { value: "p", label: "Pending" },
              { value: "x", label: "Archived" },
            ]}
          />
        </FormField>
        <FormField label="Project">
          <Combobox
            value={comboVal}
            onChange={setComboVal}
            options={[
              { value: "p1", label: "Project Alpha" },
              { value: "p2", label: "Project Beta" },
            ]}
          />
        </FormField>
      </div>

      <div className={styles.row}>
        <Tooltip content="Tooltip helper text">
          <Button variant="secondary">Hover for Tooltip</Button>
        </Tooltip>
        <Popover
          trigger={<Button variant="secondary">Open Popover</Button>}
          content={<div style={{ padding: "8px" }}>Popover Content Details</div>}
        />
        <DropdownMenu
          trigger={<Button variant="secondary">Actions Menu</Button>}
          items={[
            { key: "edit", label: "Edit Row", onClick: () => toastCtx.toast.info("Edit selected") },
            { key: "del", label: "Delete Row", onClick: () => toastCtx.toast.warning("Delete selected") },
          ]}
        />
      </div>

      <div className={styles.row}>
        <Badge variant="default">Default</Badge>
        <Badge variant="success">Completed</Badge>
        <Badge variant="warning">In Progress</Badge>
        <Badge variant="danger">Returned</Badge>
        <Badge variant="info">Initiated</Badge>
        <Chip label="Filter Chip" />
        <Avatar name="Admin User" size="md" />
        <Spinner size="sm" />
        <ProgressBar value={60} max={100} />
        <ProgressRing value={75} size={32} />
      </div>

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Timesheets", href: "/timesheets" },
          { label: "Current Week", isCurrent: true },
        ]}
      />

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "details", label: "Details" },
          { id: "history", label: "History" },
        ]}
      />

      <Stepper items={stepperItems} />

      <Table
        data={tableData}
        columns={tableColumns}
        rowKey={(r: UserRowData) => r.code}
      />

      <DataGrid
        rows={gridRows}
        columns={gridCols}
        rowKey={(r: GridRowData) => r.id}
      />

      <Card title="Card Container" subtitle="Supporting descriptive text">
        <div>Card body content presenting structured project data.</div>
      </Card>

      <Skeleton width="100%" height="24px" />

      <EmptyState
        title="No timesheets"
        description="There are no entries for the selected week."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Information Dialog"
      >
        <p>This is standard modal dialog content.</p>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toastCtx.toast.success("Confirmed!");
        }}
        title="Confirm Action"
        description="Are you sure you want to proceed with this operation?"
      />

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Drawer Panel"
      >
        <p>Drawer content panel sliding from the side.</p>
      </Drawer>
    </div>
  );
}

export function ComponentGallery() {
  const iconList = [
    { name: "Calendar", Comp: IconCalendar },
    { name: "Check", Comp: IconCheck },
    { name: "Lock", Comp: IconLock },
    { name: "Search", Comp: IconSearch },
    { name: "User", Comp: IconUser },
    { name: "Sun", Comp: IconSun },
    { name: "Moon", Comp: IconMoon },
  ];

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className={styles.gallery} data-testid="component-gallery">
          <header className={styles.header}>
            <h1 className={styles.title}>sysTrol ERP Component Gallery</h1>
            <ThemeToggle />
          </header>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Layout Previews</h2>
            <Topbar
              breadcrumbs={
                <Breadcrumbs
                  items={[
                    { label: "Dashboard", href: "/" },
                    { label: "Gallery", isCurrent: true },
                  ]}
                />
              }
              actions={<ThemeToggle />}
              userMenu={<Avatar name="Admin User" size="sm" />}
            />
            <div style={{ height: "240px", border: "1px solid var(--color-border-subtle)" }}>
              <Sidebar
                logo={<strong>sysTrol</strong>}
                items={[
                  { key: "timesheet", label: "My Timesheet", icon: <IconCalendar size={18} />, isActive: true },
                  { key: "projects", label: "Projects", icon: <IconLock size={18} /> },
                ]}
                collapsed={false}
                onToggleCollapse={() => {}}
              />
            </div>
          </div>

          <div className={styles.themeSplit}>
            <div className={styles.themePane} data-theme="light">
              <h3>Light Theme Preview</h3>
              <InteractiveShowcase />
            </div>

            <div className={styles.themePane} data-theme="dark">
              <h3>Dark Theme Preview</h3>
              <InteractiveShowcase />
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Icon Showcase Sample</h2>
            <div className={styles.iconGrid}>
              {iconList.map(({ name, Comp }) => (
                <div key={name} className={styles.iconBox}>
                  <Comp size={24} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
