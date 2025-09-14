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

## Architecture Overview

### Directory Structure
```
/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/          # Database models (Sequelize ORM)
│   ├── routes/          # API route definitions
│   ├── middleware/      # Authentication, rate limiting, error handling
│   ├── services/        # Business logic (OTP, Gemini, Stripe, Cache, Queue)
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

## Queue System Explanation

The system uses **BullMQ** with **Redis** for asynchronous processing of Gemini API calls to ensure scalability and reliability.

### Queue Implementation Details

- **Queue Name**: `gemini-queue`
- **Redis Connection**: Uses `ioredis` for Redis connectivity with configurable URL
- **Job Processing**: Messages are queued when users send chat messages
- **Worker Configuration**:
  - **Retries**: Up to 3 attempts with exponential backoff (2-second delay)
  - **Error Handling**: Failed jobs are logged and can be retried
  - **Success Handling**: Completed jobs update the message record with AI response

### Queue Flow

1. **Job Creation**: When a user sends a message to `/chatroom/:id/message`, a job is added to the queue with `messageId` and `message` data
2. **Job Processing**: Worker picks up the job and calls `geminiService.generateResponse()`
3. **Response Storage**: AI response is stored in the database by updating the Message model
4. **Event Monitoring**: Worker listens for `completed` and `failed` events for logging

### Benefits of Queue System

- **Asynchronous Processing**: API responses are non-blocking
- **Scalability**: Multiple workers can process jobs concurrently
- **Reliability**: Failed jobs are automatically retried
- **Performance**: Heavy AI API calls don't block the main application thread

## Gemini API Integration Overview

The system integrates with Google's Gemini AI API for generating conversational responses.

### Integration Details

- **SDK**: Uses `@google/generative-ai` package
- **Model**: `gemini-1.5-flash` for fast, cost-effective responses
- **Authentication**: Requires `GEMINI_API_KEY` environment variable
- **Content Generation**: Single-turn conversations (stateless)

### API Call Flow

1. **Request**: User message is passed to `generateResponse()` function
2. **Model Selection**: `gemini-1.5-flash` model is initialized
3. **Content Generation**: Message is sent to Gemini API
4. **Response Processing**: Text response is extracted and returned
5. **Error Handling**: API errors are caught and logged, with user-friendly error messages

### Error Handling

- **API Failures**: Network issues, rate limits, or invalid requests
- **Fallback**: Queue retries handle transient failures
- **Logging**: All errors are logged for debugging

### Assumptions & Design Decisions

#### Authentication & Security
- **OTP Mocking**: OTP is returned in API response for development simplicity (production would use SMS service)
- **JWT Expiration**: Tokens expire after standard period (not specified in code)
- **Password Hashing**: Uses bcrypt for secure password storage

#### Database Design
- **Sequelize ORM**: Chosen for its robust migration system and PostgreSQL support
- **Relationships**: User has many Chatrooms, Chatroom has many Messages, User has one Subscription
- **Indexing**: Assumed proper indexing on foreign keys and frequently queried fields

#### Queue & Performance
- **Redis Dependency**: Assumes Redis is always available (production should have Redis clustering/failover)
- **Job Persistence**: BullMQ stores jobs in Redis, surviving application restarts
- **Rate Limiting**: Basic tier limited to 5 messages/day (tracked via database or cache)

#### External APIs
- **Gemini API**: Assumes stable API availability and response format
- **Stripe Webhooks**: Requires secure webhook endpoint configuration in production
- **API Keys**: All external API keys stored as environment variables

#### Scalability Decisions
- **Horizontal Scaling**: Queue system allows multiple worker instances
- **Caching**: Redis caching reduces database load for frequent queries
- **Connection Pooling**: Database connections are pooled for efficiency

## How to Set Up and Run the Project

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Redis server
- npm or yarn package manager

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd geminibackendassign
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-super-secret-jwt-key-here
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Set up PostgreSQL database**
   - Create a PostgreSQL database
   - Update `DATABASE_URL` in `.env` with your database credentials

5. **Set up Redis**
   - Install and start Redis server locally
   - Or use a cloud Redis service (Redis Cloud, AWS ElastiCache, etc.)

6. **Run database migrations**
   ```bash
   # If using Sequelize CLI
   npx sequelize-cli db:migrate
   ```

7. **Start the application**
   ```bash
   npm start
   # Or for development with auto-reload
   npx nodemon server.js
   ```

The server will start on `http://localhost:3000`

## How to Test via Postman

### Setup Postman Collection

1. **Import Collection**: Create a new collection named "Gemini Backend API"
2. **Set Base URL**: `http://localhost:3000` (or your deployed URL)

### Authentication Flow Testing

#### 1. User Registration
- **Method**: POST
- **URL**: `{{base_url}}/auth/signup`
- **Body** (raw JSON):
  ```json
  {
    "mobileNumber": "1234567890"
  }
  ```
- **Expected Response**: User created successfully

