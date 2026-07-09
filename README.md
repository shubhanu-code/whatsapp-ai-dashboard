# WhatsApp AI Auto-Reply Platform

A full stack project where I built an AI powered WhatsApp automation system using Baileys, Groq AI, SQLite and React. Basically it connects to your WhatsApp and can auto reply to messages using rules or AI, and you get a whole dashboard to manage everything.

Started this as a simple auto-reply bot but ended up adding a lot more stuff like memory, contact based AI personalities, analytics etc. Still improving it whenever I get time.

## What it does

- Connects to WhatsApp using Baileys (multi device support)
- Auto replies using either rules, AI, or both (rules first then AI fallback)
- Remembers past conversations so AI replies feel more natural
- Every contact can have its own AI personality/context (like different tone for friends vs recruiters)
- Has an inbox similar to actual WhatsApp
- Analytics page to see stats about messages, AI usage, tokens, cost etc
- Can test everything in a simulator without touching real WhatsApp

## Features (in more detail)

### WhatsApp
- QR code pairing
- Auto reconnect if disconnected
- Syncs old messages/contacts on startup
- Handles incoming/outgoing messages in real time
- Prevents duplicate messages (this was annoying to fix)

### AI
- Uses Groq API (Llama models)
- 3 modes: AI only, Rules only, Smart (rules first, AI fallback)
- Global AI personality + per contact personality
- You can set temperature and other params from settings

### Memory
- AI remembers previous chats
- Can turn memory on/off
- Configurable how much memory to keep
- Can view memory for each contact

### Contact Intelligence
- Each contact has fields like relationship (friend, family, recruiter, faculty, client etc), notes, custom AI context
- Helps AI reply differently based on who it's talking to

### Rules Engine
- Keyword based, exact match, contains match
- Can be global or contact specific
- Enable/disable individual rules

### Inbox
- Search, pin, favorite chats
- Read/unread status
- Delete messages/conversations
- Typing indicator simulation
- Shift+Enter for new line

### Analytics
Basic stuff like:
- total conversations, messages sent/received
- AI replies vs rule replies
- peak hours, daily/weekly trends
- top contacts
- AI stuff: tokens used, cost estimate, response time, success rate

### Simulator
Lets me test rules/AI/memory without actually sending real WhatsApp messages. Really useful for debugging.

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Recharts

**Backend:** Node.js, Express, Baileys, Groq SDK, Better SQLite3

**Database:** SQLite (moved from just storing stuff in JSON files earlier, way better now for analytics and queries)

## How it's structured

```
frontend/
    components/
        Analytics/
        Contacts/
        Inbox/
        Rules/
        Settings/
        Simulator/
        Overview/

backend/
    services/
    repositories/
    database/
    routes/
    utils/
    baileys/
```

Basic flow:

```
React Dashboard -> Express API -> SQLite DB / Groq AI / Baileys (WhatsApp)
```

## Problems I ran into

- Baileys would randomly disconnect, had to add reconnect logic
- Duplicate messages were getting processed twice, took a while to fix
- Started with JSON file storage which got messy fast, migrated everything to SQLite
- Making the AI remember context without blowing up token usage was tricky
- Dashboard was laggy at first with big chat lists so added skeleton loaders and lazy loading

## Roadmap

**Done:**
- WhatsApp integration + rules + AI replies
- Contact management + inbox + dashboard
- SQLite migration
- Analytics + AI memory + contact intelligence
- AI usage tracking

**Working on:**
- RAG based knowledge base (file uploads, semantic search)

**Planned:**
- Multi user accounts + auth + teams
- Docker/deployment stuff eventually

## Setup

Clone the repo:
```bash
git clone https://github.com/YOUR_USERNAME/whatsapp-ai-dashboard.git
cd whatsapp-ai-dashboard
```

Install dependencies:
```bash
npm install
```

Create a `.env` file:
```env
GROQ_API_KEY=your_api_key
PORT=5000
DATABASE_PATH=backend/db/whatsapp.db
AUTH_DIR=backend/auth
AI_MODEL=llama-3.3-70b-versatile
```

Run it:
```bash
npm run dev
```
(or `npm run backend` and `npm run frontend` separately)

Then scan the QR code shown in terminal/dashboard with your WhatsApp to pair it, wait for sync to finish, and you're good to go.

## Screenshots

(adding these soon)

## Why I'm building this

Honestly just wanted to learn how to build something full stack that actually does something useful, and WhatsApp automation seemed like a fun project. Eventually want to add more channels, better AI agents, and maybe make it usable for small businesses too. Still a work in progress.

## Author

Shubhanu Chatterjee
IIIT Dharwad, Data Science & AI