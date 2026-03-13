# MABI Hub

AI Toolkit for the IEEE Marketing Automation & Business Intelligence Team.

## Setup

1. **Install dependencies**
```
npm install
```

2. **Add your API key**

Copy `.env.local.example` to `.env.local` and add your Gemini API key:
```
GEMINI_API_KEY=your_key_here
```

3. **Run locally**
```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push this repo to GitHub
2. Connect the repo to Vercel at vercel.com
3. In Vercel project settings → Environment Variables, add:
   - `GEMINI_API_KEY` = your Gemini API key
4. Deploy

## Tools Included

### Email
- Email Copywriter Assistant
- Subject Line Generator
- Campaign QA Checklist
- Segment Brief Generator

### Data & BI
- Natural Language to SQL
- Alteryx Workflow Assistant
- Data Summarizer

### Performance Analytics
- Campaign Recap Generator
- Email Analytics Dashboard (coming soon)
