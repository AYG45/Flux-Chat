// server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs'; // ✅ Import fs at the top

let serviceAccount;
// ✅ Simplified logic to load the service account key
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // In production (on Render), parse the key from the environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // In local development, read the key from the file system
  serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json'));
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    // ⚠️ Remember to replace this with your actual Vercel URL
    origin: ["http://localhost:5173", "https://your-vercel-frontend-url.vercel.app"],
  },
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined room ${chatId}`);
  });

  socket.on('send_message', async (data) => {
    const { room: chatId, message } = data;
    try {
      const chatRef = db.collection('chats').doc(chatId);
      
      await chatRef.set({
        messages: FieldValue.arrayUnion(message)
      }, { merge: true });

      socket.to(chatId).emit('receive_message', message);
    } catch (error) {
      console.error("Error saving message to Firestore:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Use the port provided by the hosting environment, or 3001 for local dev
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});