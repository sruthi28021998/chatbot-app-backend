# AI Chatbot: Backend

REST API and real-time server for an AI-powered chatbot.
Built with Node.js, Express, MongoDB, Socket.io and an OpenAI-compatible AI API (Google Gemini).

**Live API:** https://your-backend.onrender.com
**Frontend repo:** https://github.com/<your-username>/chatbot-app-frontend

## Features
- JWT authentication (register, login, session check)
- AI replies in three styles: casual, professional, creative
- Real-time messaging with Socket.io
- Chat history stored in MongoDB
- Response ratings and user settings (chatbot name, theme)
- Admin analytics (users, activity, ratings, response time)
- Rate limiting, input validation, Helmet, compression, response caching
- Automatic retry and fallback model for AI errors

## Screenshots

- [Server running](screenshots/server-running.png)
- [Login API (Postman)](screenshots/postman-login.png)
- [Chat API (Postman)](screenshots/postman-chat.png)
- [MongoDB collections](screenshots/mongodb-collections.png)
- [Deployed on Render](screenshots/render-live.png)

## Tech stack
Node.js, Express, MongoDB Atlas, Mongoose, Socket.io, JWT, bcryptjs, Helmet, express-rate-limit, node-cache, OpenAI SDK

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```

## Environment variables
| Name | Description |
| --- | --- |
| PORT | Server port (default 5000) |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Secret used to sign tokens |
| OPENAI_API_KEY | API key of the AI provider (Gemini, Groq or OpenAI) |
| AI_BASE_URL | AI provider base URL (leave empty for OpenAI) |
| AI_MODEL | Model name |
| AI_FALLBACK_MODEL | Optional backup model |
| CLIENT_URL | Frontend URL(s), comma-separated, no trailing slash |
| ADMIN_EMAIL | Account registered with this email becomes admin |

## Folder structure
```
backend/
├── server.js
├── config/db.js
├── models/            User, Conversation
├── middleware/        asyncHandler, auth, admin
├── services/          aiService (AI call, cache, retry)
├── controllers/       auth, chat, admin
├── routes/            auth, chat, admin
├── sockets/           chatSocket
└── screenshots/
```

## API
All routes except register and login need the header `Authorization: Bearer <token>`.

### Auth
| Method | Route | Body | Description |
| --- | --- | --- | --- |
| POST | /api/auth/register | name, email, password | Create account |
| POST | /api/auth/login | email, password | Log in |
| GET | /api/auth/me | none | Current user |
| PUT | /api/auth/settings | chatbotName, theme | Update settings |

### Chat
| Method | Route | Body | Description |
| --- | --- | --- | --- |
| POST | /api/chat/message | conversationId?, content, category? | Send a message, get an AI reply |
| GET | /api/chat | none | List conversations |
| GET | /api/chat/:id | none | Get one conversation |
| PUT | /api/chat/:id/rate | messageId, rating (1, -1, 0) | Rate a reply |
| DELETE | /api/chat/:id | none | Delete a conversation |

### Admin
| Method | Route | Description |
| --- | --- | --- |
| GET | /api/admin/stats | Usage and performance statistics (admin only) |

## Socket.io
Connect with `io(API_URL, { auth: { token } })`.

| Direction | Event | Payload |
| --- | --- | --- |
| client to server | send_message | { conversationId, content, category } |
| server to client | ai_message | { conversationId, message } |
| server to client | chat_error | error message string |

## Deployment
- Database: MongoDB Atlas
- Server: Render (build `npm install`, start `npm start`)
- Set all environment variables in the Render dashboard

## Future plans
- Multilingual support
- Voice interaction
- Google Calendar integration
- Streaming AI responses
- Conversation rename and search

## Feedback
Users rate each AI reply with thumbs up or down. Ratings and response times appear on the admin dashboard.