"use client";

import { useRef, useEffect, useState, useCallback, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useReducedMotion,
  AnimatePresence,
} from "motion/react";
import { ArrowRight } from "lucide-react";
import { CustomCursor } from "./CustomCursor";
import { IntroSequence } from "./IntroSequence";

// ─── Design tokens ────────────────────────────────────────────────────────────
const TITAN  = "#b2a898";   // warm titanium/bronze — secondary text
const GOLD   = "#c9b58a";   // warm gold — accents, CTAs, key highlights
const CREAM  = "#ece6d6";   // primary text
const BG     = "#0a0b0e";
const EASE   = [0.16, 1, 0.3, 1] as const;
const SECTION_H = "clamp(2.18rem,3.55vw,4.5rem)";
const SUB_H = "clamp(1.25rem,1.8vw,2.05rem)";
const BODY = "1.05rem";

// Origin section is the typographic reference:
// heading: clamp(2.6rem, 4vw, 5rem) | body: 1.08rem | label: 0.8rem

function useHydratedReducedMotion() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return mounted && reduced;
}

// ─── Grain ────────────────────────────────────────────────────────────────────
function Grain() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] opacity-[0.03] mix-blend-overlay"
      style={{ backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:"200px 200px" }}
    />
  );
}

function BrandLogo({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/images/jra-logo-transparent.png"
      alt="James Roman Advisory"
      width={739}
      height={305}
      priority={priority}
      className={`w-auto object-contain ${className || "h-10"}`}
      sizes="(min-width: 768px) 220px, 150px"
    />
  );
}

function ConsultationForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});

  function validate(formData: FormData) {
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const nextErrors: { name?: string; email?: string } = {};

    if (!name) nextErrors.name = "We'll need your name.";
    if (!email) {
      nextErrors.email = "An email so we can reach you.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "That email looks off — worth a second glance.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setMessage("");
    if (!validate(formData)) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "Request could not be submitted.");
      }

      form.reset();
      setStatus("submitted");
    } catch (error) {
      setMessage("That didn't go through, and it's on our end. Try again in a moment — we'll be here.");
      setStatus("error");
    }
  }

  if (status === "submitted") {
    return (
      <div className="border-t pt-8" style={{ borderColor:"rgba(178,168,152,0.13)" }}>
        <h3 className="font-heading text-[1.8rem] font-light" style={{ color:CREAM }}>
          Received.
        </h3>
        <p className="mt-4 leading-[1.85]" style={{ color:TITAN, opacity:0.78, fontSize:BODY }}>
          A founding partner reviews every inquiry personally — usually within two business days.
          If it&apos;s a fit, we&apos;ll arrange a confidential consultation. If it isn&apos;t, we&apos;ll tell
          you that quickly, and point you somewhere useful if we can.
        </p>
        <p className="mt-5 leading-[1.85]" style={{ color:TITAN, opacity:0.68, fontSize:BODY }}>
          No need to send anything yet. Secure document exchange opens only once an engagement is accepted.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <input name="company" type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="name" className="text-[0.72rem] uppercase tracking-[0.22em]" style={{ color:TITAN, opacity:0.8 }}>
            Name
          </label>
          <input id="name" name="name" autoComplete="name" aria-invalid={fieldErrors.name ? "true" : "false"} className="h-12 border bg-transparent px-3 text-[1rem] outline-none focus-visible:ring-1 focus-visible:ring-[#c9b58a]" style={{ borderColor:fieldErrors.name ? "rgba(239,68,68,0.55)" : "rgba(178,168,152,0.2)", color:CREAM }} />
          {fieldErrors.name ? <p className="text-[0.82rem]" role="alert" style={{ color:TITAN, opacity:0.84 }}>{fieldErrors.name}</p> : null}
        </div>
        <div className="grid gap-2">
          <label htmlFor="email" className="text-[0.72rem] uppercase tracking-[0.22em]" style={{ color:TITAN, opacity:0.8 }}>
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" aria-invalid={fieldErrors.email ? "true" : "false"} className="h-12 border bg-transparent px-3 text-[1rem] outline-none focus-visible:ring-1 focus-visible:ring-[#c9b58a]" style={{ borderColor:fieldErrors.email ? "rgba(239,68,68,0.55)" : "rgba(178,168,152,0.2)", color:CREAM }} />
          {fieldErrors.email ? <p className="text-[0.82rem]" role="alert" style={{ color:TITAN, opacity:0.84 }}>{fieldErrors.email}</p> : null}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="market" className="text-[0.72rem] uppercase tracking-[0.22em]" style={{ color:TITAN, opacity:0.8 }}>
            Property location
          </label>
          <input id="market" name="market" placeholder="Malibu, Bel Air, Beverly Hills..." className="h-12 border bg-transparent px-3 text-[1rem] outline-none placeholder:text-[#b2a898]/35 focus-visible:ring-1 focus-visible:ring-[#c9b58a]" style={{ borderColor:"rgba(178,168,152,0.2)", color:CREAM }} />
        </div>
        <div className="grid gap-2">
          <label htmlFor="matter" className="text-[0.72rem] uppercase tracking-[0.22em]" style={{ color:TITAN, opacity:0.8 }}>
            Matter type
          </label>
          <input id="matter" name="matter" placeholder="Remediation, structural, diligence..." className="h-12 border bg-transparent px-3 text-[1rem] outline-none placeholder:text-[#b2a898]/35 focus-visible:ring-1 focus-visible:ring-[#c9b58a]" style={{ borderColor:"rgba(178,168,152,0.2)", color:CREAM }} />
        </div>
      </div>
      <div className="grid gap-2">
        <label htmlFor="message" className="text-[0.72rem] uppercase tracking-[0.22em]" style={{ color:TITAN, opacity:0.8 }}>
          Brief context
        </label>
        <textarea id="message" name="message" rows={5} required className="resize-y border bg-transparent px-3 py-3 text-[1rem] leading-relaxed outline-none focus-visible:ring-1 focus-visible:ring-[#c9b58a]" style={{ borderColor:"rgba(178,168,152,0.2)", color:CREAM }} />
      </div>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="min-h-11 w-full justify-self-start border px-8 py-3.5 text-[0.86rem] uppercase tracking-[0.2em] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#c9b58a] sm:w-auto"
        style={{ borderColor:GOLD, background:GOLD, color:"#06111f", opacity:status === "submitting" ? 0.64 : 1 }}
      >
        {status === "submitting" ? "Sending…" : "Request consultation"}
      </button>
      {status === "error" ? (
        <p className="max-w-xl text-[0.92rem] leading-relaxed" role="alert" style={{ color:TITAN, opacity:0.86 }}>
          {message}
        </p>
      ) : null}
    </form>
  );
}

// ─── Line ─────────────────────────────────────────────────────────────────────
function Line({ delay=0 }: { delay?:number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true });
  const reduced = useHydratedReducedMotion();
  return (
    <div ref={ref} className="overflow-hidden w-full">
      <motion.div className="h-px" style={{ background:"rgba(201,181,138,0.15)", originX:0 }}
        initial={reduced ? { scaleX:1 } : { scaleX:0 }}
        animate={inView ? { scaleX:1 } : {}}
        transition={{ duration:1.8, delay, ease:EASE }} />
    </div>
  );
}

