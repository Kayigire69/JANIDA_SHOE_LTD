import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Footprints,
  Factory,
  ShieldCheck,
  Leaf,
  Truck,
  Award,
  Star,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Zap,
  BarChart3,
  Activity,
} from "lucide-react";

const heroImages = [
  "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1600&q=80",
];

const duplicatedImages = [...heroImages, ...heroImages];

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

const features = [
  {
    icon: Factory,
    title: "Smart Production Planning",
    description:
      "Plan, schedule, and track every production batch in real time across all factory lines.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Assurance",
    description:
      "Automated inspections, defect tracking, and certification management for flawless output.",
  },
  {
    icon: Leaf,
    title: "Sustainable Manufacturing",
    description:
      "Monitor materials and waste to keep production efficient, ethical, and eco-friendly.",
  },
  {
    icon: Truck,
    title: "Inventory & Logistics",
    description:
      "Full visibility into raw materials, finished goods, suppliers, and warehouse locations.",
  },
  {
    icon: Award,
    title: "Workforce Management",
    description:
      "Manage shifts, attendance, and staff directories across every department.",
  },
  {
    icon: Footprints,
    title: "End-to-End Traceability",
    description:
      "Trace every pair of shoes from raw material to delivery with full batch traceability.",
  },
];

const testimonials = [
  {
    name: "Eric Mugisha",
    role: "Production Manager, Janida Shoe Ltd",
    quote:
      "Since adopting this system, our production line efficiency improved dramatically. Scheduling that used to take hours now takes minutes.",
    rating: 5,
  },
  {
    name: "Aline Uwase",
    role: "Quality Officer",
    quote:
      "Defect tracking and inspection templates have transformed how we maintain quality standards across every batch.",
    rating: 5,
  },
  {
    name: "Jean Paul Kagabo",
    role: "Inventory Manager",
    quote:
      "Real-time stock visibility means we never run short on raw materials anymore. A complete game changer for our warehouse.",
    rating: 4,
  },
];

const stats = [
  { value: "120K+", label: "Pairs Produced Monthly", icon: TrendingUp, color: "text-amber-400" },
  { value: "99.2%", label: "Quality Pass Rate",      icon: ShieldCheck,  color: "text-emerald-400" },
  { value: "35+",   label: "Active Staff Accounts",  icon: Zap,          color: "text-blue-400" },
  { value: "24/7",  label: "Real-Time Monitoring",   icon: Activity,     color: "text-violet-400" },
];

