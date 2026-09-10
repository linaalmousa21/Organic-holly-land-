# Deployment plan

## Current state

The project is a React/Vite storefront with the Manus-authenticated server scaffold, database configuration, responsive storefront preview, catalog filtering, cart preview, and test coverage. `netlify.toml` builds and publishes the static client from `dist/public`; `pnpm build` also bundles the Node server for Render.

## Services

- **GitHub:** source repository and deployment source of truth.
- **Netlify:** static frontend deployment using `pnpm build` and `dist/public`.
- **Render:** Node web service using `pnpm build` and `pnpm start`; supply server environment variables in the Render dashboard.
- **HyperPay:** intentionally disabled until merchant onboarding is complete. Do not accept card details in the storefront before the HyperPay integration is configured and tested in sandbox mode.

## Required production secrets

Copy `.env.example` into the platform secret managers. Never commit `.env`, `DATABASE_URL`, `JWT_SECRET`, HyperPay credentials, or OAuth secrets.

## Important release gate

The current cart and checkout affordances are preview interactions. Production order persistence, shipping calculation, customer accounts beyond the existing Manus auth scaffold, and HyperPay card authorization require implementation and sandbox verification before accepting real orders or payments.
