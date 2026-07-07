"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";

/*
 * Redesign preview — "Warm Authority" direction.
 * Design system per docs/redesign strategy:
 *   charcoal #1a2332 · cream #faf8f6 · taupe #9d8b7e · fog #e8e4df · light #f4f1ed
 *   Serif (Georgia) headings, system sans body, generous spacing.
 */

const TOKENS = {
  "--jr-dark": "#1a2332",
  "--jr-cream": "#faf8f6",
  "--jr-taupe": "#9d8b7e",
  "--jr-fog": "#e8e4df",
  "--jr-light": "#f4f1ed",
  "--jr-text": "#3a3a3a",
  "--jr-serif": "Georgia, 'Times New Roman', serif",
} as React.CSSProperties;

const PILLARS = [
  {
    title: "Advocacy, Not Remediation",
    body: "We advise. We don't perform work, execute contracts, or profit from implementation. This keeps our judgment clear and our interests aligned with yours alone.",
  },
  {
    title: "Limited Practice",
    body: "Six engagements annually. This constraint is deliberate. Depth of attention and quality of judgment demand scarcity. We accept only matters where we can offer genuine value.",
  },
  {
    title: "Exclusive Loyalty",
    body: "Your interests frame every analysis. We question every contract before signature, challenge every remediation estimate, and verify every claim. Vigilance is our currency.",
  },
];

const SERVICES = [
  {
    label: "Environmental",
    title: "Moisture & Mold",
    body: "Assessment, remediation review, and prevention strategies for properties where moisture poses risk to structure and inhabitant health.",
  },
  {
    label: "Environmental",
    title: "Fire & Smoke Risk",
    body: "Wildfire exposure analysis, defensibility assessment, and preparedness protocols for properties in high-risk zones.",
  },
  {
    label: "Structural",
    title: "Legacy Materials",
    body: "Identification and risk assessment of asbestos, lead, and other regulated substances in older properties.",
  },
  {
    label: "Environmental",
    title: "Air Quality",
    body: "Indoor air assessment, ventilation review, and mitigation strategies for health-conscious owners.",
  },
  {
    label: "Due Diligence",
    title: "Pre-Acquisition Diligence",
    body: "Comprehensive environmental and structural review before acquisition, positioning you with clear-eyed assessment and negotiating advantage.",
  },
  {
    label: "Due Diligence",
    title: "Contractor Vetting",
    body: "Independent review of contractor credentials, methodologies, and cost justification before you commit.",
  },
];

const inputClasses =
  "w-full border border-[var(--jr-fog)] bg-[var(--jr-cream)] px-4 py-3 text-[0.95rem] text-[var(--jr-dark)] outline-none transition focus:border-[var(--jr-taupe)] focus:ring-2 focus:ring-[var(--jr-taupe)]/20";

const labelClasses =
  "mb-2 block text-[0.75rem] uppercase tracking-[0.08em] text-[var(--jr-taupe)]";

function ConsultationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "submitted" | "error"
  >("idle");

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");

    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          Object.fromEntries(new FormData(form).entries())
        ),
      });
      if (!response.ok) throw new Error("Request failed");
      form.reset();
      setStatus("submitted");
    } catch {
      setStatus("error");
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a2332]/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Request a consultation"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto bg-[var(--jr-cream)] p-8 sm:p-10"
            style={TOKENS}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-5 top-5 text-xl text-[var(--jr-text)] transition hover:text-[var(--jr-taupe)]"
            >
              ✕
            </button>

            {status === "submitted" ? (
              <div className="py-8 text-center">
                <h3 className="mb-4 text-2xl text-[var(--jr-dark)] [font-family:var(--jr-serif)]">
                  Thank You
                </h3>
                <p className="mb-8 leading-relaxed text-[var(--jr-text)]">
                  We&apos;ve received your consultation request. Every inquiry is
                  reviewed personally — we&apos;ll be in touch within two business
                  days.
                </p>
                <button
                  onClick={onClose}
                  className="border border-[var(--jr-dark)] px-8 py-3 text-sm tracking-wide text-[var(--jr-dark)] transition hover:bg-[var(--jr-dark)] hover:text-[var(--jr-cream)]"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 className="mb-3 text-[1.8rem] leading-tight text-[var(--jr-dark)] [font-family:var(--jr-serif)]">
                  Request a Consultation
                </h2>
                <p className="mb-8 text-[0.95rem] leading-relaxed text-[var(--jr-text)]">
                  Tell us about your property and what brought you here.
                  Everything you share is held in confidence.
                </p>

                <form onSubmit={handleSubmit} className="grid gap-5">
                  <input
                    name="company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  <div>
                    <label htmlFor="jr-name" className={labelClasses}>
                      Your Name
                    </label>
                    <input
                      id="jr-name"
                      type="text"
                      name="name"
                      autoComplete="name"
                      required
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label htmlFor="jr-email" className={labelClasses}>
                      Email
                    </label>
                    <input
                      id="jr-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label htmlFor="jr-market" className={labelClasses}>
                      Property Location
                    </label>
                    <input
                      id="jr-market"
                      type="text"
                      name="market"
                      placeholder="Malibu, CA"
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label htmlFor="jr-matter" className={labelClasses}>
                      Matter Type
                    </label>
                    <select
                      id="jr-matter"
                      name="matter"
                      className={inputClasses}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select a matter type…
                      </option>
                      <option value="Moisture & Mold">Moisture & Mold</option>
                      <option value="Fire & Smoke Risk">
                        Fire & Smoke Risk
                      </option>
                      <option value="Legacy Materials">Legacy Materials</option>
                      <option value="Air Quality">Air Quality</option>
                      <option value="Pre-Acquisition Diligence">
                        Pre-Acquisition Diligence
                      </option>
                      <option value="Contractor Vetting">
                        Contractor Vetting
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="jr-message" className={labelClasses}>
                      Brief Context
                    </label>
                    <textarea
                      id="jr-message"
                      name="message"
                      placeholder="What brings you to us?"
                      required
                      rows={4}
                      className={`${inputClasses} resize-y`}
                    />
                  </div>

                  {status === "error" ? (
                    <p role="alert" className="text-sm text-[#a05252]">
                      That didn&apos;t go through, and it&apos;s on our end. Try
                      again in a moment — we&apos;ll be here.
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full border border-[var(--jr-dark)] bg-[var(--jr-dark)] px-8 py-3 text-sm tracking-wide text-[var(--jr-cream)] transition hover:bg-transparent hover:text-[var(--jr-dark)] disabled:opacity-50"
                  >
                    {status === "submitting" ? "Submitting…" : "Submit Request"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Navigation({ onConsultClick }: { onConsultClick: () => void }) {
  const navLink =
    "text-[var(--jr-dark)] transition hover:text-[var(--jr-taupe)]";
  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--jr-fog)] bg-[var(--jr-cream)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-16">
        <a
          href="#top"
          className="text-2xl text-[var(--jr-dark)] [font-family:var(--jr-serif)]"
        >
          James Roman
        </a>
        <ul className="flex items-center gap-6 text-sm md:gap-10">
          <li>
            <a href="#practice" className={navLink}>
              The Practice
            </a>
          </li>
          <li>
            <a href="#origin" className={navLink}>
              Origin
            </a>
          </li>
          <li>
            <button onClick={onConsultClick} className={navLink}>
              Consult
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function Hero({ onConsultClick }: { onConsultClick: () => void }) {
  const reduced = useReducedMotion();
  return (
    <section
      id="top"
      className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:gap-24 md:px-16 md:py-32"
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <p className="mb-6 text-2xl italic text-[var(--jr-taupe)] [font-family:var(--jr-serif)]">
          Counsel, not remediation.
        </p>
        <h1 className="mb-8 text-4xl leading-[1.2] text-[var(--jr-dark)] [font-family:var(--jr-serif)] [text-wrap:balance] md:text-5xl">
          Property Advocacy for Those Who Deserve Better
        </h1>
        <p className="mb-10 max-w-xl text-lg leading-[1.7] text-[var(--jr-text)]">
          When hazards emerge — moisture, fire, legacy materials, air quality —
          owners need judgment applied exclusively on their behalf. Not sellers
          covering risk. Not contractors protecting margin. Independent counsel.
        </p>
        <button
          onClick={onConsultClick}
          className="border border-[var(--jr-dark)] bg-[var(--jr-dark)] px-8 py-3 text-sm tracking-wide text-[var(--jr-cream)] transition hover:bg-transparent hover:text-[var(--jr-dark)]"
        >
          Request Consultation
        </button>
      </motion.div>
      <motion.div
        aria-hidden
        className="h-72 bg-gradient-to-br from-[var(--jr-fog)] to-[var(--jr-light)] md:h-[400px]"
        initial={reduced ? false : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
      />
    </section>
  );
}

function HowWeWork() {
  return (
    <section className="bg-[var(--jr-light)]">
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-16 md:py-32">
        <div className="mb-16 max-w-3xl">
          <h2 className="mb-4 text-3xl text-[var(--jr-dark)] [font-family:var(--jr-serif)] md:text-4xl">
            How We Work
          </h2>
          <p className="text-lg leading-[1.8] text-[var(--jr-text)]">
            Three commitments shape every engagement. Each reflects our belief
            that property owners deserve counsel that serves only their
            interests.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="border-l-[3px] border-[var(--jr-taupe)] bg-[var(--jr-cream)] p-8 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(26,35,50,0.08)]"
            >
              <h3 className="mb-4 text-xl text-[var(--jr-dark)] [font-family:var(--jr-serif)]">
                {pillar.title}
              </h3>
              <p className="text-[0.95rem] leading-[1.7] text-[var(--jr-text)]">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="practice" className="mx-auto max-w-7xl px-6 py-20 md:px-16 md:py-32">
      <h2 className="mb-4 text-3xl text-[var(--jr-dark)] [font-family:var(--jr-serif)] md:text-4xl">
        Domains of Expertise
      </h2>
      <p className="mb-16 max-w-3xl text-lg leading-[1.8] text-[var(--jr-text)]">
        We specialize in the environmental and structural hazards that matter
        most to sophisticated property owners — matters that demand both
        technical depth and independent judgment. Six specializations. One
        commitment: your protection.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        {SERVICES.map((service) => (
          <div
            key={service.title}
            className="border border-[var(--jr-fog)] bg-[var(--jr-cream)] p-8 transition duration-300 hover:-translate-y-1 hover:border-[var(--jr-taupe)] hover:shadow-[0_6px_16px_rgba(26,35,50,0.1)]"
          >
            <span className="mb-3 block text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[var(--jr-taupe)]">
              {service.label}
            </span>
            <h3 className="mb-3 text-xl text-[var(--jr-dark)] [font-family:var(--jr-serif)]">
              {service.title}
            </h3>
            <p className="text-[0.95rem] leading-[1.7] text-[var(--jr-text)]">
              {service.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Origin() {
  return (
    <section id="origin" className="bg-[var(--jr-light)]">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:gap-24 md:px-16 md:py-32">
        <div>
          <h2 className="mb-6 text-3xl text-[var(--jr-dark)] [font-family:var(--jr-serif)] md:text-4xl">
            Origin
          </h2>
          <div className="space-y-4 text-[0.95rem] leading-[1.8] text-[var(--jr-text)]">
            <p>
              This practice was born from years spent on the other side —
              representing contractors and remediation firms. That experience
              revealed a structural gap: property owners facing environmental
              hazards rarely had counsel working exclusively for them.
            </p>
            <p>
              Contractors are incentivized to remediate. Sellers are
              incentivized to minimize. Inspectors walk a line between certainty
              and liability. The owner — the one bearing the actual risk and
              cost — often relies on guidance shaped by someone else&apos;s
              incentives.
            </p>
            <p>
              Independent counsel on these matters is rare. It should not be.
              This practice exists to fill that gap.
            </p>
          </div>
        </div>
        <div
          aria-hidden
          className="h-72 bg-gradient-to-br from-[var(--jr-fog)] to-[#d4cfc7] md:h-[400px]"
        />
      </div>
    </section>
  );
}

function FinalCta({ onConsultClick }: { onConsultClick: () => void }) {
  return (
    <section className="border-t border-[var(--jr-fog)]">
      <div className="mx-auto max-w-7xl px-6 py-20 text-center md:px-16 md:py-32">
        <h2 className="mb-6 text-3xl text-[var(--jr-dark)] [font-family:var(--jr-serif)] md:text-4xl">
          Begin a Conversation
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg leading-[1.8] text-[var(--jr-text)]">
          If your property presents hazards you need to understand, or if
          you&apos;re evaluating an acquisition and want clarity before
          deciding, we&apos;re ready to listen.
        </p>
        <button
          onClick={onConsultClick}
          className="border border-[var(--jr-dark)] px-8 py-3 text-sm tracking-wide text-[var(--jr-dark)] transition hover:bg-[var(--jr-dark)] hover:text-[var(--jr-cream)]"
        >
          Request a Confidential Consultation
        </button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[var(--jr-dark)] px-6 py-10 text-center text-sm text-[var(--jr-cream)]">
      <p>
        &copy; {new Date().getFullYear()} James Roman Advisory. Independent
        counsel for those who demand undivided loyalty.
      </p>
    </footer>
  );
}

export default function RedesignedHomepage() {
  const [showModal, setShowModal] = useState(false);
  const openModal = () => setShowModal(true);

  return (
    <div
      className="min-h-screen bg-[var(--jr-cream)] font-sans text-[var(--jr-text)] antialiased"
      style={TOKENS}
    >
      <Navigation onConsultClick={openModal} />
      <Hero onConsultClick={openModal} />
      <HowWeWork />
      <Services />
      <Origin />
      <FinalCta onConsultClick={openModal} />
      <Footer />
      <ConsultationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
