# Nexus Meet - Real-Time Communication Platform

A full-stack, scalable video conferencing application featuring WebRTC peer-to-peer streaming, Socket.io signaling, real-time chat, screen sharing, and a collaborative whiteboard.

## Features Built
1. **WebRTC Video/Audio P2P Streaming**
2. **Real-time Chat via Socket.io**
3. **Collaborative Whiteboard**
4. **Room Management & Authentication**
5. **Modern, Responsive UI with Tailwind CSS**

## Step-by-Step Setup Guide

### 1. Backend Setup
1. Open a terminal and navigate to the `backend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure the `.env` file exists with your `JWT_SECRET` and `PORT`.
4. Start the server (this will also automatically initialize the SQLite database):
   ```bash
   node server.js
   ```
   **Server should report running on port 5000.**

### 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser to the URL Vite provides (typically `http://localhost:5173`).

---

## Architecture & Data Flow

### WebRTC Signaling Explained
WebRTC requires a signaling server to exchange initial connection data before establishing a direct P2P connection. This app uses Socket.io to facilitate this exchange.

1. **User joins room:** App requests camera/mic via `getUserMedia`. Socket emits `'join-room'`.
2. **Offer Creation:** Existing users receive `'user-connected'`, create an RTCPeerConnection offer, and send it back to the new user via Socket `'offer'`.
3. **Answer Creation:** The new user receives the `'offer'`, sets it as remote description, creates an `'answer'`, and sends it back.
4. **ICE Candidates:** Both peers exchange `'ice-candidate'` packets via socket to discover optimal network routes.
5. **Stream Established:** Remote tracks are received via `ontrack` events, and rendered in the `VideoGrid` component.

### List of Socket Events
| Event | Direction | Purpose |
|-------|-----------|---------|
| `join-room` | Client -> Server | Joins a socket room. |
| `user-connected` | Server -> Client | Notifies room a new user joined. |
| `offer` | Both | WebRTC Session Description (Offer). |
| `answer` | Both | WebRTC Session Description (Answer). |
| `ice-candidate` | Both | WebRTC ICE routing candidate. |
| `user-disconnected` | Server -> Client | Notifies room a user left. |
| `chat-message` | Both | Broadcasts text chat in the room. |
| `draw` | Both | Broadcasts canvas path data. |
| `toggle-media` | Client -> Server | Notifies room of audio/video toggle. |


C:\Users\sathv\Downloads\Creations\Real-Time Communication App\frontend> npm run dev
C:\Users\sathv\Downloads\Creations\Real-Time Communication App\backend> node server.js