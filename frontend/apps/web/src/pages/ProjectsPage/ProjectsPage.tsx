import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, EmptyState, Button, Pagination } from "@systrol/ui";
import { useAuth } from "../../auth";
import { fetchProjects, createProject, type CreateProjectPayload } from "../../api/projects";
import type { ProjectListItem } from "../../projects/types";
import { ProjectCard } from "../../projects/components/ProjectCard";
import { ProjectListToolbar } from "../../projects/components/ProjectListToolbar";
import { CreateProjectModal } from "../../projects/components/CreateProjectModal";
import { AssignmentMatrix } from "../../projects/components/AssignmentMatrix";
import { ProjectCardSkeleton } from "../../projects/components/ProjectCardSkeleton";
import styles from "./ProjectsPage.module.css";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin } = useAuth();
  const canManageProjects = isSuperAdmin || isAdmin;

  const [activeTab, setActiveTab] = useState<string>("projects");
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const handleCreateProject = async (payload: CreateProjectPayload) => {
    await createProject(payload);
    await loadProjects();
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setPage(1);
  };

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { search?: string; status?: string; is_active?: boolean; page?: number; page_size?: number } = {
        page,
        page_size: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (!canManageProjects) {
        params.is_active = true;
      }

      const res = await fetchProjects(params);
      setProjects(res.results || []);
      setTotalCount(res.count || 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load projects.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, canManageProjects, page]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const displayedProjects = useMemo(() => {
    if (!canManageProjects) {
      return projects.filter((p) => p.is_active && p.status !== "COMPLETED");
    }
    return projects;
  }, [projects, canManageProjects]);

  const tabs = useMemo(
    () => [
      { id: "projects", label: "Projects" },
      { id: "assignments", label: "Assignments" },
    ],
    []
  );

  const handleCardClick = (project: ProjectListItem) => {
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className={styles.pageContainer} data-testid="projects-page">
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Project Management</h1>
        <p className={styles.subtitle}>
          Track project engineering, manufacturing, trials, and step execution.
        </p>
      </div>

      {canManageProjects && (
        <div className={styles.tabsWrapper} data-testid="admin-projects-tabs">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            aria-label="Project Management Navigation"
          />
        </div>
      )}

      {activeTab === "projects" && (
        <div
          role="tabpanel"
          id="tabpanel-projects"
          aria-labelledby={canManageProjects ? "tab-projects" : undefined}
          className={styles.tabPanel}
        >
          <ProjectListToolbar
            search={search}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            canCreateProject={canManageProjects}
            onCreateProject={() => setIsCreateModalOpen(true)}
          />

          {error && (
            <div role="alert" className={styles.errorAlert} data-testid="projects-error">
              <span>{error}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={loadProjects}
                data-testid="projects-retry-btn"
              >
                Retry
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className={styles.projectsGrid} data-testid="projects-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : displayedProjects.length === 0 ? (
            <div data-testid="projects-empty-state">
              <EmptyState
                title="No projects found"
                description="No matching projects match your search or filter criteria."
              />
            </div>
          ) : (
            <>
              <div className={styles.projectsGrid} data-testid="projects-grid">
                {displayedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
              {totalCount > 0 && (
                <div className={styles.paginationFooter} data-testid="projects-pagination-footer">
                  <span className={styles.paginationMeta} data-testid="projects-pagination-meta">
                    Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} projects
                  </span>
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={totalCount}
                    onChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "assignments" && canManageProjects && (
        <div
          role="tabpanel"
          id="tabpanel-assignments"
          aria-labelledby="tab-assignments"
          className={styles.tabPanel}
          data-testid="assignments-matrix-panel"
        >
          <AssignmentMatrix />
        </div>
      )}

      {canManageProjects && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
}
