import { AcademyLogo } from "../AcademyLogo";
import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Download,
  LogOut,
  Menu,
  X,
  LoaderCircle,
  ArrowUpRight,
} from "lucide-react";
import { ApiError, request } from "../../services/api";
import type {
  AdminSession,
  ApplicationPage,
  ApplicationRecord,
  DashboardData,
} from "../../types/admin";
import { DOMAIN_NAMES, APPLICATION_STATUSES } from "../../../shared/domains";
import { AdminLogin } from "./AdminLogin";
import { ApplicationsTable } from "./ApplicationsTable";
import { ApplicantDetails } from "./ApplicantDetails";
interface Filters {
  search: string;
  domainId: string;
  status: string;
  from: string;
  to: string;
  sort: string;
  page: number;
}
const emptyFilters: Filters = {
  search: "",
  domainId: "",
  status: "",
  from: "",
  to: "",
  sort: "desc",
  page: 1,
};
function query(filters: Filters, all = false) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && (!all || key !== "page"))
      params.set(key, String(value));
  });
  return params.toString();
}
export default function AdminApp({ onHome }: { onHome: () => void }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"dashboard" | "applications">("dashboard");
  const [drawer, setDrawer] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [page, setPage] = useState<ApplicationPage | null>(null);
  const [detail, setDetail] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!drawer) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const sidebar = document.querySelector<HTMLElement>(".admin-sidebar");
    sidebar?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawer(false);
      }
      if (event.key === "Tab" && sidebar) {
        const items = Array.from(
          sidebar.querySelectorAll<HTMLElement>("button,a[href]"),
        );
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [drawer]);
  const handleError = useCallback((failure: unknown) => {
    setError(
      failure instanceof Error
        ? failure.message
        : "The request could not be completed.",
    );
    if (failure instanceof ApiError && failure.status === 401) {
      setSession({ authenticated: false, csrfToken: "" });
      setDashboard(null);
      setPage(null);
      setDetail(null);
      request<AdminSession>("/api/admin/session")
        .then(setSession)
        .catch(() => {});
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    request<AdminSession>("/api/admin/session", { signal: controller.signal })
      .then(setSession)
      .catch((failure) => {
        if (!controller.signal.aborted) handleError(failure);
      });
    return () => controller.abort();
  }, [handleError]);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 250);
    return () => clearTimeout(timer);
  }, [filters.search]);
  const qs = query({ ...filters, search: debouncedSearch });
  useEffect(() => {
    if (!session?.authenticated) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const url =
      view === "dashboard"
        ? "/api/admin/dashboard?"
        : "/api/admin/applications?";
    request<DashboardData | ApplicationPage>(url + qs, {
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (view === "dashboard") setDashboard(data as DashboardData);
        else setPage(data as ApplicationPage);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) handleError(failure);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [session?.authenticated, view, qs, revision, handleError]);
  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  }
  function navigate(next: "dashboard" | "applications", domainId = "") {
    setView(next);
    setFilters({ ...emptyFilters, domainId });
    setDetail(null);
    setDrawer(false);
  }
  async function openDetail(id: string) {
    setLoading(true);
    setError("");
    try {
      setDetail(
        await request<ApplicationRecord>(`/api/admin/applications/${id}`),
      );
      setView("applications");
    } catch (failure) {
      handleError(failure);
    } finally {
      setLoading(false);
    }
  }
  async function logout() {
    try {
      await request("/api/admin/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": session?.csrfToken ?? "" },
      });
      setDashboard(null);
      setPage(null);
      setDetail(null);
      setSession(await request<AdminSession>("/api/admin/session"));
      setFilters(emptyFilters);
    } catch (failure) {
      handleError(failure);
    }
  }
  if (!session)
    return (
      <main className="admin-loading">
        <LoaderCircle size={24} className="loading-spin" />
        <h1>Connecting to the local server</h1>
        {error && (
          <>
            <p role="alert">{error}</p>
            <button className="button" onClick={() => window.location.reload()}>
              Retry connection
            </button>
          </>
        )}
      </main>
    );
  if (!session.authenticated)
    return (
      <AdminLogin
        session={session}
        onLogin={(next) => {
          setSession(next);
          setError("");
        }}
        onHome={onHome}
      />
    );
  const exportQuery = query({ ...filters, search: debouncedSearch }, true);
  return (
    <div className="admin-shell">
      <aside
        className={`admin-sidebar ${drawer ? "is-open" : ""}`}
        aria-label="Administrator navigation"
      >
        <div className="admin-sidebar-brand">
          <AcademyLogo />
          <div>
            <strong>
              PFSA<span className="cyan">.</span>
            </strong>
            <small>ADMINISTRATOR</small>
          </div>
          <button
            className="admin-drawer-close"
            onClick={() => setDrawer(false)}
            aria-label="Close admin navigation"
          >
            <X size={20} />
          </button>
        </div>
        <span className="eyebrow">WORKSPACE</span>
        <nav aria-label="Admin workspace">
          <button
            className={view === "dashboard" ? "selected" : ""}
            onClick={() => navigate("dashboard")}
          >
            <LayoutDashboard size={17} />
            Dashboard
          </button>
          <button
            className={
              view === "applications" && !filters.domainId ? "selected" : ""
            }
            onClick={() => navigate("applications")}
          >
            <Users size={17} />
            All Registrations
          </button>
          <span className="sidebar-label">INTERNSHIP DOMAINS</span>
          {Object.entries(DOMAIN_NAMES).map(([id, title]) => (
            <button
              key={id}
              className={filters.domainId === id ? "selected" : ""}
              onClick={() => navigate("applications", id)}
            >
              <span className="sidebar-domain-dot" />
              {title}
            </button>
          ))}
          <a href="/api/admin/export/csv">
            <Download size={17} />
            Export CSV
          </a>
          <button onClick={logout}>
            <LogOut size={17} />
            Logout
          </button>
        </nav>
        <p className="admin-sidebar-note">
          Private applicant records.
          <br />
          Authorized academy access only.
        </p>
      </aside>
      {drawer && (
        <button
          className="admin-drawer-backdrop"
          onClick={() => setDrawer(false)}
          aria-label="Close admin navigation"
        />
      )}
      <main className="admin-main" inert={drawer}>
        <header className="admin-header">
          <button
            className="admin-menu-button"
            onClick={() => setDrawer(!drawer)}
            aria-expanded={drawer}
            aria-label="Open admin navigation"
          >
            <Menu size={22} />
          </button>
          <div>
            <div className="eyebrow">PFSA / APPLICATION MANAGEMENT</div>
            <h1>
              {detail
                ? "Applicant review"
                : view === "dashboard"
                  ? "Registration overview"
                  : filters.domainId
                    ? DOMAIN_NAMES[
                        filters.domainId as keyof typeof DOMAIN_NAMES
                      ]
                    : "All registrations"}
            </h1>
          </div>
          <button className="admin-text-button home-link" onClick={onHome}>
            View website <ArrowUpRight size={15} />
          </button>
        </header>
        {error && (
          <p role="alert" className="admin-alert">
            {error}
          </p>
        )}
        {detail ? (
          <ApplicantDetails
            key={detail.id}
            application={detail}
            csrfToken={session.csrfToken}
            onBack={() => {
              setDetail(null);
              setRevision((value) => value + 1);
            }}
            onUpdated={() => {
              setRevision((value) => value + 1);
              request<ApplicationRecord>(`/api/admin/applications/${detail.id}`)
                .then((updated) =>
                  setDetail((current) =>
                    current?.id === updated.id ? updated : current,
                  ),
                )
                .catch(() => {});
            }}
            onError={handleError}
          />
        ) : (
          <>
            <section
              className="admin-panel admin-filter-panel"
              aria-label="Registration filters"
            >
              <div className="admin-filters">
                {view === "applications" && (
                  <>
                    <label htmlFor="app-search">
                      Search applicants
                      <input
                        id="app-search"
                        type="search"
                        value={filters.search}
                        onChange={(event) =>
                          updateFilter("search", event.target.value)
                        }
                        placeholder="Name, email, or college"
                      />
                    </label>
                    <label htmlFor="app-domain">
                      Domain
                      <select
                        id="app-domain"
                        value={filters.domainId}
                        onChange={(event) =>
                          updateFilter("domainId", event.target.value)
                        }
                      >
                        <option value="">All domains</option>
                        {Object.entries(DOMAIN_NAMES).map(([id, title]) => (
                          <option key={id} value={id}>
                            {title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label htmlFor="app-status">
                      Status
                      <select
                        id="app-status"
                        value={filters.status}
                        onChange={(event) =>
                          updateFilter("status", event.target.value)
                        }
                      >
                        <option value="">All statuses</option>
                        {APPLICATION_STATUSES.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                <label htmlFor="from-date">
                  From date (UTC)
                  <input
                    id="from-date"
                    type="date"
                    value={filters.from}
                    onChange={(event) =>
                      updateFilter("from", event.target.value)
                    }
                  />
                </label>
                <label htmlFor="to-date">
                  To date (UTC)
                  <input
                    id="to-date"
                    type="date"
                    value={filters.to}
                    onChange={(event) => updateFilter("to", event.target.value)}
                  />
                </label>
                {view === "applications" && (
                  <label htmlFor="app-sort">
                    Registration date
                    <select
                      id="app-sort"
                      value={filters.sort}
                      onChange={(event) =>
                        updateFilter("sort", event.target.value)
                      }
                    >
                      <option value="desc">Newest first</option>
                      <option value="asc">Oldest first</option>
                    </select>
                  </label>
                )}
                <button
                  className="admin-text-button"
                  onClick={() => {
                    setFilters(emptyFilters);
                    setRevision((value) => value + 1);
                  }}
                >
                  Reset filters
                </button>
                <button
                  className="admin-text-button"
                  onClick={() => setRevision((value) => value + 1)}
                >
                  Refresh
                </button>
              </div>
            </section>
            {loading && (
              <p role="status" className="admin-fetching">
                <LoaderCircle className="loading-spin" size={16} />
                Loading records…
              </p>
            )}
            {view === "dashboard" && dashboard && (
              <>
                <div className="stats-grid">
                  <article className="stat-card total-stat">
                    <span>Total Registrations</span>
                    <strong>{dashboard.total}</strong>
                  </article>
                  {dashboard.domains.map((domain) => (
                    <button
                      key={domain.id}
                      className="stat-card"
                      onClick={() => navigate("applications", domain.id)}
                    >
                      <span>{domain.title}</span>
                      <strong>{domain.count}</strong>
                    </button>
                  ))}
                </div>
                <section className="admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <div className="eyebrow">DOMAIN DISTRIBUTION</div>
                      <h2>Where curiosity leads.</h2>
                    </div>
                    <p>Click a domain to view its applications.</p>
                  </div>
                  <div
                    className="domain-chart"
                    aria-label="Registration totals by internship domain"
                  >
                    {dashboard.domains.map((domain) => (
                      <button
                        className="chart-row"
                        key={domain.id}
                        onClick={() => navigate("applications", domain.id)}
                        aria-label={`${domain.title}: ${domain.count} registrations`}
                      >
                        <span>{domain.title}</span>
                        <div className="chart-track">
                          <div
                            style={{
                              width: `${(domain.count / Math.max(1, ...dashboard.domains.map((d) => d.count))) * 100}%`,
                            }}
                          />
                        </div>
                        <strong>{domain.count}</strong>
                      </button>
                    ))}
                  </div>
                  {dashboard.total === 0 && (
                    <p className="empty-chart-note">
                      No registrations yet. Counts will update after
                      applications are saved.
                    </p>
                  )}
                </section>
                <section className="admin-panel">
                  <div className="admin-panel-heading">
                    <h2>Recent registrations</h2>
                    <button
                      className="admin-text-button"
                      onClick={() => navigate("applications")}
                    >
                      View all →
                    </button>
                  </div>
                  <ApplicationsTable
                    rows={dashboard.recent}
                    onView={openDetail}
                    compact
                  />
                </section>
              </>
            )}
            {view === "applications" && page && (
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <div>
                    <div className="eyebrow">APPLICANT RECORDS</div>
                    <h2>
                      {page.total} registration{page.total === 1 ? "" : "s"}
                    </h2>
                  </div>
                  <div className="export-actions">
                    <a
                      className="admin-text-button"
                      href="/api/admin/export/csv"
                    >
                      Export all
                    </a>
                    {filters.domainId && (
                      <a
                        className="admin-text-button"
                        href={`/api/admin/export/csv?domainId=${encodeURIComponent(filters.domainId)}`}
                      >
                        Export domain
                      </a>
                    )}
                    <a
                      className="button button-small"
                      href={`/api/admin/export/csv?${exportQuery}`}
                    >
                      <Download size={15} />
                      Export filtered CSV
                    </a>
                  </div>
                </div>
                <ApplicationsTable
                  rows={page.applications}
                  onView={openDetail}
                />
                <div className="pagination">
                  <span>
                    Page {page.page} of{" "}
                    {Math.max(1, Math.ceil(page.total / page.pageSize))}
                  </span>
                  <div>
                    <button
                      disabled={page.page <= 1 || loading}
                      onClick={() => updateFilter("page", page.page - 1)}
                    >
                      Previous
                    </button>
                    <button
                      disabled={
                        page.page * page.pageSize >= page.total || loading
                      }
                      onClick={() => updateFilter("page", page.page + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
