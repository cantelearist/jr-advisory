import React from "react";
import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Mutual Non-Disclosure Agreement",
  description:
    "Sample mutual NDA used by James Roman Advisory. Discretion is a contractual obligation, not a marketing claim.",
};

export default function NdaPage() {
  return (
    <LegalLayout
      breadcrumb="NDA Sample"
      eyebrow="Standing Form"
      title="The Mutual"
      titleAccent="Non-Disclosure."
      lead="Discretion is not a marketing claim — it is a contractual obligation we sign at the first meeting, before a property address has changed hands. The form below is the version we use as a starting point. Most clients sign it as written; some adjust it through counsel. Either is fine."
    >
      <div className="legal-callout">
        <strong>Important — Sample Only</strong>
        This document is provided for review and as a starting point. The operative version executed
        for any specific engagement is delivered separately, dated, and signed by both parties. We
        strongly recommend that any party considering a non-disclosure agreement review the form with
        their own counsel before signing. Nothing on this page constitutes legal advice.
      </div>

      <h2 style={{ marginTop: "2rem" }}>Mutual Non-Disclosure Agreement</h2>

      <p>
        This Mutual Non-Disclosure Agreement (the &ldquo;Agreement&rdquo;) is entered into as of [Effective
        Date] (the &ldquo;Effective Date&rdquo;) by and between Roman James Advisory, LLC, a California
        limited liability company (&ldquo;JRA&rdquo;), and [Client Name] (&ldquo;Client&rdquo; and, together
        with JRA, the &ldquo;Parties&rdquo; and each, a &ldquo;Party&rdquo;).
      </p>

      <h2><em>i.</em> Purpose.</h2>
      <p>
        The Parties wish to evaluate and, if mutually agreed, undertake a confidential professional
        engagement relating to environmental advisory services in connection with one or more residential
        properties (the &ldquo;Purpose&rdquo;). In furtherance of the Purpose, each Party may disclose to the
        other certain information that is confidential or proprietary in nature.
      </p>

      <h2><em>ii.</em> Confidential information.</h2>
      <p>
        &ldquo;Confidential Information&rdquo; means any non-public information disclosed by one Party (the
        &ldquo;Disclosing Party&rdquo;) to the other (the &ldquo;Receiving Party&rdquo;), in any form, that
        is identified as confidential or that, given its nature or the circumstances of disclosure, a
        reasonable person would understand to be confidential. Confidential Information includes, without
        limitation:
      </p>
      <ul>
        <li>The identities of the Parties, their family members, household staff, agents, and counsel.</li>
        <li>Any property address, parcel number, or location information disclosed by Client.</li>
        <li>The existence, nature, and content of the engagement contemplated under this Agreement.</li>
        <li>Test results, sampling data, photographs, reports, and other deliverables produced by JRA.</li>
        <li>Vendor names, scopes of work, fee arrangements, and bid materials prepared in connection with the engagement.</li>
        <li>Insurance, financial, medical, and household information disclosed by Client.</li>
        <li>JRA&rsquo;s proprietary methods, vendor bench, sampling protocols, and analytical templates.</li>
      </ul>

      <h2><em>iii.</em> Exclusions.</h2>
      <p>
        Confidential Information does not include information that the Receiving Party can demonstrate by
        competent evidence: (a) was generally available to the public at the time of disclosure; (b) became
        generally available to the public after disclosure other than through breach of this Agreement;
        (c) was rightfully in the Receiving Party&rsquo;s possession before receipt from the Disclosing Party,
        without obligation of confidentiality; or (d) was independently developed by the Receiving Party
        without use of or reference to the Confidential Information.
      </p>

      <h2><em>iv.</em> Obligations.</h2>
      <p>The Receiving Party shall:</p>
      <ol>
        <li>Hold Confidential Information in strict confidence and use the same standard of care it uses to protect its own confidential information of similar importance, but in no event less than reasonable care.</li>
        <li>Use Confidential Information solely for the Purpose and for no other purpose.</li>
        <li>Disclose Confidential Information only to its officers, employees, professional advisors, and (in JRA&rsquo;s case) accredited laboratories and pre-vetted vendors who (a) have a bona fide need to know for the Purpose and (b) are bound by written or professional obligations of confidentiality at least as protective as those in this Agreement.</li>
        <li>Not copy, reproduce, summarize, or excerpt Confidential Information except as reasonably necessary for the Purpose, and not use it to derive any commercial benefit beyond the Purpose.</li>
        <li>Maintain administrative, technical, and physical safeguards designed to prevent unauthorized access to or disclosure of Confidential Information.</li>
      </ol>

      <h2><em>v.</em> Compelled disclosure.</h2>
      <p>
        If the Receiving Party is required by law, subpoena, regulatory process, or court order to disclose
        any Confidential Information, the Receiving Party shall, to the extent legally permitted, (a) notify
        the Disclosing Party promptly in writing, (b) cooperate with the Disclosing Party&rsquo;s reasonable
        efforts to obtain a protective order or other appropriate remedy, and (c) disclose only that portion
        of the Confidential Information that the Receiving Party is, after consultation with counsel, legally
        required to disclose.
      </p>

      <h2><em>vi.</em> No public reference.</h2>
      <p>
        Neither Party shall use the other&rsquo;s name, identity, or any reference to the engagement or
        Purpose in any marketing material, case study, press inquiry, social media post, search-engine listing,
        or other public-facing communication without the prior written consent of the other Party. JRA confirms
        that it does not maintain a public client list and does not provide named references except through counsel.
      </p>

      <h2><em>vii.</em> Independence representation.</h2>
      <p>
        JRA represents that it does not accept referral fees, commissions, kickbacks, or other compensation
        from any contractor, vendor, laboratory, or service provider it recommends in connection with the
        Purpose. JRA&rsquo;s sole compensation in connection with any engagement is the fee paid by Client
        under the operative engagement letter.
      </p>

      <h2><em>viii.</em> Term and survival.</h2>
      <p>
        This Agreement is effective as of the Effective Date and continues for a period of five (5) years
        from that date, except that the Parties&rsquo; obligations with respect to (a) the identities of
        Client and any property addresses, (b) trade secrets, and (c) information whose disclosure is
        restricted by law, shall survive in perpetuity.
      </p>

      <h2><em>ix.</em> Return or destruction.</h2>
      <p>
        Upon written request of the Disclosing Party at any time, or upon termination of any engagement
        contemplated by this Agreement, the Receiving Party shall, at the Disclosing Party&rsquo;s election,
        return or securely destroy all Confidential Information in its possession, except that (a) JRA may
        retain its engagement file in encrypted form for the retention period set forth in its Privacy Notice
        and applicable law and (b) the Receiving Party may retain one archival copy with its outside counsel
        solely for the purpose of confirming compliance with this Agreement.
      </p>

      <h2><em>x.</em> Remedies.</h2>
      <p>
        Each Party acknowledges that breach of this Agreement may cause irreparable harm for which monetary
        damages would be inadequate, and that the non-breaching Party shall be entitled, without the
        requirement of posting bond, to seek equitable relief, including injunctive relief and specific
        performance, in addition to any other remedies available at law or in equity.
      </p>

      <h2><em>xi.</em> No license.</h2>
      <p>
        Nothing in this Agreement grants the Receiving Party any license or other right in or to any
        Confidential Information, by implication, estoppel, or otherwise, except the limited right to
        use it for the Purpose.
      </p>

      <h2><em>xii.</em> Governing law and venue.</h2>
      <p>
        This Agreement is governed by the laws of the State of California, without regard to its
        conflict-of-laws principles. Any dispute arising from or relating to this Agreement shall be
        brought exclusively in the state or federal courts located in Los Angeles County, California,
        and each Party consents to the personal jurisdiction of those courts.
      </p>

      <h2><em>xiii.</em> Entire agreement; amendment.</h2>
      <p>
        This Agreement contains the entire understanding of the Parties with respect to the subject matter
        hereof, and supersedes all prior or contemporaneous understandings on that subject. It may be
        amended only by a writing signed by both Parties.
      </p>

      <h2><em>xiv.</em> Counterparts.</h2>
      <p>
        This Agreement may be executed in counterparts, each of which is deemed an original and all of
        which together constitute one instrument. Electronic signatures are valid and binding.
      </p>

      {/* Signature Block */}
      <div style={{
        marginTop: 64,
        padding: "48px 0",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <p style={{ textTransform: "uppercase", letterSpacing: "0.2em", fontSize: "0.8rem", color: "rgba(236,230,214,0.55)", marginBottom: 40 }}>
          In witness whereof, the Parties have executed this Agreement as of the Effective Date.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64 }}>
          <div>
            <p style={{ fontWeight: 500, color: "var(--fg)", marginBottom: 8 }}>JAMES ROMAN ADVISORY, LLC</p>
            <p style={{ color: "rgba(236,230,214,0.55)" }}>By: James Roman, Founder</p>
            <p style={{ color: "rgba(236,230,214,0.55)" }}>Date: ___________________</p>
          </div>
          <div>
            <p style={{ fontWeight: 500, color: "var(--fg)", marginBottom: 8 }}>CLIENT</p>
            <p style={{ color: "rgba(236,230,214,0.55)" }}>By: ___________________</p>
            <p style={{ color: "rgba(236,230,214,0.55)" }}>Date: ___________________</p>
          </div>
        </div>
      </div>

      <div className="legal-note">
        <strong>One last note</strong>
        <p>
          Where Client is represented by counsel, we routinely sign through and with counsel. Where
          Client prefers to negotiate specific terms — broader exclusions, longer survival, additional
          restrictions on JRA&rsquo;s vendor disclosures — we welcome that conversation. The above is
          a starting point, not a take-it-or-leave-it.
        </p>
      </div>
    </LegalLayout>
  );
}
