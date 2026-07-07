"use client";

import { useRef, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";

// Design tokens for premium authority
const COLORS = {
  dark: "#1a2332",
  cream: "#faf8f6",
  taupe: "#9d8b7e",
  grey: "#e8e4df",
  light: "#f4f1ed",
  text: "#3a3a3a",
};

const DARK_COLORS = {
  dark: "#f5f3f0",
  cream: "#131820",
  taupe: "#c4a87e",
  grey: "#2a2820",
  light: "#1a1410",
  text: "#e5e5e5",
};

function ConsultationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted">(
    "idle"
  );
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    // Simulate form submission
    setTimeout(() => {
      setStatus("submitted");
      setTimeout(() => {
        onClose();
        setStatus("idle");
        if (formRef.current) formRef.current.reset();
      }, 2000);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="relative w-full max-w-md rounded-sm bg-white p-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-2xl text-gray-600 hover:text-gray-900"
        >
          ✕
        </button>

        {status === "submitted" ? (
          <div className="text-center">
            <h3 className="mb-4 text-2xl font-serif text-gray-900">
              Thank You
            </h3>
            <p className="mb-6 text-gray-700">
              We&apos;ve received your consultation request. We&apos;ll review your matter
              and be in touch within 48 hours.
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-2 text-3xl font-serif text-gray-900">
              Request a Consultation
            </h2>
            <p className="mb-6 text-sm text-gray-700">
              Tell us about your property and what brought you here. We&apos;ll
              review and be in touch within 48 hours.
            </p>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Your Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full border border-gray-300 px-4 py-3 text-gray-900 transition focus:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full border border-gray-300 px-4 py-3 text-gray-900 transition focus:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Property Location
                </label>
                <input
                  type="text"
                  name="property"
                  placeholder="City, State"
                  required
                  className="w-full border border-gray-300 px-4 py-3 text-gray-900 transition focus:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Matter Type
                </label>
                <select
                  name="matter"
                  required
                  className="w-full border border-gray-300 px-4 py-3 text-gray-900 transition focus:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-100"
                >
                  <option value="">Select a matter type...</option>
                  <option value="moisture">Moisture & Mold</option>
                  <option value="fire">Fire & Smoke Risk</option>
                  <option value="legacy">Legacy Materials</option>
                  <option value="air">Air Quality</option>
                  <option value="preacq">Pre-Acquisition Diligence</option>
                  <option value="contractor">Contractor Vetting</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Brief Description
                </label>
                <textarea
                  name="message"
                  placeholder="What brings you to us?"
                  required
                  rows={4}
                  className="w-full border border-gray-300 px-4 py-3 text-gray-900 transition focus:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-100"
                />
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-gray-900 px-8 py-3 text-white transition hover:bg-white hover:text-gray-900 disabled:opacity-50"
              >
                {status === "submitting" ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

function Navigation({ onConsultClick }: { onConsultClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm transition"
      style={{
        backgroundColor: COLORS.cream,
        borderColor: COLORS.grey,
      }}
    >
      <div className="flex items-center justify-between px-8 py-6">
        <a href="#hero" className="text-2xl font-serif text-gray-900">
          James Roman
        </a>
        <div className="flex items-center gap-8">
          <ul className="flex gap-8 text-sm">
            <li>
              <a href="#services" className="text-gray-900 hover:text-gray-600">
                The Practice
              </a>
            </li>
            <li>
              <a href="#about" className="text-gray-900 hover:text-gray-600">
                Origin
              </a>
            </li>
            <li>
              <button
                onClick={onConsultClick}
                className="text-gray-900 hover:text-gray-600"
              >
                Consult
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

function Hero({ onConsultClick }: { onConsultClick: () => void }) {
  return (
    <section id="hero" className="grid grid-cols-2 gap-16 px-16 py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="mb-6 text-2xl italic text-gray-500">
          Counsel, not remediation.
        </div>
        <h1 className="mb-8 text-5xl font-serif leading-tight text-gray-900">
          Property Advocacy for Those Who Deserve Better
        </h1>
        <p className="mb-8 max-w-xl text-lg leading-relaxed text-gray-700">
          When hazards emerge&mdash;moisture, fire, legacy materials, air
          quality&mdash;owners need judgment applied exclusively on their behalf. Not
          sellers covering risk. Not contractors protecting margin. Independent
          counsel.
        </p>
        <button
          onClick={onConsultClick}
          className="border-2 border-gray-900 px-8 py-3 text-gray-900 transition hover:bg-gray-900 hover:text-white"
        >
          Request Consultation
        </button>
      </motion.div>
      <motion.div
        className="bg-gradient-to-br from-gray-300 to-gray-200"
        style={{ height: "400px" }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
    </section>
  );
}

function HowWeWork() {
  const pillars = [
    {
      title: "Advocacy, Not Remediation",
      description:
        "We advise. We don't perform work, execute contracts, or profit from implementation. This keeps our judgment clear and our interests aligned with yours alone.",
    },
    {
      title: "Limited Practice",
      description:
        "Six engagements annually. This constraint is deliberate. Depth of attention and quality of judgment demand scarcity. We accept only matters where we can offer genuine value.",
    },
    {
      title: "Exclusive Loyalty",
      description:
        "Your interests frame every analysis. We question every contract before signature, challenge every remediation estimate, and verify every claim. Vigilance is our currency.",
    },
  ];

  return (
    <section className="bg-gray-100 px-16 py-32">
      <div className="mb-16">
        <h2 className="mb-4 text-4xl font-serif text-gray-900">How We Work</h2>
        <p className="max-w-2xl text-lg text-gray-700">
          Three commitments shape every engagement. Each reflects our belief
          that property owners deserve counsel that serves only their interests.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {pillars.map((pillar, i) => (
          <motion.div
            key={i}
            className="border-l-4 border-gray-500 bg-white p-8 transition hover:shadow-lg"
            style={{ borderColor: COLORS.taupe }}
            whileHover={{ y: -4 }}
          >
            <h3 className="mb-4 text-xl font-serif text-gray-900">
              {pillar.title}
            </h3>
            <p className="text-gray-700">{pillar.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Services() {
  const services = [
    {
      label: "Environmental",
      title: "Moisture & Mold",
      description:
        "Assessment, remediation review, and prevention strategies for properties where moisture poses risk to structure and inhabitant health.",
    },
    {
      label: "Environmental",
      title: "Fire & Smoke Risk",
      description:
        "Wildfire exposure analysis, defensibility assessment, and preparedness protocols for properties in high-risk zones.",
    },
    {
      label: "Structural",
      title: "Legacy Materials",
      description:
        "Identification and risk assessment of asbestos, lead, and other regulated substances in older properties.",
    },
    {
      label: "Environmental",
      title: "Air Quality",
      description:
        "Indoor air assessment, ventilation review, and mitigation strategies for health-conscious owners.",
    },
    {
      label: "Due Diligence",
      title: "Pre-Acquisition Diligence",
      description:
        "Comprehensive environmental and structural review before acquisition, positioning you with clear-eyed assessment and negotiating advantage.",
    },
    {
      label: "Due Diligence",
      title: "Contractor Vetting",
      description:
        "Independent review of contractor credentials, methodologies, and cost justification before you commit.",
    },
  ];

  return (
    <section id="services" className="px-16 py-32">
      <h2 className="mb-4 text-4xl font-serif text-gray-900">
        Domains of Expertise
      </h2>
      <p className="mb-16 max-w-3xl text-lg text-gray-700">
        We specialize in the environmental and structural hazards that matter
        most to sophisticated property owners&mdash;matters that demand both technical
        depth and independent judgment. Six specializations. One commitment: your
        protection.
      </p>

      <div className="grid grid-cols-2 gap-8">
        {services.map((service, i) => (
          <motion.div
            key={i}
            className="border border-gray-300 bg-white p-8 transition"
            whileHover={{ y: -6, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {service.label}
            </div>
            <h3 className="mb-3 text-xl font-serif text-gray-900">
              {service.title}
            </h3>
            <p className="text-gray-700">{service.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="grid grid-cols-2 gap-16 bg-gray-100 px-16 py-32">
      <div>
        <h2 className="mb-6 text-4xl font-serif text-gray-900">Origin</h2>
        <p className="mb-4 text-gray-700">
          This practice was born from years spent on the other side—representing
          contractors and remediation firms. That experience revealed a
          structural gap: property owners facing environmental hazards rarely
          had counsel working exclusively for them.
        </p>
        <p className="mb-4 text-gray-700">
          Contractors are incentivized to remediate. Sellers are incentivized to
          minimize. Inspectors walk a line between certainty and liability. The
          owner—the one bearing the actual risk and cost—often relies on
          guidance shaped by someone else's incentives.
        </p>
        <p className="text-gray-700">
          Independent counsel on these matters is rare. It should not be. This
          practice exists to fill that gap.
        </p>
      </div>
      <div className="bg-gradient-to-br from-gray-300 to-gray-200" />
    </section>
  );
}

function FinalCTA({ onConsultClick }: { onConsultClick: () => void }) {
  return (
    <section className="border-t border-gray-300 px-16 py-32 text-center">
      <h2 className="mb-6 text-4xl font-serif text-gray-900">
        Begin a Conversation
      </h2>
      <p className="mb-8 inline-block max-w-xl text-lg text-gray-700">
        If your property presents hazards you need to understand, or if you&apos;re
        evaluating an acquisition and want clarity before deciding, we&apos;re ready
        to listen.
      </p>
      <br />
      <button
        onClick={onConsultClick}
        className="border-2 border-gray-900 px-8 py-3 text-gray-900 transition hover:bg-gray-900 hover:text-white"
      >
        Request a Confidential Consultation
      </button>
    </section>
  );
}

function Footer() {
  return (
    <footer
      className="py-8 text-center text-sm"
      style={{ backgroundColor: COLORS.dark, color: COLORS.cream }}
    >
      <p>
        &copy; 2025 James Roman Advisory. Property counsel for those who demand
        independence and expertise.
      </p>
    </footer>
  );
}

export default function RedesignedHomepage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation onConsultClick={() => setShowModal(true)} />
      <Hero onConsultClick={() => setShowModal(true)} />
      <HowWeWork />
      <Services />
      <About />
      <FinalCTA onConsultClick={() => setShowModal(true)} />
      <Footer />
      <ConsultationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
