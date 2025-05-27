# Express.js TypeScript API

A simple RESTful API built with Express.js and TypeScript that provides basic CRUD operations for users and posts.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Build the TypeScript code
npm run build

# Production mode (requires build first)
npm start
```

The server will start on port 3000 by default.

## Project Structure

```
src/
  └── server/
      ├── types/      # TypeScript interfaces
      ├── routes/     # Route handlers
      ├── app.ts      # Express app configuration
      └── index.ts    # Server entry point
```

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Posts

- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create a new post
- `PUT /api/posts/:id` - Update a post
- `DELETE /api/posts/:id` - Delete a post

## Example Requests

### Create a new user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### Create a new post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "My Post", "content": "Post content", "userId": 1}'
```

## TypeScript Types

The API uses TypeScript interfaces to ensure type safety:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
}
``` 