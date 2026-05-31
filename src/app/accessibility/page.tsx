import React from "react";
import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description:
    "James Roman Advisory accessibility commitment. WCAG 2.1 Level AA conformance target.",
};

export default function AccessibilityPage() {
  return (
    <LegalLayout
      breadcrumb="Accessibility"
      eyebrow="Legal"
      title="Accessibility"
      titleAccent="Statement."
      lead="A practice that values precision in laboratory work owes its readers no less. We commit to maintaining this site at WCAG 2.1 Level AA conformance, and to fixing what is found wanting."
    >
      <p className="legal-effective">
        <strong>Effective:</strong> January 1, 2026 &nbsp;·&nbsp;
        <strong>Last reviewed:</strong> January 1, 2026
      </p>

      <h2><em>i.</em> Our commitment.</h2>

      <p>
        James Roman Advisory is committed to ensuring that this website is accessible to people with
        disabilities. We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA,
        the standard adopted by the U.S. Department of Justice for the Americans with Disabilities Act (ADA)
        and recognized internationally as the baseline for accessible digital content.
      </p>

      <h2><em>ii.</em> What we have done.</h2>

      <ul>
        <li>Color contrast verified at 4.5:1 minimum for body text and 3:1 minimum for large text against the page background.</li>
        <li>All interactive elements (links, buttons, form fields) have a visible keyboard focus indicator.</li>
        <li>Form labels are explicitly associated with their inputs.</li>
        <li>Navigation is operable via keyboard alone.</li>
        <li>Decorative graphics (the 8-pointed star ornaments) are marked aria-hidden so they are not announced by screen readers.</li>
        <li>Animations respect the prefers-reduced-motion media query and are reduced or disabled for visitors who request it at the operating-system level.</li>
        <li>Page structure uses semantic landmarks (header, nav, main, footer) to support assistive-technology navigation.</li>
        <li>Heading hierarchy (h1 through h3) is preserved within each page for outline navigation.</li>
        <li>Text resizes to at least 200% without loss of content or functionality.</li>
      </ul>

      <h2><em>iii.</em> What we cannot yet promise.</h2>

      <p>
        Some content on this site — particularly third-party fonts loaded from Google Fonts and PDFs that
        may, in the future, be linked from engagement letters — is outside our direct control. Where
        third-party resources do not meet the same standard, we will provide an accessible alternative
        on request.
      </p>
      <p>
        We do not yet provide a full programmatic alternative for the marquee animation on the landing page,
        beyond honoring prefers-reduced-motion. The marquee is decorative and its content (a list of counsel
        areas) appears in fully accessible form elsewhere on the page.
      </p>

      <h2><em>iv.</em> If something is not working.</h2>

      <p>
        If you encounter content on this site that is difficult or impossible to use because of an
        accessibility barrier, please tell us. We will respond personally and, where the barrier is one
        we can address, we will fix it — and confirm the fix back to you.
      </p>
      <ul>
        <li><strong>Email:</strong> accessibility@jamesroman.la</li>
        <li><strong>Telephone:</strong> +1 (310) 430-2500</li>
        <li><strong>Post:</strong> Roman James Advisory, LLC — Accessibility — Malibu, California</li>
      </ul>
      <p>
        If you require information from this site in an alternative format — large print, plain-text email,
        audio — we are happy to provide it. There is no charge for this service.
      </p>

      <h2><em>v.</em> Review schedule.</h2>

      <p>
        We review this site for accessibility conformance at least annually, and after any significant
        content or design change. The &ldquo;Last reviewed&rdquo; date at the top of this page indicates
        the most recent review.
      </p>

      <div className="legal-note">
        <strong>One last note</strong>
        <p>
          Accessibility is not a checklist we complete and forget. It is a posture: making the work
          of this practice legible to anyone who needs to read it, including readers we have not yet
          met. If we have fallen short for you, the failure is ours, and we would like to know about it.
        </p>
      </div>
    </LegalLayout>
  );
}
