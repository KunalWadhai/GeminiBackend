# Gemini-Style Backend System

A Node.js backend system that provides user-specific chatrooms, OTP-based authentication, AI-powered conversations via Google Gemini API, and subscription management with Stripe.

## Objective

Develop a comprehensive backend system featuring:
- OTP-based user authentication
- Multi-chatroom management with AI conversations
- Asynchronous Gemini API integration using message queues
- Subscription-based access control with Stripe payments

## Requirements

### 1. User Authentication
- **OTP-based login** using mobile number only
- OTP generation and verification (mocked - returned in API response)
- JWT token-based authentication for protected routes
- Password reset functionality via OTP

### 2. Chatroom Management
- Create and manage multiple chatrooms per user
- Send messages to chatrooms and receive Gemini API responses
- Asynchronous processing using BullMQ for Gemini API calls

### 3. Google Gemini API Integration
- Direct integration with Google Gemini API for AI responses
- Queue-based processing to handle API calls efficiently

### 4. Subscription & Payments
- **Basic Tier (Free)**: Limited to 5 prompts per day
- **Pro Tier (Paid)**: Higher or unlimited usage
- Stripe sandbox integration for subscription payments
- Webhook handling for payment events
- Subscription status checking

## API Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/auth/signup` | POST | ❌ | Register new user with mobile number |
| `/auth/send-otp` | POST | ❌ | Send OTP to mobile number (mocked response) |
| `/auth/verify-otp` | POST | ❌ | Verify OTP and return JWT token |
| `/auth/forgot-password` | POST | ❌ | Send OTP for password reset |
| `/auth/change-password` | POST | ✅ | Change password for authenticated user |
| `/user/me` | GET | ✅ | Get current user details |
| `/chatroom` | POST | ✅ | Create new chatroom |
| `/chatroom` | GET | ✅ | List all user chatrooms (cached) |
| `/chatroom/:id` | GET | ✅ | Get specific chatroom details |
| `/chatroom/:id/message` | POST | ✅ | Send message and get Gemini response |
| `/subscribe/pro` | POST | ✅ | Initiate Pro subscription via Stripe |
| `/webhook/stripe` | POST | ❌ (Stripe only) | Handle Stripe webhook events |
| `/subscription/status` | GET | ✅ | Check user's subscription tier |

## Technical Stack

- **Language**: Node.js with Express.js
- **Database**: PostgreSQL
- **Queue**: BullMQ (with Redis)
- **Authentication**: JWT with OTP verification
- **Payments**: Stripe (sandbox mode)
- **External API**: Google Gemini
- **Caching**: Redis for query caching
- **Deployment**: Public cloud platform (Render, Railway, EC2, Fly.io, etc.)

## Architecture

### Directory Structure
```
/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/          # Database models
│   ├── routes/          # API route definitions
│   ├── middleware/      # Authentication, rate limiting, error handling
│   ├── services/        # Business logic (OTP, Gemini, Stripe, Cache)
│   ├── utils/           # Helper utilities (JWT, Queue setup)
│   └── config/          # Database and Redis configuration
├── tests/               # Test files
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
├── server.js            # Application entry point
└── README.md            # This file
```

### Key Features

#### Authentication Flow
1. User registers with mobile number
2. OTP sent (returned in response for development)
3. OTP verification returns JWT token
4. JWT required for all protected routes

#### Chatroom System
- Users can create multiple chatrooms
- Messages sent to Gemini API via BullMQ queue
- Asynchronous responses returned to chatroom

#### Subscription Management
- Basic tier: Rate-limited to 5 messages/day
- Pro tier: Higher limits via Stripe subscription
- Webhooks handle payment status updates

#### Caching Strategy
- GET /chatroom endpoint cached with Redis (TTL: 5-10 minutes)
- Justified: Frequent dashboard access, low change frequency, performance improvement

### Middleware
- JWT token validation
- Rate limiting for Basic tier users
- Error handling and logging

### Queue Processing
- BullMQ used for Gemini API calls
- Asynchronous message processing
- Error handling and retries

## Environment Variables

Create a `.env` file with:
```
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
GEMINI_API_KEY=your-gemini-key
```

## Installation & Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Configure Redis
5. Set up environment variables
6. Run migrations (if using ORM)
7. Start the server: `npm start`

## Development

- Use `npm run dev` for development with nodemon
- Run tests with `npm test`
- Lint code with `npm run lint`

## Deployment

Deploy to your chosen cloud platform:
- Ensure environment variables are set
- Database and Redis instances are accessible
- Stripe webhooks configured to point to `/webhook/stripe`

## Security Considerations

- JWT tokens with appropriate expiration
- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure handling of Stripe webhooks
- Environment variable management

## Performance Optimizations

- Query caching on frequently accessed endpoints
- Asynchronous processing for external API calls
- Database indexing on critical queries
- Connection pooling for database and Redis

## Testing

- Unit tests for controllers and services
- Integration tests for API endpoints
- Mock external services (Gemini, Stripe) for testing
