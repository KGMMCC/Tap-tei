import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Zap, Users, Shield, ArrowRight, Sparkles, Nfc, Share2, Layers, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/tap-tie-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Tap & Tie — Smart NFC cards & digital profiles" },
      { name: "description", content: "Premium NFC business cards from Tap & Tie. One tap opens your digital profile at taptie.com/username. Order in BDT." },
      { property: "og:title", content: "Tap & Tie — Smart NFC cards" },
      { property: "og:description", content: "One tap. Your entire profile. Premium NFC cards, priced in BDT." },
      { property: "og:image", content: logoAsset.url },
      { name: "twitter:image", content: logoAsset.url },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

type Product = {
  id: string;
  name: string;
  description: string | null;
  quality: string | null;
  price_bdt: number;
  image_url: string | null;
};

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <Products />
        <HowItWorks />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src={logoAsset.url}
      alt="Tap & Tie logo"
      width={size}
      height={size}
      className="object-contain"
      style={{ height: size, width: size }}
    />
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <BrandMark size={36} />
          <span>Tap &amp; Tie</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#products" className="hover:text-foreground">Cards</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground sm:block">
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Claim your link
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center md:py-32">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            NFC business cards, reimagined
          </span>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] md:text-6xl">
            One tap. <span className="text-gradient-brand">Your entire profile.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Order a premium Tap &amp; Tie NFC card and get a personal profile at
            <span className="text-foreground"> taptie.com/username</span> — share contacts, socials,
            and business info instantly.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]"
            >
              Create your profile <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#products"
              className="rounded-full border border-border bg-card/50 px-6 py-3 text-sm font-semibold hover:bg-card"
            >
              Browse cards
            </a>
          </div>
          <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
            <div>✓ Works on every modern phone</div>
            <div>✓ No app needed</div>
          </div>
        </div>
        <div className="relative mx-auto flex max-w-sm items-center justify-center">
          <div className="absolute inset-0 -z-10 blur-3xl" style={{ background: "var(--gradient-brand)", opacity: 0.25 }} />
          <div className="w-full rounded-[2.5rem] border border-border bg-card p-8 shadow-card">
            <img src={logoAsset.url} alt="Tap & Tie" className="mx-auto h-40 w-auto object-contain" />
            <p className="mt-6 text-center font-display text-sm text-muted-foreground">Tap • Share • Connect</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Nfc, title: "Tap-to-share", body: "Just tap the card to any phone. Your profile opens instantly, no app needed." },
    { icon: Share2, title: "Personal link", body: "Get your own vanity URL at taptie.com/username to share anywhere." },
    { icon: Layers, title: "All your links", body: "Instagram, LinkedIn, WhatsApp, website — put everything in one place." },
    { icon: Users, title: "Save to contacts", body: "Visitors add you to their phone contacts with a single tap." },
    { icon: Shield, title: "You're in control", body: "Update your profile any time — the card never has to change." },
    { icon: Zap, title: "Lightning fast", body: "Optimized profiles load in under a second, even on 4G." },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="max-w-2xl">
        <h2 className="font-display text-4xl font-semibold">Everything a business card should have been.</h2>
        <p className="mt-3 text-muted-foreground">Paper cards get lost. Tap &amp; Tie doesn't.</p>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-accent/50">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-primary-foreground">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Products() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["landing-products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, quality, price_bdt, image_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  return (
    <section id="products" className="border-y border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl font-semibold">Our NFC cards</h2>
          <p className="mt-3 text-muted-foreground">Premium finishes, priced in BDT. Managed live from our admin panel.</p>
        </div>

        {isLoading ? (
          <div className="mt-12 text-sm text-muted-foreground">Loading cards…</div>
        ) : products.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No cards listed yet. Admins can add products from the admin panel.</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-transform hover:-translate-y-1">
                <div className="aspect-[4/3] w-full overflow-hidden bg-hero">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <img src={logoAsset.url} alt="Tap & Tie" className="h-24 w-auto opacity-70" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                  {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
                  {p.quality && (
                    <div className="mt-3 inline-flex w-fit rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                      {p.quality}
                    </div>
                  )}
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Price</div>
                      <div className="font-display text-2xl font-semibold">
                        ৳ {Number(p.price_bdt).toLocaleString("en-BD", { maximumFractionDigits: 2 })}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">BDT</span>
                      </div>
                    </div>
                    <Link
                      to="/auth"
                      search={{ mode: "signup" }}
                      className="inline-flex items-center gap-1 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-primary-foreground"
                    >
                      Order <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Create your profile", body: "Sign up, pick your username, and add your bio, contacts, and social links." },
    { n: "02", title: "Get your NFC card", body: "We ship a premium Tap & Tie card programmed with your unique taptie.com/username." },
    { n: "03", title: "Tap to share", body: "Tap your card to any phone to open your profile — update it anytime." },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="font-display text-4xl font-semibold">How it works</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="rounded-2xl border border-border bg-card p-8">
            <div className="font-display text-4xl font-bold text-gradient-brand">{s.n}</div>
            <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center">
      <div className="rounded-3xl border border-border bg-card bg-hero p-12">
        <CreditCard className="mx-auto h-10 w-10 text-brand" />
        <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
          Ready for your smart card?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Claim your username in seconds. Design your profile. Tap to share.
        </p>
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Get started free <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <BrandMark size={24} />
          © {new Date().getFullYear()} Tap &amp; Tie
        </div>
        <div className="flex gap-6">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#products" className="hover:text-foreground">Cards</a>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