// ─── Fade ─────────────────────────────────────────────────────────────────────
function Fade({ children, delay=0, className="" }: { children:React.ReactNode; delay?:number; className?:string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:"-6% 0px" });
  const reduced = useHydratedReducedMotion();
  return (
    <motion.div ref={ref} className={className}
      initial={reduced ? { opacity:1, y:0 } : { opacity:0, y:28 }}
      animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ duration:1.3, delay, ease:EASE }}>
      {children}
    </motion.div>
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────
function Label({ children, delay=0, center=false }: { children:React.ReactNode; delay?:number; center?:boolean }) {
  return (
    <Fade delay={delay}>
      <p className={`text-[0.78rem] uppercase tracking-[0.34em] mb-7 ${center?"text-center":""}`}
        style={{ color:TITAN, opacity:0.82 }}>{children}</p>
    </Fade>
  );
}

// ─── Multi-color heading ──────────────────────────────────────────────────────
type CW = { text:string; color:string };
function RichH({
  lines, size=SECTION_H, className="", baseDelay=0, center=false, blur=false,
}: {
  lines:CW[][]; size?:string; className?:string; baseDelay?:number; center?:boolean; blur?:boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once:true, margin:"-8% 0px" });
  const reduced = useHydratedReducedMotion();
  let idx = 0;
  const from = reduced ? { opacity:1, y:0, filter:"blur(0px)" }
    : blur ? { opacity:0, y:20, filter:"blur(8px)" }
    : { opacity:0, y:18, filter:"blur(0px)" };
  return (
    <h2 ref={ref} className={`font-heading font-light leading-[0.93] tracking-[-0.025em] ${center?"text-center":""} ${className}`}
      style={{ fontSize:size, textShadow:"0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)" }}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.map((seg) => seg.text.split(" ").filter(Boolean).map((word) => {
            const i = idx++;
            return (
              <motion.span key={i} className="inline-block mr-[0.22em]" style={{ color:seg.color }}
                initial={from}
                animate={inView ? { opacity:1, y:0, filter:"blur(0px)" } : {}}
                transition={{ duration: blur ? 1.15 : 0.9, delay:baseDelay + i*0.08, ease:EASE }}>
                {word}
              </motion.span>
            );
          }))}
        </span>
      ))}
    </h2>
  );
}

