import React from "react";
import type { Metadata } from "next";
import { LegalLayout } from "@/components/marketing/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Cookie and local-storage policy for jamesroman.la. One essential cookie, no analytics or third-party trackers without consent.",
};

export default function CookiePolicyPage() {
  return (
    <LegalLayout
      breadcrumb="Cookie Policy"
      eyebrow="Legal"
      title="Cookie"
      titleAccent="Policy."
      lead="We hold cookies to the same standard as the rest of this practice: minimum necessary, explicit consent for anything beyond that, and no quiet third parties along for the ride."
    >
      <p className="legal-effective">
        <strong>Effective:</strong> January 1, 2026 &nbsp;·&nbsp;
        <strong>Last updated:</strong> January 1, 2026
      </p>

      <p>
        This policy describes the cookies and similar local-storage technologies used on jamesroman.la
        (the &ldquo;Site&rdquo;), why we use them, and how you can control them. It supplements our{" "}
        <a href="/privacy" style={{ color: "var(--accent)", textDecoration: "none" }}>Privacy Notice</a>.
      </p>

      <div className="legal-callout">
        <strong>The short version</strong>
        By default, this Site loads no third-party cookies, advertising trackers, or analytics. We use
        a single first-party value to remember whether you have made a cookie choice. If you affirmatively
        accept additional cookies, that choice can be reversed at any time using the reset link at the
        bottom of this page.
      </div>

      <h2><em>i.</em> What a cookie is, briefly.</h2>

      <p>
        A cookie is a small text value that a website asks your browser to store on your device. It can be
        read back on later visits so the site can remember things — a setting, a session, a preference.
        &ldquo;Cookies&rdquo; in this policy also refers to similar technologies including localStorage, which
        the Site uses in place of traditional cookies for its single preference value.
      </p>

      <h2><em>ii.</em> What we use, plainly.</h2>

      <h3>Strictly necessary — loaded by default</h3>
      <ul>
        <li>
          <strong>jr_cookie_pref_v1</strong> — a single first-party localStorage value that records your
          cookie choice (&ldquo;accepted&rdquo; or &ldquo;essential&rdquo;). Without it, the cookie banner
          would re-appear on every page. Set only after you make a selection. No personal information.
        </li>
      </ul>

      <h3>Optional — loaded only if you affirmatively accept</h3>
      <p>
        At present, the Site does not load any optional cookies even after acceptance. We have deliberately
        structured the Site so that, on the date this policy was published, accepting cookies has no
        functional effect — we do not yet operate analytics, advertising, or any third-party measurement
        service. Should that change, this section will be updated to list the specific cookies, their
        providers, their purposes, and their lifetimes before any are loaded. Your existing
        &ldquo;accepted&rdquo; preference would not, in that case, automatically extend to any new category;
        we would request consent again.
      </p>

      <h3>What we do not use</h3>
      <ul>
        <li>No advertising or marketing trackers.</li>
        <li>No cross-context behavioral advertising cookies.</li>
        <li>No social media pixels (no Meta Pixel, no LinkedIn Insight Tag, no TikTok Pixel, etc.).</li>
        <li>No session recording or heatmap tools.</li>
        <li>No fingerprinting or device-identification technologies.</li>
      </ul>

      <h2><em>iii.</em> Categories of cookies, in standard terms.</h2>

      <p>
        For clarity, the categories below describe how cookies are typically classified in California and
        EU privacy regimes, and where each is used on this Site:
      </p>

      <h3>Strictly necessary cookies</h3>
      <p>
        Required for the Site to function. Used: yes — the single preference value described above. These
        cannot be disabled in our cookie banner because they enable the banner itself to function.
      </p>

      <h3>Functional cookies</h3>
      <p>Remember choices you make to improve your experience. Used: no.</p>

      <h3>Performance &amp; analytics cookies</h3>
      <p>Help us understand how the Site is used (e.g., page-view counts, navigation patterns). Used: no.</p>

      <h3>Targeting &amp; advertising cookies</h3>
      <p>Used to deliver advertising or measure its effectiveness, often across sites. Used: no, and we do not anticipate using these.</p>

      <h2><em>iv.</em> Your choices.</h2>

      <p>
        Because the Site loads no optional cookies, the practical choice in our cookie banner is whether
        to record an affirmative acceptance for any future analytics, or whether to decline now. Either way,
        no third-party tracker is loaded today.
      </p>
      <p>
        You can also manage cookies at the browser level — most browsers allow you to view, delete, and
        block cookies and similar storage. Doing so will not impair your use of this Site, given the
        minimal cookie footprint.
      </p>
      <p>
        If you have enabled Global Privacy Control (GPC) in your browser, we treat that signal as a
        request to opt out of any sale or sharing — though, as noted, we do not engage in either.
      </p>

      <h2><em>v.</em> Reset your preference.</h2>

      <p>
        You may reset your cookie preference at any time. The Site will then re-display the cookie banner
        on your next visit, and you may make a new selection.
      </p>

      <h2><em>vi.</em> Server logs.</h2>

      <p>
        Separate from cookies, our hosting provider records standard server logs (IP address, request
        timestamp, page requested, user-agent string) for security and operational purposes. These logs are
        retained for no longer than thirty (30) days and are not cross-referenced with any inquiry or client
        data. Server logs are not cookies and cannot be disabled at the browser level.
      </p>

      <h2><em>vii.</em> Changes to this policy.</h2>

      <p>
        If we begin to use any cookie or local-storage technology beyond the single preference value
        described above, this policy will be updated to reflect that — and we will request fresh consent
        before any such technology is loaded into your browser. The &ldquo;Last updated&rdquo; date at the
        top of this page indicates the most recent revision.
      </p>

      <h2><em>viii.</em> Contact.</h2>

      <p>Questions about cookies, or about how we handle data more broadly, may be directed to:</p>
      <ul>
        <li><strong>Email:</strong> privacy@jamesroman.la</li>
        <li><strong>Telephone:</strong> +1 (310) 430-2500</li>
      </ul>
    </LegalLayout>
  );
}
