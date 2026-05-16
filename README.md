# James Roman Advisory

Independent, client-side advisory for hazardous-material remediation oversight in luxury homes across the Westside.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Runtime:** Bun
- **Testing:** Vitest + React Testing Library
- **CI/CD:** GitHub Actions → Vercel

## Getting Started

```bash
bun install
bun run dev        # http://localhost:3000
```

## Commands

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `bun run dev`        | Start development server             |
| `bun run build`      | Production build                     |
| `bun run start`      | Start production server              |
| `bun run test`       | Run unit tests                       |
| `bun run test:watch` | Run tests in watch mode              |
| `bun run lint`       | Lint with ESLint                     |
| `bun run typecheck`  | TypeScript type checking             |
| `bun run ci`         | Full CI pipeline (lint+types+test+build) |

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout + metadata
│   ├── page.tsx                # Marketing homepage
│   └── globals.css             # Design system CSS
├── components/
│   └── marketing/              # Marketing page components
│       ├── Nav.tsx
│       ├── Hero.tsx
│       ├── Practice.tsx
│       ├── Counsel.tsx
│       ├── Engagement.tsx
│       ├── Discretion.tsx
│       ├── Matters.tsx
│       ├── ClientOffice.tsx
│       ├── Contact.tsx
│       ├── SiteFooter.tsx
│       ├── CookieBanner.tsx
│       ├── Logo.tsx
│       └── Plate.tsx
├── hooks/
│   └── useReveal.ts            # Scroll-reveal intersection observer
├── lib/
│   └── constants.ts            # All firm data, copy, and configuration
└── __tests__/                  # Unit tests mirror src/ structure
    ├── components/
    └── lib/
```

## Environment Structure

| Environment | Branch       | Vercel Target | Purpose                |
| ----------- | ------------ | ------------- | ---------------------- |
| Development | feature/*    | —             | Local dev server       |
| Preview     | PR branches  | Preview       | Review before merge    |
| Production  | main         | Production    | Live site              |

## Deployment

Connected to Vercel. Every push to `main` deploys to production. Pull requests get automatic preview deployments.

## Notes

- Phone and email in `src/lib/constants.ts` are placeholders — update before go-live
- The `ClientOffice` section will link to the future CRM client portal
