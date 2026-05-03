# QUICK API KEY REFERENCE GUIDE
## Get All Keys in 5-10 Minutes

### 1. PostHog Analytics (1 minute)
**Link:** https://app.posthog.com

Steps:
1. Sign up / Log in
2. Go to: Settings (bottom left)
3. Copy: `Project API Key`

Location in .env.local:
```
NEXT_PUBLIC_POSTHOG_KEY=<paste_here>
```

---

### 2. Sentry Error Tracking (1 minute)
**Link:** https://sentry.io

Steps:
1. Sign up / Log in
2. Create new project (or use existing)
3. Go to: Settings → Client Keys (DSN)
4. Copy: The DSN URL

Location in .env.local:
```
NEXT_PUBLIC_SENTRY_DSN=<paste_here>
```

---

### 3. Upstash Redis (2 minutes)
**Link:** https://console.upstash.com

Steps:
1. Sign up / Log in
2. Create new database (FREE tier available)
3. Go to: Details tab
4. Copy: `UPSTASH_REDIS_REST_URL`
5. Copy: `UPSTASH_REDIS_REST_TOKEN`

Location in .env.local:
```
UPSTASH_REDIS_REST_URL=<paste_here>
UPSTASH_REDIS_REST_TOKEN=<paste_here>
```

---

### 4. Pinecone Vector Database (2 minutes)
**Link:** https://app.pinecone.io

Steps:
1. Sign up / Log in
2. Go to: API Keys (left sidebar)
3. Copy: Your API Key
4. Note your Environment (e.g., us-west-2-aws)

Location in .env.local:
```
PINECONE_API_KEY=<paste_here>
PINECONE_ENVIRONMENT=<paste_here>
PINECONE_INDEX_NAME=meet-scribe-embeddings
```

---

### ALREADY CONFIGURED:
✓ Supabase - Active
✓ Google Gemini AI - Active
✓ Domain - Set to meet-scribe-ai.vercel.app

---

## AUTOMATED SETUP COMMAND

Once you have all 4 API keys, run this ONE command:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force; & "C:\Users\trina\Downloads\IIM MUMBAI\COMPLETE_API_SETUP.ps1"
```

The script will:
1. Prompt you for each API key
2. Update .env.local automatically
3. Test the build
4. Show deployment instructions

Total time: 10 minutes to LIVE production! 🚀

---

## TIMELINE

- Get 4 API keys: 5-10 minutes
- Run automation script: 2 minutes
- Test locally: 2 minutes
- Push to GitHub: 5 minutes
- Deploy to Vercel: 5 minutes

**TOTAL: ~20 minutes from now to LIVE production**

---

## NEXT ACTION

1. Get the 5 API keys using the links above
2. Run the automation command
3. Deploy to production

LET'S GO! 🚀
