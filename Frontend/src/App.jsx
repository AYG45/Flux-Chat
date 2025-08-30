import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import List from "./components/list/List"; // This is your ChatList component
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import Login from "./components/login/login";
import Notification from "./components/notification/notification";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. ADD STATE TO HOLD THE SELECTED USER/CHAT
  // This state will be updated when a user is clicked in the List component.
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. CREATE A HANDLER FUNCTION TO UPDATE THE STATE
  // This function will be passed down to the List component.
  const handleSelectChat = (chat) => {
    console.log("Setting selected chat in App.jsx:", chat);
    setSelectedChat(chat);
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="container">
      {user ? (
        <>
          {/* 3. PASS THE HANDLER AND STATE DOWN AS PROPS */}

          {/* The 'List' component receives the function so it can update the state */}
          <List onSelectChat={handleSelectChat} />

          {/* The 'Chat' and 'Detail' components receive the state so they know what to display */}
          <Chat selectedUser={selectedChat} />
          <Detail selectedUser={selectedChat} />
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;