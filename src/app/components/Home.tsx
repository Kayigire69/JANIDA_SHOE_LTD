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
  { value: "120K+", label: "Pairs Produced Monthly" },
  { value: "99.2%", label: "Quality Pass Rate" },
  { value: "35+", label: "Active Staff Accounts" },
  { value: "24/7", label: "Real-Time Monitoring" },
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
      <style>
        {`
          @keyframes continuous-slide {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}
      </style>

      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-md shadow-md py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
              <Footprints className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              JANIDA <span className="text-amber-500">SHOE</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-amber-500 after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors duration-200 px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="group relative inline-flex items-center gap-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-full shadow-lg shadow-slate-900/20 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-slate-800"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-6 py-4 flex flex-col gap-4 bg-white/95 backdrop-blur-md border-t border-slate-100">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-slate-700"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                to="/login"
                className="text-center text-sm font-medium border border-slate-200 rounded-full py-2.5"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-center text-sm font-semibold text-white bg-slate-900 rounded-full py-2.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        id="home"
        className="relative isolate pt-36 pb-24 px-6 overflow-hidden min-h-[90vh] flex items-center"
      >
        {/* Background image continuous carousel */}
        <div className="absolute inset-0 -z-20 overflow-hidden bg-slate-900">
          <div
            className="flex h-full will-change-transform"
            style={{
              width: "1000%",
              ...(isManual
                ? {
                    transform: `translateX(-${activeImage * 10}%)`,
                    transition: "transform 0.8s ease-in-out",
                  }
                : { animation: "continuous-slide 50s linear infinite" }),
            }}
          >
            {duplicatedImages.map((img, i) => (
              <div
                key={`${img}-${i}`}
                className="h-full shrink-0 bg-cover bg-center"
                style={{ width: "10%", backgroundImage: `url(${img})` }}
              />
            ))}
          </div>
        </div>

        {/* First layer: Diagonal slit gradient for branded depth */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-amber-900/30" />

        {/* Second layer: Subtle vignette */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />

        {/* Third layer: Diagonal faint crosshatch pattern */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 10px)",
          }}
        />

        {/* Bottom edge fade to white to blend with next section */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white via-white/60 to-transparent -z-10" />

        {/* Decorative glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-amber-300/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />

        <div className="relative max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center z-10">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-300 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
              <Factory className="w-3.5 h-3.5" />
              Smart Factory Management
            </span>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white">
              Manufacturing
              <span className="block text-amber-400">Smarter, Faster,</span>
              and Stronger.
            </h1>
            <p className="mt-6 text-lg text-slate-200 max-w-lg leading-relaxed">
              Janida Shoe Ltd's all-in-one management platform connects
              production, inventory, quality, and your workforce — giving you
              total control over every step of the shoemaking process.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 text-base font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 px-7 py-3.5 rounded-full shadow-lg shadow-amber-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-amber-400/40 hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 text-base font-semibold text-white border border-white/30 hover:border-white/50 px-7 py-3.5 rounded-full transition-all duration-300 hover:bg-white/10 backdrop-blur-sm"
              >
                Explore Features
              </a>
            </div>

            {/* Slider Controls - Minimal Dot Indicators */}
            <div className="mt-12 flex gap-2.5 items-center">
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleDotClick(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeImage === i
                      ? "w-7 bg-amber-400"
                      : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                  style={{ animationDelay: `${i * 100 + 200}ms` }}
                >
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-300 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-1.5 shadow-2xl shadow-slate-900/30 hover:scale-[1.02] transition-transform duration-500">
              <div className="rounded-[1.3rem] bg-slate-900 p-8 sm:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center">
                    <Footprints className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      Production Overview
                    </p>
                    <p className="text-slate-400 text-sm">Live Dashboard</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Sneakers Line A", value: 84 },
                    { label: "Boots Line B", value: 62 },
                    { label: "Sandals Line C", value: 95 },
                  ].map((line, i) => (
                    <div key={line.label}>
                      <div className="flex justify-between text-sm text-slate-300 mb-1.5">
                        <span>{line.label}</span>
                        <span>{line.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${line.value}%`,
                            transitionDelay: `${i * 150 + 300}ms`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    All systems operational
                  </div>
                  <span className="text-xs text-slate-400">Kigali, RW</span>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-bounce [animation-duration:3s]">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  99.2% Quality
                </p>
                <p className="text-xs text-slate-500">Pass Rate</p>
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
