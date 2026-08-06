# SmartCart Development Roadmap Status

**Last audited**: August 6, 2026

**Source of truth**: `docs/smartcart_product_roadmap.md`

## Current Status

- **Program phase**: MVP Recovery & Verification
- **Active checkpoint**: Recovery Gate R1
- **Last historically implemented product checkpoint**: 2.6 - Intelligent Price Memory System
- **Verified product checkpoint**: None assigned by the 2026 audit; historical implementation claims require current evidence
- **Next product milestone**: Paused until Recovery Gate R1 passes

## Why Recovery Is the Priority

The codebase contains substantial Phase 2 implementation, but the August 5, 2026 recovery baseline contradicts the previous "fully complete" report:

- TypeScript: 355 errors across 31 files
- ESLint: 12 errors and 171 warnings
- Unit/component tests: 171 passed, 23 failed out of 194
- Database/RLS integration: not verified because credential-dependent tests were skipped
- Playwright: no E2E tests executed because the configured web server timed out
- Production build: passes only while type and lint validation are disabled
- Dependencies: 30 vulnerabilities, including 3 critical and 21 high
- Security: `.env.production` is tracked and defines a Supabase service-role key and NextAuth secret
- Repository hygiene: 530 tracked `.history/` files

## Recovery Gate R1 Priorities

1. Rotate and remove tracked production secrets, including Git-history remediation.
2. Remove generated history files and establish repository hygiene.
3. Restore green type-check, lint, and unit/component tests.
4. Run database/RLS integration tests against a safe test environment.
5. Repair Playwright startup and run the agreed browser matrix.
6. Resolve PWA manifest asset gaps and validate offline/install behavior.
7. Remove build validation bypasses and add CI enforcement.
8. Revalidate the authenticated, trip-management, Active Shopping, price-memory, completion-total, and offline-sync journeys.

## Product Work After Recovery

Once R1 passes, reassess Phase 3 sequencing. Current evidence suggests:

- **3.1 PWA & Mobile Optimization**: partial implementation; finish validation and missing assets before adding push notifications.
- **3.2 UX & Interface Polish**: partial implementation; prioritize user testing, accessibility, cross-browser behavior, and consistent error/loading states.
- **3.3 Analytics & Monitoring**: not started.
- **Phase 4 launch work**: not started and must remain downstream of verified security, quality, and operations gates.

## Status Vocabulary

- **Verified**: implementation exists and all applicable current gates pass.
- **Implemented — unverified**: implementation evidence exists, but required gates fail or have not run.
- **Partial**: material acceptance criteria remain missing.
- **Not started**: no meaningful repository evidence exists.
