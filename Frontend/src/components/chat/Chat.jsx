import './chat.css';
import EmojiPicker from 'emoji-picker-react';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import Ably from 'ably';

const Chat = ({ selectedUser, onShowDetail, onBack }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [ablyClient, setAblyClient] = useState(null);
  const endRef = useRef(null);
  const currentUser = auth.currentUser;

  const [blockStatus, setBlockStatus] = useState({
    amIBlocked: false,
    haveIBlocked: false,
  });

  useEffect(() => {
    if (!currentUser) return;
    
    const client = new Ably.Realtime({ 
      authUrl: `${import.meta.env.VITE_API_URL}/auth?clientId=${currentUser.uid}` 
    });
    setAblyClient(client);
    
    return () => client.close();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const otherUserDocRef = doc(db, "users", selectedUser.id);
    const unsubOtherUser = onSnapshot(otherUserDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setBlockStatus(prev => ({ ...prev, amIBlocked: docSnap.data().blocked?.includes(currentUser.uid) }));
        }
    });

    const currentUserDocRef = doc(db, "users", currentUser.uid);
    const unsubCurrentUser = onSnapshot(currentUserDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setBlockStatus(prev => ({ ...prev, haveIBlocked: docSnap.data().blocked?.includes(selectedUser.id) }));
        }
    });

    return () => {
        unsubOtherUser();
        unsubCurrentUser();
    };
  }, [currentUser, selectedUser]);

  useEffect(() => {
    if (!selectedUser || !ablyClient || !currentUser) return;
    const chatId = currentUser.uid > selectedUser.id ? currentUser.uid + selectedUser.id : selectedUser.id + currentUser.uid;
    const channel = ablyClient.channels.get(`chat:${chatId}`);

    const subscribeToMessages = async () => {
      const chatDocRef = doc(db, 'chats', chatId);
      const chatDocSnap = await getDoc(chatDocRef);
      setMessages(chatDocSnap.exists() ? chatDocSnap.data().messages : []);

      channel.subscribe('new-message', (msg) => {
        setMessages((prev) => [...prev, msg.data]);
      });
    };

    subscribeToMessages();
    return () => channel.unsubscribe();
  }, [selectedUser, ablyClient, currentUser]);


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleSendMessage = async () => {
    if (!text.trim() || !currentUser || blockStatus.amIBlocked || blockStatus.haveIBlocked) return;
    const chatId = currentUser.uid > selectedUser.id ? currentUser.uid + selectedUser.id : selectedUser.id + currentUser.uid;
    const messageData = { text: text.trim(), senderId: currentUser.uid, createdAt: new Date().toISOString() };
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: messageData }),
      });
      setText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!selectedUser) {
    return <div className="chat-placeholder"><h2>Select a chat to start messaging</h2></div>;
  }

  let blockMessage = "";
  if (blockStatus.amIBlocked) blockMessage = "You are blocked by this user.";
  if (blockStatus.haveIBlocked) blockMessage = "You have blocked this user.";

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
            <button className="back-button" onClick={onBack}>&larr;</button>
            <img src={selectedUser.photoURL || './avatar.png'} alt="" />
            <div className="texts">
                <span>{selectedUser.username}</span>
                <p>{selectedUser.email}</p>
            </div>
        </div>
        <div className="icons">
            <img src="./phone.png" alt="Phone" />
            <img src="./video.png" alt="Video" />
            <img src="./info.png" alt="Info" onClick={onShowDetail} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      <div className="center">
        {messages.map((message, index) => (
          <div
            className={message.senderId === currentUser.uid ? 'message own' : 'message'}
            key={index}
          >
            <div className="texts">
              <p>{message.text}</p>
              <span>{new Date(message.createdAt.seconds * 1000 || message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        {blockMessage ? (
            <div className="blocked-message">{blockMessage}</div>
        ) : (
            <>
                <div className="icons">
                    <img src="./img.png" alt="" />
                    <img src="./camera.png" alt="" />
                    <img src="./mic.png" alt="" />
                </div>
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <div className="emoji">
                    <img src="./emoji.png" alt="" onClick={() => setOpen((prev) => !prev)} />
                    <div className="picker"><EmojiPicker open={open} onEmojiClick={handleEmoji} /></div>
                </div>
                <button className="sendButton" onClick={handleSendMessage}>Send</button>
            </>
        )}
      </div>
    </div>
  );
};

export default Chat;

