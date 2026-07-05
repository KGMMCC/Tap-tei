import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { iconForPlatform, labelForPlatform } from "@/lib/platforms";
import { buildVCard, downloadVCard } from "@/lib/vcard";
import { Download, MapPin, Phone, Mail, Nfc, ArrowUpRight } from "lucide-react";

type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
};
type PublicLink = { id: string; platform: string; url: string; label: string | null; sort_order: number };

export const Route = createFileRoute("/$username")({
  loader: async ({ params }) => {
    const { data, error } = await (supabase.rpc as any)("get_public_profile_by_username", {
      _username: params.username.toLowerCase(),
    });
    if (error) throw error;
    const profile = Array.isArray(data) ? data[0] : data;
    if (!profile || !profile.is_active) throw notFound();

    const { data: links } = await supabase
      .from("links")
      .select("id, platform, url, label, sort_order")
      .eq("user_id", (profile as PublicProfile).id)
      .order("sort_order");

    return { profile: profile as PublicProfile, links: (links ?? []) as PublicLink[] };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Profile not found — Taptie" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.profile;
    const title = `${p.display_name || p.username} — Taptie`;
    const desc = p.bio || `Connect with ${p.display_name || p.username} on Taptie.`;
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        ...(p.avatar_url ? [{ property: "og:image", content: p.avatar_url }] : []),
      ],
    };
  },
  errorComponent: () => <ErrorState />,
  notFoundComponent: () => <NotFoundState />,
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, links } = Route.useLoaderData();
  const name = profile.display_name || profile.username;

  const saveContact = () => {
    const vcard = buildVCard({
      display_name: name,
      username: profile.username,
      contact_email: profile.contact_email,
      phone: profile.phone,
      address: profile.address,
      bio: profile.bio,
      url: typeof window !== "undefined" ? window.location.href : null,
    });
    downloadVCard(profile.username, vcard);
  };

  return (
    <div className="min-h-screen bg-hero">
      <div className="relative">
        <div
          className="h-56 w-full bg-aurora md:h-72"
          style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />
        <div className="mx-auto -mt-20 max-w-lg px-4">
          <div className="rounded-3xl border border-border bg-card/95 p-6 shadow-card backdrop-blur">
            <div className="flex flex-col items-center text-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={name} className="h-28 w-28 rounded-3xl border-4 border-card object-cover shadow-glow" />
              ) : (
                <div className="grid h-28 w-28 place-items-center rounded-3xl border-4 border-card bg-brand text-3xl font-bold text-primary-foreground shadow-glow">
                  {name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <h1 className="mt-4 font-display text-2xl font-semibold">{name}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="mt-3 max-w-sm text-sm text-foreground/85">{profile.bio}</p>}
            </div>

            <button
              onClick={saveContact}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.01]"
            >
              <Download className="h-4 w-4" /> Save to contacts
            </button>

            {(profile.phone || profile.contact_email || profile.address) && (
              <div className="mt-5 grid gap-2 border-t border-border pt-5">
                {profile.phone && <ContactRow icon={<Phone className="h-4 w-4" />} label={profile.phone} href={`tel:${profile.phone}`} />}
                {profile.contact_email && <ContactRow icon={<Mail className="h-4 w-4" />} label={profile.contact_email} href={`mailto:${profile.contact_email}`} />}
                {profile.address && <ContactRow icon={<MapPin className="h-4 w-4" />} label={profile.address} />}
              </div>
            )}

            {links.length > 0 && (
              <div className="mt-5 space-y-2 border-t border-border pt-5">
                {(links as PublicLink[]).map((l) => {
                  const Icon = iconForPlatform(l.platform);
                  return (
                    <a
                      key={l.id}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="font-medium">{l.label || labelForPlatform(l.platform)}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            to="/"
            className="mt-6 mb-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Nfc className="h-3.5 w-3.5" /> Powered by Taptie
          </Link>
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, href }: { icon: React.ReactNode; label: string; href?: string }) {
  const inner = (
    <div className="flex items-center gap-3 rounded-xl bg-background px-3 py-2.5 text-sm">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 text-brand">{icon}</span>
      <span className="font-medium text-foreground">{label}</span>
    </div>
  );
  return href ? <a href={href} className="block transition hover:opacity-90">{inner}</a> : inner;
}

function NotFoundState() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="font-display text-2xl font-semibold">Profile not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This username doesn't exist or has been disabled.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Create yours
        </Link>
      </div>
    </div>
  );
}
function ErrorState() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-2xl font-semibold">Couldn't load profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
      </div>
    </div>
  );
}