export function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isManual) return;
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length);
    }, 10000); // 10 seconds per image matches the 50s total for 5 images
    return () => clearInterval(interval);
  }, [isManual]);

  const handleDotClick = (index: number) => {
    setIsManual(true);
    setActiveImage(index);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <style>{`
        @keyframes continuous-slide {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float-up {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #fbbf24, #f59e0b, #fde68a, #f59e0b, #fbbf24);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .card-float { animation: float-up 4s ease-in-out infinite; }
        .card-float-delay { animation: float-up 4s ease-in-out infinite 1.5s; }
        .nav-link-hover::after {
          content: '';
          position: absolute;
          left: 0; bottom: -4px;
          height: 2px; width: 0;
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
          border-radius: 9999px;
          transition: width 0.3s ease;
        }
        .nav-link-hover:hover::after { width: 100%; }
      `}</style>

      {/* ═══════════════════════════════ NAVBAR ═══════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "py-2"
            : "py-4"
        }`}
      >
        {/* Glass pill container */}
        <div className={`max-w-7xl mx-auto px-4 transition-all duration-500 ${
          scrolled ? "" : "px-6"
        }`}>
          <div className={`flex items-center justify-between gap-4 rounded-2xl transition-all duration-500 ${
            scrolled
              ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-slate-900/[0.08] border border-slate-200/60 px-5 py-3"
              : "bg-slate-900/40 backdrop-blur-md border border-white/10 px-5 py-3.5"
          }`}>

            {/* Logo */}
            <a href="#home" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                scrolled ? "bg-slate-900" : "bg-amber-400"
              }`}>
                <Footprints className={`w-4.5 h-4.5 transition-colors ${
                  scrolled ? "text-amber-400" : "text-slate-900"
                }`} style={{ width: 18, height: 18 }} />
                {/* Glow ring */}
                <span className="absolute inset-0 rounded-xl bg-amber-400/30 scale-0 group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              </div>
              <span className={`text-[17px] font-bold tracking-tight transition-colors ${
                scrolled ? "text-slate-900" : "text-white"
              }`}>
                JANIDA<span className="text-amber-400"> SHOE</span>
              </span>
            </a>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`relative nav-link-hover px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                    scrolled
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* CTA buttons */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              <Link
                to="/login"
                className={`text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                  scrolled
                    ? "text-slate-700 hover:bg-slate-100"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="group relative inline-flex items-center gap-2 text-[13px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-5 py-2.5 rounded-xl shadow-md shadow-amber-500/25 transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/35 hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className={`md:hidden p-2 rounded-lg transition-colors ${
                scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
              }`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 mt-2 mx-4 ${
          menuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}>
          <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-xl px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-[13px] font-semibold text-slate-700 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-slate-100">
              <Link to="/login" className="text-center text-[13px] font-semibold border border-slate-200 rounded-xl py-2.5 text-slate-700 hover:bg-slate-50">
                Sign In
              </Link>
              <Link to="/register" className="text-center text-[13px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl py-2.5 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
      <section
        id="home"
        className="relative isolate pt-32 pb-20 px-6 overflow-hidden min-h-[100vh] flex items-center"
      >
        {/* BG image carousel */}
        <div className="absolute inset-0 -z-20 overflow-hidden bg-slate-950">
          <div
            className="flex h-full will-change-transform"
            style={{
              width: "1000%",
              ...(isManual
                ? { transform: `translateX(-${activeImage * 10}%)`, transition: "transform 0.8s ease-in-out" }
                : { animation: "continuous-slide 50s linear infinite" }),
            }}
          >
            {duplicatedImages.map((img, i) => (
              <div key={`${img}-${i}`} className="h-full shrink-0 bg-cover bg-center" style={{ width: "10%", backgroundImage: `url(${img})` }} />
            ))}
          </div>
        </div>

        {/* Overlay stack */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950/95 via-slate-900/80 to-slate-800/70" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(251,191,36,0.12),transparent)]" />
        <div className="absolute inset-0 -z-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(251,191,36,0.07) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.07) 0%, transparent 50%)" }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-white via-white/50 to-transparent -z-10" />

        {/* Ambient glows */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center z-10">

          {/* ── Left column ── */}
          <div className="space-y-8">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/30 bg-amber-400/10 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300 text-xs font-bold tracking-[0.15em] uppercase">Smart Factory Management</span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-white">
                Manufacturing
              </h1>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight shimmer-text">
                Smarter, Faster,
              </h1>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-white">
                and Stronger.
              </h1>
            </div>

            {/* Description */}
            <p className="text-[17px] text-slate-300 max-w-md leading-relaxed">
              Janida Shoe Ltd's all-in-one management platform connects production,
              inventory, quality, and your workforce — giving you total control over
              every step of the shoemaking process.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2.5 text-[15px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-400/40 hover:-translate-y-1"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-white/90 border border-white/20 hover:border-white/40 px-8 py-4 rounded-2xl transition-all duration-300 hover:bg-white/[0.07] backdrop-blur-sm"
              >
                Explore Features
              </a>
            </div>

            {/* Dot indicators */}
            <div className="flex gap-2 items-center">
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleDotClick(i)}
                  className={`rounded-full transition-all duration-300 ${
                    activeImage === i
                      ? "w-8 h-2 bg-amber-400"
                      : "w-2 h-2 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 pt-4 border-t border-white/10">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`px-4 py-3 ${
                      i !== 0 ? "border-l border-white/10" : ""
                    }`}
                    style={{ animationDelay: `${i * 100 + 200}ms` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                      <p className="text-[22px] font-black text-white leading-none">{stat.value}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium leading-tight">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right column: Dashboard card ── */}
          <div className="relative lg:flex lg:justify-end">
            {/* Main card */}
            <div className="card-float relative w-full max-w-[420px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-slate-950/50">
              {/* Card header gradient */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 pt-6 pb-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Production Overview</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-emerald-400 text-xs font-medium">Live Dashboard</p>
                      </div>
                    </div>
                  </div>
                  {/* Window controls */}
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400/60" />
                    <span className="w-3 h-3 rounded-full bg-amber-400/60" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400/60" />
                  </div>
                </div>

                {/* Production bars */}
                <div className="space-y-4">
                  {[
                    { label: "Sneakers Line A", value: 84, color: "from-amber-400 to-orange-400" },
                    { label: "Boots Line B",    value: 62, color: "from-blue-400 to-indigo-400" },
                    { label: "Sandals Line C",  value: 95, color: "from-emerald-400 to-teal-400" },
                  ].map((line, i) => (
                    <div key={line.label}>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                        <span>{line.label}</span>
                        <span className="text-white">{line.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${line.color} transition-all duration-1000 ease-out shadow-sm`}
                          style={{ width: `${line.value}%`, transitionDelay: `${i * 150 + 300}ms` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card footer */}
              <div className="bg-slate-900/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between border-t border-white/[0.06]">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  All systems operational
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-slate-400 text-xs font-medium">Kigali, RW</span>
                </div>
              </div>
            </div>

            {/* Floating badge bottom-left */}
            <div className="card-float-delay absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-2xl p-3.5 flex items-center gap-3 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">99.2% Quality</p>
                <p className="text-[11px] text-slate-500">Pass Rate</p>
              </div>
            </div>

            {/* Floating chip top-right */}
            <div className="absolute -top-4 -right-4 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-white">+18.4%</p>
                <p className="text-[10px] text-slate-500">This month</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-amber-500 font-semibold text-sm uppercase tracking-widest">
            About Janida Shoe Ltd
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
            Built for Rwanda's Leading Shoe Manufacturer
          </h2>
          <p className="mt-5 max-w-2xl mx-auto text-slate-600 leading-relaxed">
            From raw material sourcing to finished products on the shelf, our
            management system digitizes every workflow at Janida Shoe Ltd —
            empowering teams across production, inventory, quality assurance,
            and sales with the tools they need to perform at their best.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-500 font-semibold text-sm uppercase tracking-widest">
              Platform Features
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              Everything Your Factory Needs
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-slate-600">
              A complete suite of tools designed around real factory
              operations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-5 transition-colors duration-300 group-hover:bg-amber-500">
                    <Icon className="w-6 h-6 text-amber-400 group-hover:text-slate-900 transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-500 font-semibold text-sm uppercase tracking-widest">
              Testimonials
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
              Trusted by Our Team
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-slate-600">
              Hear from the people using the system every day on the factory
              floor.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="group bg-slate-50 rounded-2xl p-7 border border-slate-100 hover:bg-white hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < t.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed text-sm">
                  "{t.quote}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-amber-400 font-semibold text-sm">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {t.name}
                    </p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 px-8 sm:px-16 py-14 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to streamline your factory?
          </h2>
          <p className="mt-4 text-slate-300 max-w-xl mx-auto">
            Create your account today and join the team driving smarter
            manufacturing at Janida Shoe Ltd.
          </p>
          <Link
            to="/register"
            className="mt-8 group inline-flex items-center gap-2 text-base font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 px-8 py-3.5 rounded-full shadow-lg shadow-amber-500/20 transition-all duration-300 hover:-translate-y-0.5"
          >
            Get Started Now
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 text-slate-300 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center">
                <Footprints className="w-5 h-5 text-slate-900" />
              </div>
              <span className="text-lg font-semibold text-white">
                JANIDA SHOE
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Smart manufacturing management for Rwanda's premier shoe
              factory. Quality, traceability, and efficiency in every step.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-amber-400 transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/login"
                  className="hover:text-amber-400 transition-colors duration-200"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="hover:text-amber-400 transition-colors duration-200"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  to="/password-recovery"
                  className="hover:text-amber-400 transition-colors duration-200"
                >
                  Forgot Password
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Kigali, Rwanda</li>
              <li>info@janidashoe.rw</li>
              <li>+250 788 000 000</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Janida Shoe Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
