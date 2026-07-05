import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, ShieldOff, ExternalLink, Search, Package, Plus, Trash2, Save } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  quality: string | null;
  price_bdt: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

function AdminPage() {
  const { user } = Route.useRouteContext() as { user: { id: string } };
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"users" | "products">("users");

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  if (adminLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldOff className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-4 font-display text-lg font-semibold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">You don't have permission to view this page.</p>
          <button onClick={() => navigate({ to: "/dashboard" })} className="mt-6 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-brand" /> Tap &amp; Tie Admin
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex gap-2">
          {(["users", "products"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                tab === t ? "bg-brand text-primary-foreground" : "border border-border hover:bg-accent"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "users" ? <UsersTab qc={qc} /> : <ProductsTab qc={qc} />}
      </main>
    </div>
  );
}

function UsersTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async (): Promise<ProfileRow[]> => {
      const { data, error } = await supabase.from("profiles")
        .select("id, username, display_name, contact_email, is_active, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
  });

  const { data: adminIds = [] } = useQuery({
    queryKey: ["admin-list"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      return (data ?? []).map((r) => r.user_id as string);
    },
  });

  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => profiles.filter((p) =>
      !q || p.username.includes(q.toLowerCase()) || (p.display_name ?? "").toLowerCase().includes(q.toLowerCase()) || (p.contact_email ?? "").toLowerCase().includes(q.toLowerCase())
    ),
    [profiles, q],
  );

  const toggleActive = async (id: string, next: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_active: next }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Activated" : "Deactivated");
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
  };

  const toggleAdmin = async (id: string, makeAdmin: boolean) => {
    if (makeAdmin) {
      const { error } = await supabase.from("user_roles").insert({ user_id: id, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success("Granted admin");
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success("Revoked admin");
    }
    qc.invalidateQueries({ queryKey: ["admin-list"] });
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">{profiles.length} total profiles</p>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2 text-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search username, name, email"
            className="w-64 bg-transparent outline-none"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-background/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="px-4 py-6 text-muted-foreground" colSpan={6}>Loading…</td></tr>}
            {filtered.map((p) => {
              const isUserAdmin = adminIds.includes(p.id);
              return (
                <tr key={p.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium">{p.display_name || p.username}</td>
                  <td className="px-4 py-3 text-muted-foreground">@{p.username}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.contact_email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${p.is_active ? "bg-brand/20 text-brand" : "bg-destructive/20 text-destructive"}`}>
                      {p.is_active ? "Active" : "Disabled"}
                    </span>
                    {isUserAdmin && <span className="ml-1 inline-flex rounded-full bg-accent px-2 py-0.5 text-xs font-semibold">Admin</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a href={`/${p.username}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-muted-foreground hover:bg-accent" title="View">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button onClick={() => toggleAdmin(p.id, !isUserAdmin)} className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-accent">
                        {isUserAdmin ? "Revoke admin" : "Make admin"}
                      </button>
                      <button
                        onClick={() => toggleActive(p.id, !p.is_active)}
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${p.is_active ? "text-destructive hover:bg-destructive/10" : "text-brand hover:bg-brand/10"}`}
                      >
                        {p.is_active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ProductsTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, quality, price_bdt, image_url, is_active, sort_order")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const addNew = async () => {
    const { error } = await supabase.from("products").insert({
      name: "New card",
      description: "",
      quality: "",
      price_bdt: 0,
      is_active: true,
      sort_order: products.length,
    });
    if (error) return toast.error(error.message);
    toast.success("Product added");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["landing-products"] });
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Products & Pricing</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage NFC cards, quality details and prices (BDT). Changes go live instantly.</p>
        </div>
        <button onClick={addNew} className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">Loading…</div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No products yet. Add your first card.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} qc={qc} />)}
        </div>
      )}
    </>
  );
}

function ProductCard({ product, qc }: { product: Product; qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState<Product>(product);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(product);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("products").update({
      name: form.name,
      description: form.description,
      quality: form.quality,
      price_bdt: form.price_bdt,
      image_url: form.image_url,
      is_active: form.is_active,
      sort_order: form.sort_order,
    }).eq("id", form.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["landing-products"] });
  };

  const remove = async () => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", form.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["landing-products"] });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
        <div className="aspect-square overflow-hidden rounded-xl border border-border bg-hero">
          {form.image_url ? (
            <img src={form.image_url} alt={form.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">No image</div>
          )}
        </div>
        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Name">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </Field>
            <Field label="Price (BDT ৳)">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.price_bdt}
                onChange={(e) => setForm({ ...form, price_bdt: Number(e.target.value) })}
                className="input"
              />
            </Field>
          </div>
          <Field label="Quality / Material">
            <input
              value={form.quality ?? ""}
              onChange={(e) => setForm({ ...form, quality: e.target.value })}
              placeholder="e.g. Premium metal, matte black"
              className="input"
            />
          </Field>
          <Field label="Description / Product details">
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Card features, size, finish, warranty…"
              className="input"
            />
          </Field>
          <Field label="Image URL (optional)">
            <input
              value={form.image_url ?? ""}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://…"
              className="input"
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Visible on landing page
            </label>
            <div className="flex items-center gap-2">
              <button onClick={remove} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="inline-flex items-center gap-1 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
