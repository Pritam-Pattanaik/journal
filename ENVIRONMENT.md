# Environment Variables Reference

This document outlines the environment variables used by the TradeVault server. These variables should be defined in a `.env` file located in the `server/` directory.

| Variable Name | Required? | Default | Description | Example |
| ------------- | :-------: | ------- | ----------- | ------- |
| `DATABASE_URL` | **Yes** | - | PostgreSQL connection string (e.g., Neon serverless DB). | `postgresql://user:pass@ep-host.region.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | **Yes** | `fallback_secret_please_change` | Secret key used for signing JSON Web Tokens (JWT). | `super_secret_jwt_key_12345` |
| `PORT` | No | `3000` | The port the Express backend server listens on during local development. | `3000` |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | Comma-separated list of origins allowed by CORS. | `http://localhost:5173,https://my-tradevault.vercel.app` |
| `ANTHROPIC_API_KEY` | No* | - | Anthropic API key for AI features using Claude. | `sk-ant-api03-...` |
| `GEMINI_API_KEY` | No* | - | Google Gemini API key for AI features. | `AIzaSy...` |
| `GROQ_API_KEY` | No* | - | Groq API key for fast AI inference. | `gsk_...` |

> **\*Note on AI Keys:** While none are strictly required for the app to start, at least one provider's API key (typically Groq or Anthropic based on `lib/ai/llm.ts` config) is required to use the AI Coach and Trade Analysis features.
