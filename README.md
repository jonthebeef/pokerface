# Poker Coach

Texas Hold'em hand analyzer and betting advisor PWA.

## Features

- **Card Scanning**: Use your phone camera to scan cards with GPT-4o Vision
- **Manual Selection**: Tap to select cards if camera isn't available
- **Hand Evaluation**: See your current hand strength (Pair, Flush, etc.)
- **Betting Advice**: Get FOLD/CALL/RAISE recommendations
- **AI Coaching**: Strategic tips from Claude Haiku

## Setup

1. Clone the repo
2. `npm install`
3. Create `.env.local` with your API keys:
   ```
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   ```
4. `npm run dev`

## Deploy

Deploy to Vercel or Netlify. Set the environment variables in your hosting dashboard.

## Tech Stack

- Next.js 15 + TypeScript
- Tailwind CSS
- OpenAI GPT-4o Vision (card detection)
- Claude Haiku (strategy advice)
- pokersolver (hand evaluation)
