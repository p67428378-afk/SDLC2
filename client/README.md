# Dollar General — Cluster Assortment Advisor (Client)

A single-canvas decision-support dashboard for Dollar General category managers to evaluate sales performance, compare scenario projections (Conservative, Balanced, Aggressive), enforce operational guardrails, and submit assortment decisions for the Snacks category across Small Town Value Cluster stores.

## Features

- **KPI Header Strip**: Sales per linear foot, private brand share %, in-stock rate %, and shelf capacity utilization %.
- **SKU Performance Table**: Snacks SKU velocity, margin %, linear ft allocation, private brand indicators, and editable recommendation badges (GROW, MAINTAIN, SWAP, REDUCE).
- **Scenario Selector**: Interactive scenario cards (Conservative, Balanced, Aggressive) with live impact projections.
- **Approval Review Panel & Guardrail Verification**: Real-time guardrail checks (shelf capacity limit, private brand minimum, in-stock threshold) and plan submission.
- **Inline Confirmation & Audit Trail**: Post-submission audit trail summary with immutable audit ID.

## Prerequisites

- Node.js 18+
- npm 9+

## Setup & Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   ```
3. Start the Vite development server (default port 5173):
   ```bash
   npm run dev
   ```

## Production Build

```bash
npm run build
```

## Running Tests

```bash
npm run test
```

## Architecture Decisions

- **Framework**: React 18 + Vite for high performance and fast HMR.
- **Styling**: Tailwind CSS for responsive and consistent design tokens.
- **API Client**: Axios instance configured with `VITE_API_BASE_URL` fallback to `http://localhost:8000`.
- **Error Handling**: React Error Boundary wrapper to capture uncaught render errors gracefully.
