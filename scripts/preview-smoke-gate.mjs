#!/usr/bin/env node

const target = process.argv[2];

if (!target) {
  console.error("Usage: node scripts/preview-smoke-gate.mjs https://preview-url.example");
  process.exit(2);
}

let baseUrl;
try {
  baseUrl = new URL(target);
} catch {
  console.error(`Invalid URL: ${target}`);
  process.exit(2);
}

function urlFor(pathname) {
  return new URL(pathname, baseUrl);
}

async function request(pathname, init = {}) {
  return fetch(urlFor(pathname), {
    redirect: "manual",
    ...init,
  });
}

function header(response, name) {
  return response.headers.get(name) ?? "";
}

function allowedCorsOrigins() {
  const configured = process.env.CORS_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured?.length) return configured;

  return [baseUrl.origin, "https://www.jamesroman.la", "https://jamesroman.la"];
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
}

function statusDetail(response) {
  const vercelError = header(response, "x-vercel-error");
  return `status=${response.status}${vercelError ? ` x-vercel-error=${vercelError}` : ""}`;
}

async function main() {
  const home = await request("/");
  record("Homepage returns 200", home.status === 200, statusDetail(home));

  const portal = await request("/portal");
  const dashboard = await request("/portal/dashboard");
  const dashboardLocation = header(dashboard, "location");
  const dashboardVercelError = header(dashboard, "x-vercel-error");
  const dashboardRedirectsToPortal =
    [301, 302, 303, 307, 308].includes(dashboard.status) &&
    dashboardLocation.includes("/portal");
  const dashboardFailsClosed =
    dashboard.status === 503 &&
    dashboardVercelError !== "MIDDLEWARE_INVOCATION_FAILED" &&
    header(dashboard, "cache-control").toLowerCase().includes("no-store") &&
    header(dashboard, "x-robots-tag").toLowerCase().includes("noindex");
  record(
    "Portal dashboard auth gate redirects or fails closed",
    dashboardRedirectsToPortal || dashboardFailsClosed,
    dashboardRedirectsToPortal
      ? `${statusDetail(dashboard)} location=${dashboardLocation}`
      : `${statusDetail(dashboard)}${dashboardFailsClosed ? " controlled-503-until-env-vars" : ""}`,
  );

  const portalCache = header(portal, "cache-control").toLowerCase();
  const portalRobots = header(portal, "x-robots-tag").toLowerCase();
  record(
    "Portal has private cache/index headers",
    portalCache.includes("no-store") && portalRobots.includes("noindex"),
    `cache-control=${portalCache || "(missing)"} x-robots-tag=${portalRobots || "(missing)"}`,
  );

  const csp = header(home, "content-security-policy");
  record(
    "Production CSP is hardened",
    Boolean(csp) && !csp.includes("'unsafe-eval'") && csp.includes("upgrade-insecure-requests"),
    csp || "(missing CSP)",
  );

  const oldHealthKey = await request("/api/health?key=jr-health-2026");
  const anonymousHealth = await request("/api/health");
  const anonymousHealthCache = header(anonymousHealth, "cache-control").toLowerCase();

  const healthSecret = process.env.HEALTHCHECK_SECRET;
  const secretHealth = healthSecret
    ? await request(`/api/health?key=${encodeURIComponent(healthSecret)}`)
    : null;
  const secretHealthBody = secretHealth ? await readJson(secretHealth) : null;
  const envVars = secretHealthBody?.env_vars ?? {};
  const supabaseConfigured =
    secretHealthBody?.supabase === true ||
    (
      envVars.NEXT_PUBLIC_SUPABASE_URL === true &&
      envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY === true &&
      envVars.SUPABASE_SERVICE_ROLE_KEY === true
    );
  record(
    "Health secret reaches configured Supabase",
    Boolean(healthSecret && secretHealth?.status === 200 && supabaseConfigured),
    healthSecret
      ? `${statusDetail(secretHealth)} supabaseConfigured=${supabaseConfigured}`
      : "set HEALTHCHECK_SECRET before running this gate",
  );

  record(
    "Old and anonymous health access are rejected",
    [401, 403].includes(oldHealthKey.status) &&
      [401, 403].includes(anonymousHealth.status) &&
      anonymousHealthCache.includes("no-store"),
    `old-key=${statusDetail(oldHealthKey)} anonymous=${statusDetail(anonymousHealth)} cache-control=${anonymousHealthCache || "(missing)"}`,
  );

  const corsTargets = [
    { label: "/", response: home },
    { label: "/portal", response: portal },
    { label: "/portal/dashboard", response: dashboard },
    { label: "/api/health", response: anonymousHealth },
    {
      label: "OPTIONS /api/health",
      response: await request("/api/health", {
        method: "OPTIONS",
        headers: {
          Origin: "https://evil.example",
          "Access-Control-Request-Method": "GET",
        },
      }),
    },
  ];
  const allowedOrigins = allowedCorsOrigins();
  const corsViolations = corsTargets
    .map(({ label, response }) => ({
      label,
      value: header(response, "access-control-allow-origin"),
      credentials: header(response, "access-control-allow-credentials"),
    }))
    .filter(({ value }) => value === "*" || (value && !allowedOrigins.includes(value)));
  record(
    "CORS has no wildcard and explicit origins are allowlisted",
    corsViolations.length === 0,
    corsViolations.length
      ? corsViolations
          .map(({ label, value, credentials }) => `${label}: ${value}${credentials ? ` credentials=${credentials}` : ""}`)
          .join("; ")
      : `allowed origins: ${allowedOrigins.join(", ")}`,
  );

  const sitemap = await request("/sitemap.xml");
  let sitemapOk = sitemap.status === 200;
  const routeDetails = [`sitemap status=${sitemap.status}`];
  if (sitemapOk) {
    const sitemapText = await sitemap.text();
    for (const pathname of ["/terms", "/disclaimer"]) {
      if (!sitemapText.includes(`${baseUrl.origin}${pathname}`)) {
        routeDetails.push(`${pathname}: not advertised`);
        continue;
      }

      const response = await request(pathname);
      const routeOk = response.status === 200;
      sitemapOk = sitemapOk && routeOk;
      routeDetails.push(`${pathname}: ${response.status}`);
    }
  }
  record(
    "Sitemap legal routes are not advertised as redirects",
    sitemapOk,
    routeDetails.join("; "),
  );

  results.forEach((result, index) => {
    const marker = result.ok ? "PASS" : "FAIL";
    console.log(`${marker} ${index + 1}. ${result.name} -- ${result.detail}`);
  });

  const failures = results.filter((result) => !result.ok);
  if (failures.length > 0) {
    console.error(`\nSmoke gate failed: ${failures.length}/${results.length} checks failed.`);
    process.exit(1);
  }

  console.log(`\nSmoke gate passed: ${results.length}/${results.length} checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
