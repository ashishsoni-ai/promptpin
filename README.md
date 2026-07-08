# PromptPin 📌

> Pinterest for AI image prompts — browse, discover, copy and create.

## Quick Start

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

### Database
Run `supabase/schema.sql` in your Supabase SQL editor.

## Setup Checklist
- [ ] Create Supabase project → copy URL + keys
- [ ] Enable Google OAuth in Supabase Auth
- [ ] Create Cloudflare R2 bucket named `promptpin`
- [ ] Get Groq API key (free at console.groq.com)
- [ ] Fill `.env` and `.env.local` files
- [ ] Run `supabase/schema.sql`
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel

## Stack
- **Frontend**: Next.js 14 + Tailwind + shadcn/ui
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2
- **AI**: Groq LLaMA3 (prompt enhance/remix)
- **Auth**: Supabase Auth (Google SSO)
