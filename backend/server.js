// server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

import { readFileSync } from 'fs';
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
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
      
      // ✅ FIX: Use .set() with {merge: true} to create the doc if it doesn't exist
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

httpServer.listen(3001, () => {
  console.log('Server is running on port 3001');
});