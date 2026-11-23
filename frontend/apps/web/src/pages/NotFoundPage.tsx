import { Link } from "react-router-dom";
import { Button, EmptyState } from "@systrol/ui";

export function NotFoundPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", padding: "var(--space-6)" }}>
      <EmptyState
        title="404 - Page Not Found"
        description="The page you requested could not be found."
        action={
          <Link to="/">
            <Button variant="primary">Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
