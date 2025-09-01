import { useEffect, useState } from "react";
import "./chatlist.css";
import AddUser from "./adduser/AddUser";
import { db, auth } from "../../../lib/firebase";
import { onSnapshot, doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { toast } from "react-toastify";

const ChatList = ({ onSelectChat, selectedChat, onFriendRemoved }) => {
  const [mode, setMode] = useState(false);
  const [friends, setFriends] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      setFriends([]);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), async (res) => {
      const userData = res.data();
      if (!userData || !userData.friends || userData.friends.length === 0) {
        setFriends([]);
        return;
      }
      const friendIds = userData.friends;
      const friendsDataPromises = friendIds.map(id => getDoc(doc(db, "users", id)));
      const friendDocs = await Promise.all(friendsDataPromises);
      const friendsData = friendDocs
        .filter(docSnap => docSnap.exists())
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setFriends(friendsData);
    });
    return () => {
      unsub();
    };
  }, [currentUser]);

  const handleRemoveFriend = async (friendId) => {
    if (!currentUser) return;

    try {
      if (selectedChat && selectedChat.id === friendId) {
        onFriendRemoved();
      }

      const currentUserRef = doc(db, "users", currentUser.uid);
      await updateDoc(currentUserRef, {
        friends: arrayRemove(friendId)
      });

      toast.info("Friend removed successfully!");
    } catch (err)
 {
      console.error("Error removing friend:", err);
      toast.error("Failed to remove friend");
    }
  };

  return (
    <div className="chatlist">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="Search" />
          <input type="text" placeholder="Search..." />
        </div>
        <img
          src={mode ? "./minus.png" : "./plus.png"}
          alt="Add"
          className="add"
          onClick={() => setMode((prev) => !prev)}
        />
      </div>

      {friends.map((friend) => (
        <div
          className="item"
          key={friend.id}
          onClick={() => onSelectChat(friend)}
        >
          <img src={friend.photoURL || "./avatar.png"} alt={friend.username} />
          <div className="text">
            <span>{friend.username}</span>
            <p>{friend.email}</p>
          </div>
          <img
            src="./minus.png"
            alt="Remove"
            className="remove"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveFriend(friend.id);
            }}
            style={{ width: "20px", height: "20px", cursor: "pointer", marginLeft: "auto" }}
          />
        </div>
      ))}

       {mode && <AddUser onClose={() => setMode(false)} />}
    </div>
  );
};

export default ChatList;