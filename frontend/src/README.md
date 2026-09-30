# Order Tracking & Live Support System

A full-stack application demonstrating four communication protocols in one project:

- REST API
- WebSockets using Socket.io
- JSON-RPC 2.0
- Server-Sent Events (SSE)

## Live Demo

- **Live Frontend:** Coming after deployment
- **Live Backend:** Coming after deployment

## Tech Stack

- Backend: Node.js, Express.js, Socket.io
- Database: MySQL
- Frontend: React, Vite, Bootstrap 5

## Features

| Protocol | Endpoint / Technology | Used For |
|---|---|---|
| REST | `/api/v1/catalog` | Product/catalog data |
| REST | `/api/v1/orders` | Order management |
| WebSocket | Socket.io | Live order updates and support chat |
| JSON-RPC 2.0 | `POST /rpc` | Order actions |
| SSE | `GET /events` | Live system alerts |

## REST API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/catalog` | Get products |
| GET | `/api/v1/orders` | Get orders |
| GET | `/api/v1/orders/:id` | Get one order |
| POST | `/api/v1/orders` | Create an order |
| PATCH | `/api/v1/orders/:id/status` | Update order status |
| POST | `/api/v1/alerts` | Send SSE alert |

## JSON-RPC 2.0

Endpoint:

`POST /rpc`

Available methods:

- `listMethods`
- `getOrderStatus`
- `cancelOrder`

Example:

```json
{
  "jsonrpc": "2.0",
  "method": "cancelOrder",
  "params": {
    "orderId": 1
  },
  "id": 1
}
```

## Server-Sent Events

Endpoint:

`GET /events`

SSE is used for live system alerts.

Example event data:

```json
{
  "message": "New alert",
  "level": "info",
  "time": "2026-09-30T10:00:00"
}
```

# WebSocket Events

## Client to Server

| Event | Payload | Description |
|---|---|---|
| `customer:online` | `{ name }` | Customer joins their private update room |
| `agent:online` | `{ name }` | Agent joins agents room |
| `support:request` | `{ orderId, customerName }` | Customer requests support |
| `chat:join` | `{ room, name }` | Agent joins chat |
| `chat:message` | `{ room, text }` | Sends chat message |
| `chat:typing` | `{ room }` | Typing indicator |
| `chat:leave` | `{ room }` | Leaves chat |

## Server to Client

| Event | Payload | Description |
|---|---|---|
| `order:created` | order | New order notification |
| `order:statusUpdated` | order | Order status update |
| `agent:ready` | `{ openRequests }` | Open support requests |
| `support:newRequest` | support request | New support request |
| `support:removed` | `{ room }` | Support request removed |
| `chat:joined` | `{ room, history }` | Chat joined |
| `chat:message` | message | New chat message |
| `chat:system` | `{ room, text }` | System message |
| `chat:typing` | `{ room, name }` | Typing indicator |
| `chat:error` | string | Chat error |

### Chat Rooms

Chat rooms follow this format:

`support-order-<orderId>`

Each room supports:

- 1 customer
- 1 support agent

## Screenshots

### Customer Dashboard

![Customer Dashboard](screenshots/customer-dashboard.png)

### Support Agent Dashboard

![Support Agent Dashboard](screenshots/agent-dashboard.png)

### Live Support Chat

![Live Support Chat](screenshots/live-chat.png)

### Order Tracking

![Order Tracking](screenshots/order-tracking.png)

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Muniba-ishfaq33/order-tracker.git
cd order-tracker
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=order_tracker
```

Run backend:

```bash
npm run dev
```

### 3. Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env
```

Add:

```env
VITE_API_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Project Structure

```text
order-tracker/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── database/
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── components/
│   └── pages/
│
├── .gitignore
└── README.md
```

## Deployment

The backend will be deployed on Railway and the frontend on Vercel.

- **Frontend:** To be added
- **Backend:** To be added
- **GitHub:** https://github.com/Muniba-ishfaq33/order-tracker