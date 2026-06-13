# WhatsApp AI Auto-Reply Dashboard

A full-stack WhatsApp automation platform that combines AI-powered conversations, rule-based automation, and contact management through a custom-built dashboard.

## Overview

This project integrates WhatsApp Web automation with Groq AI to create an intelligent auto-reply assistant. It provides a modern dashboard for managing contacts, automation rules, AI reply modes, and conversation testing while maintaining full control over who the bot can interact with.

## Features

### WhatsApp Automation

* WhatsApp Web integration using whatsapp-web.js
* Persistent LocalAuth session management
* Automatic session recovery and reconnection handling
* Allowed contacts whitelist system
* Contact-based bot enable/disable controls

### AI-Powered Replies

* Groq AI integration
* AI-only response mode
* Smart Mode (Rules → AI fallback)
* Context-aware conversation memory
* Relationship-aware contact metadata

### Rule Engine

* Keyword-based auto replies
* Exact match and contains match modes
* Contact-specific rules
* Global rules for all contacts
* Enable/disable rules individually
* Real-time rule management dashboard

### Advanced Contact Management

* Create, edit, and delete contacts
* Relationship classification

  * Mother
  * Father
  * Brother
  * Sister
  * College Friend
  * Classmate
  * Faculty
  * Recruiter
* Bot access management
* Auto-discovered WhatsApp contacts
* Contact status tracking

  * Manual
  * Needs Linking
  * Linked

### Contact Linking System

* Manual contact creation
* Automatic WhatsApp contact discovery
* Link WhatsApp identities to existing contacts
* Unlink contacts when incorrect matches occur
* WhatsApp identity preservation during linking/unlinking
* Duplicate contact prevention

### Dashboard Experience

* WhatsApp-inspired UI
* Contact editing modal
* Contact linking modal
* Contact unlink confirmation modal
* Real-time toast notification system
* Responsive desktop/mobile layout
* Chat simulator for testing workflows

### Testing Tools

* Built-in chat simulator
* Simulate conversations from different contacts
* Test rules without using WhatsApp
* Validate AI responses before deployment

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Lucide React

### Backend

* Node.js
* Express
* Groq SDK
* whatsapp-web.js

## Why I Built This

I wanted to explore how AI assistants can be integrated into messaging platforms while still providing fine-grained control over automation. The project helped me gain experience with:

* AI integrations
* Full-stack development
* State management
* WhatsApp automation
* Session persistence
* Contact identity management
* Real-time dashboard design

## Challenges Solved

### WhatsApp Session Reliability

* LocalAuth corruption handling
* Session recovery mechanisms
* Startup health checks
* Ready-state detection improvements

### Contact Identity Management

* Handling WhatsApp LID identifiers
* Contact linking and unlinking workflows
* Duplicate prevention
* Contact relationship mapping

### Automation Architecture

* Rule-based response engine
* AI fallback system
* Contact-level permissions
* Synchronization between frontend and backend

### User Experience

* Custom modal workflows
* Toast notification system
* Responsive dashboard design
* WhatsApp-style chat simulation

## Future Improvements

* Persistent database storage (MongoDB/PostgreSQL)
* Contact notes and AI personalization
* Search and filtering for contacts
* Message scheduling
* Media and file responses
* Conversation history viewer
* Analytics dashboard
* Role-based access control
* Docker deployment
* Cloud hosting support

## Screenshots

### Dashboard

![Dashboard](screenshots/overview.png)

### Contact Management

![Contacts](screenshots/contacts.png)

### Rules Engine

![Rules](screenshots/Auto-reply-rules.png)

### Chat Simulator

![Simulator](screenshots/chat-simulator.png)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/whatsapp-dashboard.git
cd whatsapp-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment Variables

Create a `.env` file:

```env
GROQ_API_KEY=your_groq_api_key

DATA_DIR=C:/Users/YOUR_USERNAME/wa-data
AUTH_DIR=C:/Users/YOUR_USERNAME/wa-auth

BROWSER_PATH=C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe
```

### 4. Start the Backend

```bash
npm run server
```

### 5. Start the Frontend

```bash
npm run dev
```

### 6. Open the Dashboard

```text
http://localhost:5173
```

### 7. Link WhatsApp

1. Start the backend.
2. Scan the QR code using WhatsApp Linked Devices.
3. The session will be stored locally for future use.

### 8. Configure the Bot

* Add contacts
* Enable bot access for selected contacts
* Create automation rules
* Select a reply mode

Reply modes:

* Rules → Rule-based replies only
* AI → Groq AI replies only
* Smart → Rules first, AI fallback

### 9. Test Using Chat Simulator

Use the built-in simulator to validate rules and AI responses before interacting with real WhatsApp conversations.

## Build for Production

```bash
npm run build
```

The production build is generated inside the `dist/` directory.

## Author

Shubhanu Chatterjee
