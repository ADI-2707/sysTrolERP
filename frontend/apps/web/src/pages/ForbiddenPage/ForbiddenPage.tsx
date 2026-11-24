import { Link } from "react-router-dom";
import { Button, EmptyState } from "@systrol/ui";

export function ForbiddenPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", padding: "var(--space-6)" }}>
      <EmptyState
        title="403 - Access Forbidden"
        description="You do not have permission to access this page."
        action={
          <Link to="/">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
