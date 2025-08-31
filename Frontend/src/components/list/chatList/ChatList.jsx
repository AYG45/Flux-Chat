import { useEffect, useState } from "react";
import "./chatlist.css";
import AddUser from "./adduser/adduser";
import { db, auth } from "../../../lib/firebase";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChatList = ({ onSelectChat }) => {
  const [mode, setMode] = useState(false);
  const [friends, setFriends] = useState([]);
  const currentUser = auth.currentUser;

  const fetchFriends = async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const friendIds = userDoc.data().friends || [];

        if (friendIds.length > 0) {
          const friendsData = [];

          for (const id of friendIds) {
            const friendDoc = await getDoc(doc(db, "users", id));
            if (friendDoc.exists()) {
              friendsData.push({ id, ...friendDoc.data() });
            }
          }

          setFriends(friendsData);
        } else {
          setFriends([]);
        }
      }
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!currentUser) return;

    try {
      const currentUserRef = doc(db, "users", currentUser.uid);

      await updateDoc(currentUserRef, {
        friends: arrayRemove(friendId)
      });

      setFriends((prev) => prev.filter((f) => f.id !== friendId));

      toast.info("Friend removed successfully!");
    } catch (err) {
      console.error("Error removing friend:", err);
      toast.error("Failed to remove friend");
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [currentUser]);

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
          style={{ cursor: "pointer" }}
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

      {mode && <AddUser onUserAdded={fetchFriends} />}
    </div>
  );
};

export default ChatList;
