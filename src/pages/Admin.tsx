import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { assessmentsService, type Assessment } from "@/services/db";

interface Row extends Assessment {
  display_name: string | null;
}

const Admin = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await assessmentsService.listAllForAdmin();
        setRows(data);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q) ||
      (r.display_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-bold md:text-4xl">Admin · All assessments</h1>
        </div>
        <p className="mb-6 text-muted-foreground">
          You're viewing every assessment across all users. Total: <strong>{rows.length}</strong>
        </p>

        <Input
          placeholder="Search by user name or assessment title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-6 max-w-md"
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-glass rounded-2xl p-12 text-center text-muted-foreground">
            No assessments found.
          </div>
        ) : (
          <div className="card-glass overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Readiness</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">{r.display_name ?? r.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium">{r.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          r.status === "completed"
                            ? "bg-success/15 text-success"
                            : "bg-warning/15 text-warning"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-display font-bold gradient-text">
                      {r.job_readiness_score ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard?id=${r.id}`}>
                          Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