#### 2. Send OTP
- **Method**: POST
- **URL**: `{{base_url}}/auth/send-otp`
- **Body** (raw JSON):
  ```json
  {
    "mobileNumber": "1234567890"
  }
  ```
- **Expected Response**: Contains OTP (mocked for development)

#### 3. Verify OTP & Login
- **Method**: POST
- **URL**: `{{base_url}}/auth/verify-otp`
- **Body** (raw JSON):
  ```json
  {
    "mobileNumber": "1234567890",
    "otp": "123456"
  }
  ```
- **Expected Response**: Contains JWT token
- **Save Token**: Set `auth_token` variable from response

#### 4. Set Authorization Header
For all subsequent requests, add header:
- **Key**: `Authorization`
- **Value**: `Bearer {{auth_token}}`

### Chatroom Testing

#### Create Chatroom
- **Method**: POST
- **URL**: `{{base_url}}/chatroom`
- **Headers**: Authorization header
- **Body** (raw JSON):
  ```json
  {
    "name": "My First Chat"
  }
  ```
- **Expected Response**: Chatroom created with ID

#### List Chatrooms
- **Method**: GET
- **URL**: `{{base_url}}/chatroom`
- **Headers**: Authorization header
- **Expected Response**: Array of user's chatrooms

#### Send Message
- **Method**: POST
- **URL**: `{{base_url}}/chatroom/{chatroom_id}/message`
- **Headers**: Authorization header
- **Body** (raw JSON):
  ```json
  {
    "message": "Hello, how are you?"
  }
  ```
- **Expected Response**: Message created (AI response will be added asynchronously)

#### Get Chatroom Details
- **Method**: GET
- **URL**: `{{base_url}}/chatroom/{chatroom_id}`
- **Headers**: Authorization header
- **Expected Response**: Chatroom details with messages

### Subscription Testing

#### Check Subscription Status
- **Method**: GET
- **URL**: `{{base_url}}/subscription/status`
- **Headers**: Authorization header
- **Expected Response**: Current subscription tier

#### Initiate Pro Subscription
- **Method**: POST
- **URL**: `{{base_url}}/subscribe/pro`
- **Headers**: Authorization header
- **Expected Response**: Stripe checkout session URL

### Testing Tips

- **Rate Limiting**: Basic tier users are limited to 5 messages/day
- **Caching**: Chatroom list is cached, so changes may take time to reflect
- **Async Responses**: AI responses appear asynchronously in chatroom messages
- **Error Handling**: Test with invalid tokens, missing data, etc.

## Access and Deployment Instructions

### Local Development Access
- **Server URL**: `http://localhost:3000`
- **API Documentation**: Use Postman collection above
- **Logs**: Check console for server logs and queue processing

### Production Deployment

#### Cloud Platform Options
- **Render**: Easy Node.js deployment with PostgreSQL and Redis add-ons
- **Railway**: Modern deployment platform with database support
- **AWS EC2**: Full control with EC2 instances, RDS PostgreSQL, ElastiCache Redis
- **Fly.io**: Global deployment with built-in PostgreSQL

#### Deployment Steps

1. **Choose Platform**: Select based on requirements and familiarity

2. **Database Setup**:
   - Create PostgreSQL instance
   - Run migrations: `npx sequelize-cli db:migrate`

3. **Redis Setup**:
   - Provision Redis instance (or use managed service)
   - Update `REDIS_URL` environment variable

4. **Environment Variables**:
   - Set all required environment variables in platform settings
   - Ensure API keys are securely stored

5. **Stripe Configuration**:
   - Set webhook endpoint to `https://your-domain.com/webhook/stripe`
   - Configure webhook events: `checkout.session.completed`, `invoice.payment_succeeded`

6. **Build & Deploy**:
   - Push code to repository
   - Configure build commands if needed
   - Deploy and verify health checks

#### Post-Deployment Verification

1. **Health Check**: Visit `https://your-domain.com/` (should return "Home Route")
2. **API Testing**: Use Postman with production URL
3. **Webhook Testing**: Use Stripe CLI for webhook testing
4. **Queue Monitoring**: Monitor Redis and BullMQ dashboard if available

#### Security Considerations
- Use HTTPS in production
- Implement proper CORS settings
- Regular security audits and dependency updates
- Monitor API usage and implement additional rate limiting if needed

## Development

- Use `npx nodemon server.js` for development with auto-reload
- Run tests with `npm test` (when implemented)
- Lint code with `npm run lint` (when configured)

## Security Considerations

- JWT tokens with appropriate expiration
- Rate limiting to prevent abuse
- Input validation and sanitization
- Secure handling of Stripe webhooks
- Environment variable management
- HTTPS enforcement in production
- Regular dependency updates

## Performance Optimizations

- Query caching on frequently accessed endpoints
- Asynchronous processing for external API calls
- Database indexing on critical queries
- Connection pooling for database and Redis
- BullMQ for scalable job processing

## Testing

- Unit tests for controllers and services
- Integration tests for API endpoints
- Mock external services (Gemini, Stripe) for testing
- Load testing for queue performance
