import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { assessmentsService, type Assessment } from "@/services/db";

const PAGE_SIZE = 8;

const History = () => {
  const [items, setItems] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const data = await assessmentsService.list();
      setItems(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.jd_text ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assessment? This cannot be undone.")) return;
    try {
      await assessmentsService.remove(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
      toast.success("Assessment deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">Your assessments</h1>
            <p className="mt-1 text-muted-foreground">Revisit past results or start a new one.</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/dashboard"><Plus className="mr-1 h-4 w-4" /> New assessment</Link>
          </Button>
        </div>

        <div className="mb-6 relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or job description…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <div className="card-glass rounded-2xl p-12 text-center">
            <p className="mb-4 text-muted-foreground">
              {query ? "No assessments match your search." : "No assessments yet — create your first one!"}
            </p>
            <Button variant="hero" asChild>
              <Link to="/dashboard">Start an assessment</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((a) => (
              <div key={a.id} className="card-glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-lg font-semibold">{a.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        a.status === "completed"
                          ? "bg-success/15 text-success"
                          : "bg-warning/15 text-warning"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {a.jd_text?.slice(0, 140) || "No job description"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {a.job_readiness_score != null && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Readiness</div>
                      <div className="font-display text-2xl font-bold gradient-text">
                        {a.job_readiness_score}
                      </div>
                    </div>
                  )}
                  <Button variant="glass" size="sm" asChild>
                    <Link to={`/dashboard?id=${a.id}`}>
                      Open <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(a.id)}
                    aria-label="Delete assessment"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {pageCount > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} / {pageCount}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
