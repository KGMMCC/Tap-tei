import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Nfc, LogOut, Save, Plus, Trash2, ExternalLink, Shield,
  User as UserIcon, GripVertical, Camera, ImageIcon, Loader2,
} from "lucide-react";
import { PLATFORMS, iconForPlatform } from "@/lib/platforms";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  phone: string | null;
  contact_email: string | null;
  address: string | null;
  is_active: boolean;
};
type LinkRow = { id: string; user_id: string; platform: string; label: string | null; url: string; sort_order: number };

function DashboardPage() {
  const { user } = Route.useRouteContext() as { user: { id: string; email?: string } };
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  const { data: links = [] } = useQuery({
    queryKey: ["links", user.id],
    queryFn: async (): Promise<LinkRow[]> => {
      const { data, error } = await supabase.from("links").select("*").eq("user_id", user.id).order("sort_order");
      if (error) throw error;
      return (data ?? []) as LinkRow[];
    },
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const [form, setForm] = useState<Profile | null>(null);
  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const [saving, setSaving] = useState(false);
  const saveProfile = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        username: form.username.toLowerCase().trim(),
        display_name: form.display_name,
        bio: form.bio,
        avatar_url: form.avatar_url,
        cover_url: form.cover_url,
        phone: form.phone,
        contact_email: form.contact_email,
        address: form.address,
      }).eq("id", user.id);
      if (error) throw error;
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const [uploading, setUploading] = useState<null | "avatar" | "cover">(null);
  const uploadImage = async (file: File, kind: "avatar" | "cover") => {
    if (!form) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setUploading(kind);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600", upsert: true, contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl;
      const patch = kind === "avatar" ? { avatar_url: url } : { cover_url: url };
      const { error: updErr } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (updErr) throw updErr;
      setForm({ ...form, ...patch });
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success(`${kind === "avatar" ? "Photo" : "Cover"} updated`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const addLink = async () => {
    const { error } = await supabase.from("links").insert({
      user_id: user.id, platform: "website", url: "", sort_order: links.length,
    });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["links", user.id] });
  };
  const updateLink = async (id: string, patch: Partial<LinkRow>) => {
    const { error } = await supabase.from("links").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["links", user.id] });
  };
  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["links", user.id] });
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (!form) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  const displayName = form.display_name || form.username;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 font-display font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-primary-foreground shadow-glow">
              <Nfc className="h-4 w-4" />
            </span>
            <span className="text-gradient-brand">Taptie</span>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin" className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent">
                <Shield className="mr-1 inline h-3.5 w-3.5" /> Admin
              </Link>
            )}
            <Link
              to="/$username"
              params={{ username: form.username }}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent"
            >
              <ExternalLink className="mr-1 inline h-3.5 w-3.5" /> View
            </Link>
            <button onClick={signOut} className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              <LogOut className="mr-1 inline h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold">
            Design your <span className="text-gradient-brand">Taptie</span> profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your public link: <span className="font-semibold text-foreground">taptie.com/{form.username}</span>
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Editor */}
          <section className="space-y-6 lg:col-span-2">
            {/* Photos */}
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
              <div
                className="relative h-40 bg-aurora"
                style={form.cover_url ? { backgroundImage: `url(${form.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              >
                <button
                  onClick={() => coverInput.current?.click()}
                  disabled={uploading === "cover"}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/70 disabled:opacity-60"
                >
                  {uploading === "cover" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                  Change cover
                </button>
                <input ref={coverInput} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "cover")} />
              </div>
              <div className="px-6 pb-6">
                <div className="-mt-12 flex items-end gap-4">
                  <div className="relative">
                    {form.avatar_url ? (
                      <img src={form.avatar_url} alt="" className="h-24 w-24 rounded-2xl border-4 border-card object-cover shadow-card" />
                    ) : (
                      <div className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-card bg-brand text-3xl font-bold text-primary-foreground shadow-card">
                        {displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => avatarInput.current?.click()}
                      disabled={uploading === "avatar"}
                      className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-brand text-primary-foreground shadow-glow hover:scale-105 transition disabled:opacity-60"
                      aria-label="Change photo"
                    >
                      {uploading === "avatar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </button>
                    <input ref={avatarInput} type="file" accept="image/*" className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
                  </div>
                  <div className="pb-2">
                    <div className="font-display text-xl font-semibold">{displayName}</div>
                    <div className="text-sm text-muted-foreground">Tap the camera to upload your photo</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">Basics</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Username">
                  <div className="flex items-center gap-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
                    <span className="text-muted-foreground">taptie.com/</span>
                    <input
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="flex-1 bg-transparent outline-none"
                      pattern="^[a-z0-9_-]{3,30}$"
                    />
                  </div>
                </Field>
                <Field label="Display name">
                  <Input value={form.display_name ?? ""} onChange={(v) => setForm({ ...form, display_name: v })} />
                </Field>
                <Field label="Bio" full>
                  <textarea
                    value={form.bio ?? ""}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={3}
                    placeholder="Tell people who you are…"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </Field>
              </div>

              <h2 className="mt-8 font-display text-lg font-semibold">Contact</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Email"><Input value={form.contact_email ?? ""} onChange={(v) => setForm({ ...form, contact_email: v })} placeholder="you@email.com" /></Field>
                <Field label="Phone"><Input value={form.phone ?? ""} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+1 555 123 4567" /></Field>
                <Field label="Address" full><Input value={form.address ?? ""} onChange={(v) => setForm({ ...form, address: v })} placeholder="City, Country" /></Field>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02] disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
              </button>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold">Social & Links</h2>
                  <p className="text-xs text-muted-foreground">Facebook, Instagram, YouTube, WhatsApp and more.</p>
                </div>
                <button onClick={addLink} className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {links.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No links yet. Add your first social link.</p>}
                {links.map((l) => {
                  const Icon = iconForPlatform(l.platform);
                  return (
                    <div key={l.id} className="grid grid-cols-[auto_140px_1fr_auto] items-center gap-2 rounded-2xl border border-border bg-background p-2 sm:grid-cols-[auto_140px_1fr_1fr_auto]">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <select
                        value={l.platform}
                        onChange={(e) => updateLink(l.id, { platform: e.target.value })}
                        className="rounded-lg border border-input bg-card px-2 py-2 text-sm outline-none"
                      >
                        {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                      <input
                        defaultValue={l.label ?? ""}
                        onBlur={(e) => e.target.value !== (l.label ?? "") && updateLink(l.id, { label: e.target.value })}
                        placeholder="Label (optional)"
                        className="hidden rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none sm:block"
                      />
                      <input
                        defaultValue={l.url}
                        onBlur={(e) => e.target.value !== l.url && updateLink(l.id, { url: e.target.value })}
                        placeholder={PLATFORMS.find(p => p.value === l.platform)?.placeholder}
                        className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none"
                      />
                      <div className="flex items-center gap-1">
                        <Icon className="h-4 w-4 text-brand" />
                        <button onClick={() => deleteLink(l.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Live preview */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between px-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview</span>
                <span className="text-[10px] text-muted-foreground">taptie.com/{form.username}</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-background">
                <div
                  className="h-24 bg-aurora"
                  style={form.cover_url ? { backgroundImage: `url(${form.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                />
                <div className="-mt-8 px-4 pb-4">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="" className="h-16 w-16 rounded-2xl border-4 border-background object-cover" />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-2xl border-4 border-background bg-brand text-xl font-bold text-primary-foreground">
                      {displayName.slice(0,1).toUpperCase()}
                    </div>
                  )}
                  <div className="mt-2 font-display text-base font-semibold">{displayName}</div>
                  <div className="text-xs text-muted-foreground">@{form.username}</div>
                  {form.bio && <p className="mt-2 text-xs text-foreground/80">{form.bio}</p>}
                  {links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {links.slice(0, 8).map(l => {
                        const Icon = iconForPlatform(l.platform);
                        return (
                          <span key={l.id} className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-brand">
                            <Icon className="h-4 w-4" />
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <Link
                to="/$username"
                params={{ username: form.username }}
                className="mt-3 flex items-center justify-center gap-1 rounded-full border border-border bg-card py-2 text-xs font-semibold hover:bg-accent"
              >
                Open full profile <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
            {!form.avatar_url && (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-card/50 p-4 text-center text-xs text-muted-foreground">
                <UserIcon className="mx-auto mb-1 h-5 w-5 text-brand" />
                Add a photo to make your profile shine.
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
    />
  );
}
