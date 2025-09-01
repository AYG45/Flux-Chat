import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import List from "./components/list/List";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import Login from "./components/login/login";
import Notification from "./components/notification/notification";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setShowDetail(false); 
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  let containerClassName = "container";
  if (selectedChat) containerClassName += " chat-active";
  if (showDetail) containerClassName += " detail-active";

  return (
    <div className={containerClassName}>
      {user ? (
        <>
          <List onSelectChat={handleSelectChat} />
          {selectedChat && (
            <>
              <Chat
                selectedUser={selectedChat}
                onBack={() => setSelectedChat(null)}
                onShowDetail={() => setShowDetail((prev) => !prev)} 
              />
              <Detail 
                selectedUser={selectedChat}
                onBack={() => setShowDetail(false)}
              />
            </>
          )}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;