// ─── Parallax image ───────────────────────────────────────────────────────────
function ParallaxImg({ src, alt, speed=0.14, className="", imageClassName }: {
  src:string; alt:string; speed?:number; className?:string; imageClassName?:string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target:ref, offset:["start end","end start"] });
  const y = useTransform(scrollYProgress, [0,1], [`${-speed*100}%`,`${speed*100}%`]);
  return (
    <div ref={ref} className={`overflow-hidden ${className || "relative h-full"}`}>
      <motion.div style={{ y }} className="absolute inset-x-0 -top-[16%] bottom-[-16%]">
        <Image
          src={src}
          alt={alt}
          fill
          className={imageClassName ?? "object-cover object-center saturate-[0.45] contrast-[0.88] brightness-[0.85]"}
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </motion.div>
    </div>
  );
}

// ─── Practice rows ────────────────────────────────────────────────────────────
const ROWS = [
  { n:"01", title:"Mold and Water Damage", body:"Moisture mapping, containment strategy, clearance standards, and contractor performance reviewed before damage turns into a second problem." },
  { n:"02", title:"Fire and Smoke Residue", body:"Residue testing, odor pathways, cleaning protocols, and documentation tracked so restoration decisions are based on evidence, not pressure." },
  { n:"03", title:"Asbestos and Legacy Materials", body:"Legacy materials identified, sampled, abated, and closed out with the right custody trail before renovation or rebuild work moves forward." },
  { n:"04", title:"Indoor Air Quality and VOCs", body:"Airborne particulate, volatile organic compounds, and post-remediation clearance coordinated with independent testing and readable reporting." },
  { n:"05", title:"Pre-Sale Diligence", body:"Environmental and structural risk reviewed before acquisition, listing, or negotiation so hidden liability does not arrive after the transaction." },
  { n:"06", title:"Contractor Procurement", body:"License, insurance, bonding, scope, and field performance reviewed before any crew steps on site. Every contract questioned before it is signed." },
];

const STAR_POINTS = [
  { left: "8%", top: "7%", opacity: 0.23 },
  { left: "16%", top: "18%", opacity: 0.32 },
  { left: "24%", top: "10%", opacity: 0.18 },
  { left: "31%", top: "27%", opacity: 0.29 },
  { left: "38%", top: "6%", opacity: 0.2 },
  { left: "43%", top: "23%", opacity: 0.36 },
  { left: "49%", top: "13%", opacity: 0.24 },
  { left: "55%", top: "31%", opacity: 0.18 },
  { left: "61%", top: "8%", opacity: 0.33 },
  { left: "67%", top: "21%", opacity: 0.25 },
  { left: "73%", top: "12%", opacity: 0.37 },
  { left: "79%", top: "28%", opacity: 0.2 },
  { left: "84%", top: "5%", opacity: 0.27 },
  { left: "89%", top: "19%", opacity: 0.34 },
  { left: "94%", top: "11%", opacity: 0.22 },
  { left: "12%", top: "32%", opacity: 0.19 },
  { left: "58%", top: "3%", opacity: 0.3 },
  { left: "97%", top: "33%", opacity: 0.24 },
] as const;

