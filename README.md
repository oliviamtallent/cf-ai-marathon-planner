# Marathon Planner AI

An AI-powered marathon training planner built using Cloudflare Workers AI.
Users input a marathon date, fitness level, goals, and training time constraints and the app generates
a structured, day-by-day training plan with persistent session notes.

## Tech Stack
- Cloudflare Workers
- Workers AI (Llama model)
- Cloudflare Pages
- Hono
- Vanilla JavaScript (frontend)

## Architecture Overview
- User input collected via Pages UI
- Requests handled by a Worker using Hono
- Training plans generated via Workers AI
- Output is enforced as structured JSON
- Generation is chunked to avoid token limits
- Invalid AI responses are detected and shown to the user through the UI

## Acknowledgements

This project was bootstrapped using a Vanilla Chat Workers AI (https://github.com/craigsdennis/vanilla-chat-workers-ai) chat example provided by Cloudflare.
All application logic, prompts, workflows, and UI behavior were implemented specifically for
this project and are original work.

## Running Locally
```bash
npm install

# If this is your first time here
npx wrangler login

npm run dev
```
