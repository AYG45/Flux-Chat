import './chat.css';
import EmojiPicker from 'emoji-picker-react';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL);

const Chat = ({ selectedUser }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const endRef = useRef(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const setupChat = async () => {
      if (!selectedUser) return;

      setMessages([]);

      const chatId = currentUser.uid > selectedUser.id
        ? currentUser.uid + selectedUser.id
        : selectedUser.id + currentUser.uid;

      const chatDocRef = doc(db, "chats", chatId);
      const chatDocSnap = await getDoc(chatDocRef);
      if (chatDocSnap.exists()) {
        setMessages(chatDocSnap.data().messages || []);
      }

      socket.emit('join_room', chatId);
    };

    setupChat();

    const handleReceiveMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };
    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [selectedUser, currentUser.uid]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleSendMessage = () => {
    if (text === '') return;

    const chatId = currentUser.uid > selectedUser.id
      ? currentUser.uid + selectedUser.id
      : selectedUser.id + currentUser.uid;

    const messageData = {
      text: text,
      senderId: currentUser.uid,
      createdAt: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, messageData]);
    socket.emit('send_message', { room: chatId, message: messageData });
    setText('');
  };

  if (!selectedUser) {
    return (
      <div className='chat-placeholder'>
        <h2>Select a chat to start messaging</h2>
      </div>
    );
  }

  return (
    <div className='chat'>
      <div className="top">
        <div className="user">
          <img src={selectedUser.photoURL || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{selectedUser.username}</span>
            <p>{selectedUser.email}</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>

      <div className="center">
        {messages.map((message, index) => (
          <div
            className={message.senderId === currentUser.uid ? "message own" : "message"}
            key={index}
          >
            <div className="texts">
              <p>{message.text}</p>
              <span>{new Date(message.createdAt.seconds * 1000 || message.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <div className="icons">
          <img src="./img.png" alt="" />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder='Type your message...'
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <div className="emoji">
          <img src="./emoji.png" alt="" onClick={() => setOpen((prev) => !prev)} />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button className='sendButton' onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;