function PracticeSection() {
  return (
    <section id="the-process" className="px-[12%] py-28" style={{ background:"#080a0d" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 grid gap-8 lg:grid-cols-[0.72fr_0.28fr] lg:items-end"
          style={{ borderBottom:"1px solid rgba(178,168,152,0.09)", paddingBottom:"2.75rem" }}>
          <div>
            <Label>The Practice</Label>
            <RichH
              lines={[[{text:"Advocacy,",color:CREAM}],[{text:"not",color:TITAN},{text:"remediation.",color:CREAM}]]} />
          </div>
          <p className="leading-[1.88] lg:max-w-sm" style={{ color:TITAN, opacity:0.82, fontSize:BODY }}>
              We carry no hammers and file no invoices for work. Our only product is judgment
              applied exclusively on behalf of the owner.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 lg:border-t" style={{ borderColor:"rgba(178,168,152,0.07)" }}>
          {ROWS.map(({ n, title, body }, i) => (
            <motion.div key={n}
              className="group cursor-default py-10 lg:px-8 lg:even:border-l"
              style={{
                borderBottom:"1px solid rgba(178,168,152,0.07)",
                borderLeftColor:"rgba(178,168,152,0.07)",
                background: i%4===1 || i%4===2 ? "rgba(13,15,22,0.38)" : "transparent",
              }}
              initial={{ opacity:0, y:18 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, margin:"-8% 0px" }}
              transition={{ duration:1.1, delay:i*0.1, ease:EASE }}>
              <div className="grid gap-5 md:grid-cols-[4.25rem_1fr] md:items-start">
                <p className="font-heading text-[1.05rem] leading-none tracking-[0.12em]" style={{ color:TITAN, opacity:0.34 }}>{n}</p>
                <div className="max-w-xl">
                  <h3 className="font-heading font-light leading-[1.04] tracking-[-0.015em]"
                    style={{ fontSize:SUB_H, color:CREAM }}>{title}</h3>
                  <p className="mt-4 leading-[1.88]" style={{ color:TITAN, opacity:0.82, fontSize:BODY }}>{body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Prototype() {
  const contactPath = "#consultation";
  const heroRef    = useRef<HTMLDivElement>(null);
  const officeRef  = useRef<HTMLDivElement>(null);

  const [introComplete, setIntroComplete] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  const handleIntroComplete = useCallback(() => setIntroComplete(true), []);

  // Hide nav on scroll down, reveal on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80) { setNavVisible(true); }
      else if (y > lastScrollY.current + 8) { setNavVisible(false); }
      else if (y < lastScrollY.current - 8) { setNavVisible(true); }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive:true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { scrollYProgress: heroProgress } = useScroll({ target:heroRef, offset:["start start","end start"] });
  const heroY       = useTransform(heroProgress, [0,1], ["0%","22%"]);
  const heroOpacity = useTransform(heroProgress, [0,0.72], [1,0]);
  const heroScale   = useTransform(heroProgress, [0,1], [1,1.06]);

  const cornerstones = [
    { n:"01", title:"Privacy",      color:CREAM,  body:"NDA-protected engagements. No public client list. Your property and family context stay tightly held — not filed, not referenced, not discussed." },
    { n:"02", title:"Transparency", color:TITAN,  body:"Every test result, invoice, and report logged to your Private Office. Decisions are reconstructable. Nothing circulates informally." },
    { n:"03", title:"Concierge",    color:GOLD,   body:"A direct line to the founding partner. We limit engagements to six projects annually — intentionally. Judgment cannot be scaled." },
  ];

  return (
    <>
        <CustomCursor />
        <Grain />
      <IntroSequence onComplete={handleIntroComplete} />

      <div style={{ background:BG, color:CREAM }}>

        {/* ══ NAV ══════════════════════════════════════════════════════════ */}
        <motion.header
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5%] py-5"
          style={{ background:"rgba(10,11,14,0.88)", backdropFilter:"blur(12px)", borderBottom:"1px solid rgba(178,168,152,0.07)" }}
          initial={{ opacity:0, y:-20 }}
          animate={introComplete ? { opacity:1, y: navVisible ? 0 : -100 } : { opacity:0, y:-20 }}
          transition={{ duration:0.5, ease:EASE }}
        >
          <Link href="/" aria-label="Home">
            {/* 50% bigger than h-11 (2.75rem) → ~4.2rem */}
            <BrandLogo className="opacity-88 h-8 sm:h-10 md:!h-[4.2rem]" />
          </Link>
          <nav className="hidden md:flex items-center gap-10 text-[0.86rem] uppercase tracking-[0.2em]"
            style={{ color:TITAN, opacity:0.7 }}>
            {[["The Practice","#the-process"],["Origin","#origin"],["The Cornerstone","#cornerstones"],["Private Office","#private-office"]].map(([l,h]) => (
              <a key={l} href={h} className="hover:opacity-100 transition-opacity duration-400">{l}</a>
            ))}
          </nav>
          <Link href={contactPath} data-cursor="inquire"
            className="hidden md:flex items-center gap-2 text-[0.86rem] uppercase tracking-[0.2em] hover:opacity-100 transition-opacity duration-400"
            style={{ color:GOLD, opacity:0.85 }}>
            Inquire <ArrowRight className="size-3.5" />
          </Link>
        </motion.header>

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <section ref={heroRef as React.RefObject<HTMLDivElement>} className="relative h-screen min-h-[700px] flex items-end overflow-hidden">
          <motion.div className="absolute inset-0" style={{ y:heroY, scale:heroScale }}>
            <Image src="/images/jra-hero.jpg" alt="Malibu coastal estate" fill priority
              className="object-cover object-center saturate-[0.45] contrast-[0.88] brightness-[0.85]" sizes="100vw" />
            <div className="absolute inset-0"
              style={{ background:"linear-gradient(to top, rgba(10,11,14,1) 0%, rgba(10,11,14,0.38) 55%, rgba(10,11,14,0.12) 100%)" }} />
          </motion.div>

          <motion.div style={{ opacity:heroOpacity }}
            className="relative z-10 w-full px-[12%] pb-16 lg:pb-24">
            <AnimatePresence>
              {introComplete && (
                <>
                  {/* Value prop — answers "what do they do" on first viewport */}
                  <motion.p className="mb-3 text-[0.76rem] uppercase tracking-[0.3em]"
                    style={{ color:CREAM, opacity:0, textShadow:"0 2px 10px rgba(0,0,0,0.72)" }}
                    animate={{ opacity:0.88 }}
                    transition={{ duration:1.0, delay:0.05, ease:EASE }}>
                    Owner-side advisory · No contractors · No conflicts
                  </motion.p>
                  <motion.p className="mb-8 text-[0.76rem] uppercase tracking-[0.3em]"
                    style={{ color:GOLD, opacity:0, textShadow:"0 2px 10px rgba(0,0,0,0.72)" }}
                    animate={{ opacity:0.84 }}
                    transition={{ duration:1.2, delay:0.1, ease:EASE }}>
                    Private advisory · Los Angeles coastal estates
                  </motion.p>

                  {/* Hero h1 — larger than section headings but proportional */}
                  <h1 aria-label="Protecting The Coast We Call Home." className="font-heading font-light leading-[0.88] tracking-[-0.025em]"
                    style={{ fontSize:"clamp(2.9rem,4.7vw,5.35rem)", textShadow:"0 3px 18px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.5)" }}>
                    {[
                      { text:"Protecting", color:CREAM,  d:0.2, block:true },
                      { text:"The Coast",  color:TITAN,  d:0.46, block:true },
                      { text:"We Call",    color:CREAM,  d:0.72, block:false },
                      { text:"Home.",      color:GOLD,   d:0.88, block:false },
                    ].map(({ text, color, d, block }, i) => (
                      <motion.span key={i}
                        className={`${block?"block":""} inline-block mr-[0.18em]`}
                        style={{ color, display: block ? "block" : "inline-block" }}
                        initial={{ opacity:0, y:22, filter:"blur(10px)" }}
                        animate={{ opacity:1, y:0, filter:"blur(0px)" }}
                        transition={{ duration:1.2, delay:d, ease:EASE }}>
                        {text}
                      </motion.span>
                    ))}
                  </h1>

                  <Line delay={1.3} />

                  <motion.div className="mt-8 flex flex-col sm:flex-row sm:items-end gap-7"
                    initial={{ opacity:0 }} animate={{ opacity:1 }}
                    transition={{ duration:1.1, delay:1.5, ease:EASE }}>
                    <p className="max-w-xl leading-[1.9]" style={{ color:TITAN, opacity:0.84, fontSize:BODY }}>
                      Ultra-discreet hazardous materials remediation advisory and structural inspection
                      oversight for coastal estate owners where cost, liability, and pressure arrive together.
                    </p>
                    <a href="#the-process" data-cursor="view"
                      className="ml-auto flex-shrink-0 flex items-center gap-3 text-[0.86rem] uppercase tracking-[0.2em] hover:opacity-100 transition-opacity"
                      style={{ color:GOLD, opacity:0.8 }}>
                      View practice <ArrowRight className="size-3.5" />
                    </a>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div className="absolute bottom-8 right-10 flex flex-col items-center gap-3"
            initial={{ opacity:0 }} animate={introComplete ? { opacity:1 } : {}}
            transition={{ delay:2, duration:1 }}>
            <motion.div className="w-px h-16 origin-top"
              style={{ background:`linear-gradient(to bottom, ${GOLD}55, transparent)` }}
              animate={{ scaleY:[0,1,0] }}
              transition={{ duration:2.6, repeat:Infinity, ease:"easeInOut", repeatDelay:0.6 }} />
          </motion.div>
        </section>

        {/* ══ PRACTICE ══════════════════════════════════════════════════════ */}
        <PracticeSection />

        {/* ══ ORIGIN ═══════════════════════════════════════════════════════ */}
        <section id="origin" className="grid lg:grid-cols-2 min-h-screen">
          {/* Founders — single shot on Malibu beach */}
          <div className="relative order-2 lg:order-1 min-h-[58vh] lg:min-h-full overflow-hidden">
            <ParallaxImg
              src="/images/founders/founders-malibu-beach.png"
              alt="Roman and Stephen, co-founders of James Roman Advisory, on the Malibu coastline"
              speed={0.1}
              className="absolute inset-0"
              imageClassName="object-contain object-center saturate-[0.42] contrast-[0.9] brightness-[0.82]"
            />
            <div className="absolute inset-0"
              style={{ background:"linear-gradient(105deg, rgba(10,11,14,0.55) 0%, rgba(10,11,14,0.05) 50%, rgba(10,11,14,0.45) 100%)" }} />
            <div className="absolute inset-x-0 bottom-0 h-32"
              style={{ background:"linear-gradient(to top, rgba(10,11,14,0.85), transparent)" }} />
            <Fade className="absolute bottom-8 left-8">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] mb-1" style={{ color:TITAN, opacity:0.55 }}>
                Roman & Stephen · Malibu
              </p>
              <p className="font-heading text-[1.1rem] font-light" style={{ color:CREAM }}>
                Co-founders
              </p>
            </Fade>
          </div>

          {/* THE TYPOGRAPHIC REFERENCE SECTION */}
          <div className="order-1 lg:order-2 flex flex-col justify-center px-[12%] py-24 lg:py-32"
            style={{ background:BG }}>
            <Label>The Origin</Label>
            <RichH baseDelay={0.1} className="mb-10"
              lines={[
                [{text:"Twice in thirty years,",color:TITAN}],
                [{text:"the canyon",color:CREAM},{text:"claimed",color:TITAN}],
                [{text:"the ridge.",color:GOLD}],
              ]} />
            <Line delay={0.5} />
            <div className="mt-10 space-y-7"
              style={{ fontSize:BODY, lineHeight:"1.9", color:TITAN, opacity:0.88, maxWidth:"52ch" }}>
              {[
                "Stephen was born in Malibu. He watched his family's home burn in 1993 and again in 2018. Both times, the hardest part wasn't the loss — it was what came after: contractors who couldn't be trusted, advisors who worked for the insurance company.",
                "Roman spent years overseeing construction across Los Angeles and watched, repeatedly, how quickly standards drift when no one is clearly standing for the person paying the bill.",
                "James Roman Advisory exists because both of them needed it, years before they built it.",
              ].map((p,i) => <Fade key={i} delay={0.55 + i*0.2}><p>{p}</p></Fade>)}
            </div>
            {/* Mid-page CTA — after Origin narrative */}
            <Fade delay={0.95} className="mt-10">
              <Link href={contactPath} data-cursor="inquire"
                className="inline-flex items-center gap-2 text-[0.76rem] uppercase tracking-[0.24em] hover:opacity-100 transition-opacity duration-400"
                style={{ color:GOLD, opacity:0.6 }}>
                Request a private consultation <ArrowRight className="size-3" />
              </Link>
            </Fade>
          </div>
        </section>

        {/* ══ CORNERSTONES — centered, no ghost letters ════════════════════ */}
        <section id="cornerstones" style={{ background:"#080a0d" }}>
          <div className="px-[12%] pt-24 pb-14 text-center"
            style={{ borderBottom:"1px solid rgba(178,168,152,0.07)" }}>
            <Label center>The Cornerstone</Label>
            <RichH center baseDelay={0.05}
              lines={[
                [{text:"The terms",color:CREAM},{text:"we",color:TITAN}],
                [{text:"don't",color:GOLD},{text:"negotiate.",color:CREAM}],
              ]} />
          </div>

          {cornerstones.map(({ n, title, color, body }, i) => (
            <motion.div key={title}
              className="flex flex-col items-center justify-center text-center px-[16%] py-16 lg:py-20"
              style={{
                borderBottom:"1px solid rgba(178,168,152,0.07)",
                background: i%2===0 ? "#080a0d" : "#0d0f16",
              }}
              initial={{ opacity:0 }}
              whileInView={{ opacity:1 }}
              viewport={{ once:true, margin:"-6% 0px" }}
              transition={{ duration:1.0, ease:EASE }}>

              <Fade delay={0.05}>
                <p className="text-[0.72rem] uppercase tracking-[0.32em] mb-5"
                  style={{ color:GOLD, opacity:0.4 }}>{n}</p>
              </Fade>

              <motion.h3
                className="font-heading font-light leading-[0.92] tracking-[-0.025em] mb-5"
                style={{ fontSize:SUB_H, color, textShadow:"0 2px 12px rgba(0,0,0,0.5)" }}
                initial={{ opacity:0, y:22, filter:"blur(8px)" }}
                whileInView={{ opacity:1, y:0, filter:"blur(0px)" }}
                viewport={{ once:true }}
                transition={{ duration:1.15, delay:0.1, ease:EASE }}>
                {title}
              </motion.h3>

              <Fade delay={0.22}>
                <p className="leading-[1.88] max-w-md mx-auto text-center"
                  style={{ color:TITAN, opacity:0.88, fontSize:BODY }}>
                  {body}
                </p>
              </Fade>
            </motion.div>
          ))}
        </section>

        {/* ══ PRIVATE OFFICE — Malibu background ═══════════════════════════ */}
        <section ref={officeRef} id="private-office"
          className="relative min-h-screen flex items-center overflow-hidden">

          <motion.div className="absolute inset-0" style={{ y:heroY, scale:heroScale }}>
            {/* CC0: Point Dume, Malibu by Austin Neill, via Wikimedia Commons / Unsplash. */}
            <Image src="/images/malibu-mountains-ocean-sunset.jpg" alt="Point Dume cliffs, Malibu mountains, and the Pacific Ocean at sunset" fill
              priority
              className="object-cover object-center saturate-[0.58] contrast-[1.08] brightness-[0.46] sepia-[0.12]" sizes="100vw" />
            <div className="absolute inset-0"
              style={{ background:"linear-gradient(to top, rgba(6,9,16,0.98) 0%, rgba(6,12,24,0.84) 48%, rgba(24,16,10,0.56) 100%)" }} />
            <div className="absolute inset-0"
              style={{ background:"radial-gradient(ellipse 76% 38% at 58% 42%, rgba(201,181,138,0.16), rgba(201,181,138,0.045) 42%, transparent 70%)" }} />
            {/* Stars/shimmer dots — pure CSS */}
            {STAR_POINTS.map((point,i) => (
              <div key={i} className="absolute rounded-full" style={{
                width: i%3===0?2:1, height: i%3===0?2:1,
                background:`rgba(236,230,214,${point.opacity})`,
                left:point.left, top:point.top,
                boxShadow:`0 0 ${i%2===0?3:2}px rgba(236,230,214,0.3)`,
              }} />
            ))}
            <div className="absolute inset-x-0 bottom-0 h-1/3"
              style={{ background:"linear-gradient(to top, rgba(10,11,14,0.95), transparent)" }} />
          </motion.div>

          <div className="relative z-10 w-full max-w-6xl mx-auto px-[12%] py-28 grid lg:grid-cols-[0.9fr_0.78fr] gap-16 items-center">
            <div>
              <Fade>
                <p className="text-[0.78rem] uppercase tracking-[0.34em] mb-7"
                  style={{ color:TITAN, opacity:0.82 }}>The Private Office</p>
              </Fade>
              <RichH baseDelay={0.1} className="mb-10"
                lines={[
                  [{text:"Your",color:CREAM},{text:"Private",color:TITAN}],
                  [{text:"Office.",color:GOLD}],
                ]} />
              <Fade delay={0.5}>
                <p className="leading-[1.9] max-w-md mb-12" style={{ color:TITAN, opacity:0.88, fontSize:BODY }}>
                  Every client receives a dedicated digital workspace — real-time transparency on
                  compliance status, document custody, and site activity. Nothing circulates informally.
                </p>
              </Fade>
              <Fade delay={0.65}>
                <Link href="/portal" data-cursor="view"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-3 border px-8 py-3.5 text-[0.86rem] uppercase tracking-[0.2em] hover:opacity-100 transition-opacity duration-400 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[#c9b58a] sm:w-auto"
                  style={{ borderColor:"rgba(201,181,138,0.22)", color:GOLD, opacity:0.82 }}>
                  Access private office <ArrowRight className="size-3" />
                </Link>
              </Fade>
            </div>

            <motion.div data-portal-panel className="w-full max-w-[420px] mx-auto border backdrop-blur-sm p-5 min-h-[560px] overflow-hidden flex flex-col"
              style={{ borderColor:"rgba(201,181,138,0.14)", background:"rgba(6,10,16,0.84)", boxShadow:"0 28px 80px rgba(0,0,0,0.38)" }}
              initial={{ opacity:0, x:50 }}
              whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }}
              transition={{ duration:1.3, delay:0.35, ease:EASE }}>

              <div className="flex items-start justify-between pb-4 mb-4"
                style={{ borderBottom:"1px solid rgba(201,181,138,0.08)" }}>
                <div>
                  <p className="text-[0.58rem] uppercase tracking-[0.24em] mb-2" style={{ color:GOLD, opacity:0.56 }}>The Private Office</p>
                  <p className="font-heading text-[1.1rem] font-light" style={{ color:CREAM }}>Engagement file</p>
                  <p className="text-[0.74rem] mt-1" style={{ color:TITAN, opacity:0.48 }}>Malibu estate · Active · Week 7</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[0.54rem] uppercase tracking-widest border px-2 py-1"
                    style={{ borderColor:"rgba(201,181,138,0.15)", color:GOLD, opacity:0.7 }}>Sample engagement</span>
                  <span className="text-[0.54rem] uppercase tracking-widest border px-2 py-1"
                    style={{ borderColor:"rgba(178,168,152,0.12)", color:TITAN, opacity:0.46 }}>Restricted access</span>
                </div>
              </div>

              <div className="grid grid-cols-2 min-[421px]:grid-cols-3 gap-3 mb-4 pb-4"
                style={{ borderBottom:"1px solid rgba(201,181,138,0.07)" }}>
                {[{l:"Progress",v:64,s:"%"},{l:"Documents logged",v:24,s:""},{l:"Site visits",v:9,s:""}].map(({ l,v,s }, index) => (
                  <div key={l} className={`text-center ${index === 2 ? "max-[420px]:col-span-2" : ""}`}>
                    <p className="font-heading text-[1.46rem] font-light" style={{ color:GOLD }}>
                      {v}{s ? <span>{s}</span> : null}
                    </p>
                    <p className="text-[0.62rem] uppercase tracking-[0.2em] mt-1" style={{ color:TITAN, opacity:0.42 }}>{l}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {[
                  ["Chain of custody", "Intact"],
                  ["Evidence review", "Current"],
                  ["Client sign-offs", "Current"],
                ].map(([label, detail]) => (
                  <div key={label} className="flex items-center gap-3 py-1.5">
                    <span className="text-[0.72rem]" style={{ color:TITAN, opacity:0.5 }}>{label}</span>
                    <span className="ml-auto text-[0.72rem] uppercase tracking-[0.16em]" style={{ color:GOLD, opacity:0.72 }}>{detail}</span>
                  </div>
                ))}
              </div>

              <div className="grid min-[561px]:grid-cols-2 gap-4 pt-4 pb-4 mt-auto mb-4"
                style={{ borderTop:"1px solid rgba(201,181,138,0.07)", borderBottom:"1px solid rgba(201,181,138,0.07)" }}>
                <div className="border p-3" style={{ borderColor:"rgba(201,181,138,0.1)", background:"rgba(201,181,138,0.025)" }}>
                  <p className="text-[0.62rem] uppercase tracking-[0.2em] mb-2" style={{ color:TITAN, opacity:0.42 }}>Airborne asbestos</p>
                  <p className="font-mono text-[1.18rem] leading-none whitespace-nowrap" style={{ color:CREAM, fontVariantNumeric:"tabular-nums" }}>0.008 f/cc</p>
                  <p className="text-[0.62rem] mt-2" style={{ color:GOLD, opacity:0.65 }}>Below the 0.01 f/cc clearance limit</p>
                  <p className="text-[0.56rem] uppercase tracking-[0.18em] mt-1" style={{ color:TITAN, opacity:0.38 }}>independent PCM</p>
                </div>
                <div className="space-y-2">
                  {[
                    ["Site safety", "All personnel cleared"],
                    ["Asbestos notification", "SCAQMD Rule 1403 · filed · #····7743"],
                    ["Next milestone", "Independent clearance test · Week 8"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[0.58rem] uppercase tracking-[0.18em]" style={{ color:TITAN, opacity:0.36 }}>{label}</p>
                      <p className="text-[0.68rem] leading-snug" style={{ color:TITAN, opacity:0.66 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══ CONSULTATION / LEGAL ════════════════════════════════════════ */}
        <section id="consultation" className="px-[12%] py-28"
          style={{ borderTop:"1px solid rgba(178,168,152,0.07)" }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <Fade>
                <div className="max-w-xl">
                <Label>Get in touch</Label>
                <RichH baseDelay={0.05} className="mb-8"
                  lines={[
                    [{text:"Request a",color:CREAM}],
                    [{text:"confidential",color:TITAN}],
                    [{text:"consultation.",color:CREAM}],
                  ]} />
                <p className="leading-[1.9] max-w-xl mb-10" style={{ color:TITAN, opacity:0.88, fontSize:BODY }}>
                  Share only what is necessary. Full document exchange happens after an engagement is
                  accepted and secure client access is issued.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {["No portal trackers"].map((l) => (
                    <span key={l} className="text-[0.72rem] uppercase tracking-widest border px-2.5 py-1"
                      style={{ borderColor:"rgba(178,168,152,0.14)", color:TITAN, opacity:0.55 }}>{l}</span>
                  ))}
                </div>
              </div>
              </Fade>
              <Fade delay={0.18}>
                <div
                  className="border-t pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0"
                  style={{ borderColor:"rgba(178,168,152,0.13)" }}
                >
                  <ConsultationForm />
                </div>
              </Fade>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══════════════════════════════════════════════════════ */}
        <footer className="px-[12%] py-10"
          style={{ borderTop:"1px solid rgba(178,168,152,0.07)" }}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <BrandLogo className="h-9 opacity-55" />
              <div>
                <p className="text-[0.84rem]" style={{ color:TITAN, opacity:0.46 }}>© 2026 James Roman Advisory LLC</p>
                <p className="text-[0.72rem] mt-0.5" style={{ color:TITAN, opacity:0.3 }}>Malibu, California · NDA-protected engagements</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[0.82rem] uppercase tracking-[0.18em]"
              style={{ color:TITAN, opacity:0.34 }}>
              {[["Practice","#the-process"],["Origin","#origin"],["The Cornerstone","#cornerstones"],["Contact",contactPath]].map(([l,h]) => (
                <Link key={l} href={h} className="hover:opacity-70 transition-opacity duration-300">{l}</Link>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
