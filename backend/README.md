# Shadow AI - Backend API

This is the secure backend API for the Shadow AI mobile app. It handles PostgreSQL database access, OpenAI integration, and AI/voice features.

## Architecture

```
Mobile App (React Native)  →  Backend API  →  PostgreSQL
                                  ↓
                              OpenAI API
```

**Security:** The mobile app NEVER has direct access to database credentials or OpenAI keys. All sensitive operations happen server-side.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL connection
- `ANTHROPIC_API_KEY` or `NVIDIA_API_KEY` - AI provider
- `JWT_SECRET` - Secret for signing JWTs (generate a strong random string)

### 3. Run Development Server

```bash
npm run dev
```

The API will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new user
- `POST /auth/signin` - Sign in user
- `POST /auth/signout` - Sign out user

### Chat (Requires Auth)
- `POST /chat/messages` - Send message to AI
- `GET /chat/history` - Get chat history
- `POST /chat/behavior` - Switch behavior mode
- `GET /chat/behavior` - Get current behavior

### Journal (Requires Auth)
- `POST /journal/entries` - Create journal entry
- `GET /journal/entries` - Get all entries
- `GET /journal/entries/:id` - Get specific entry
- `DELETE /journal/entries/:id` - Delete entry

### Health Check
- `GET /health` - Check API status

## Development

```bash
# Run in development mode (auto-reload)
npm run dev

# Build TypeScript
npm run build

# Run built version
npm start
```

## License

ISC
