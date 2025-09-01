import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Ably from 'ably';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json'));
}

const ably = new Ably.Rest(process.env.ABLY_API_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();
const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "https://your-vercel-frontend-url.vercel.app"] 
}));

app.use(express.json());

app.get('/auth', async (req, res) => {
    try {
      const tokenRequest = await ably.auth.createTokenRequest({ clientId: req.query.clientId || 'default-client' });
      res.json(tokenRequest);
    } catch (error) {
      res.status(500).send(`Error requesting Ably token: ${error}`);
    }
});
app.post('/message', async (req, res) => {
    const { chatId, message } = req.body;
    const senderId = message.senderId;
    const receiverId = chatId.replace(senderId, '');
    try {
        const receiverDoc = await db.collection('users').doc(receiverId).get();
        if (receiverDoc.exists && receiverDoc.data().blocked?.includes(senderId)) {
            return res.status(403).json({ error: 'You are blocked by this user.' });
        }
        const senderDoc = await db.collection('users').doc(senderId).get();
        if (senderDoc.exists && senderDoc.data().blocked?.includes(receiverId)) {
            return res.status(403).json({ error: 'You have blocked this user.' });
        }
        const chatRef = db.collection('chats').doc(chatId);
        await chatRef.set({ messages: FieldValue.arrayUnion(message) }, { merge: true });
        const channel = ably.channels.get(`chat:${chatId}`);
        await channel.publish('new-message', message);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});
app.post('/add-friend', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        const userRef = db.collection('users').doc(userId);
        const friendRef = db.collection('users').doc(friendId);
        await db.runTransaction(async (t) => {
            t.update(userRef, { friends: FieldValue.arrayUnion(friendId) });
            t.update(friendRef, { friends: FieldValue.arrayUnion(userId) });
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add friend.' });
    }
});
app.post('/toggle-block', async (req, res) => {
    const { userId, targetId } = req.body;
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const isBlocked = userData.blocked?.includes(targetId);
        await userRef.update({
            blocked: isBlocked ? FieldValue.arrayRemove(targetId) : FieldValue.arrayUnion(targetId)
        });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update block status.' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});