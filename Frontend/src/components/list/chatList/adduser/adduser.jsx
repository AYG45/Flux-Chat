import { useState } from "react";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import "./adduser.css";
import { toast } from "react-toastify";

const AddUser = ({ onUserAdded }) => {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const currentUser = auth.currentUser;

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setUser(null);

    if (!username.trim()) return;

    try {
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        setUser({
          id: docSnap.id,
          ...docSnap.data()
        });
      } else {
        setError("User not found");
      }
    } catch (err) {
      console.error("Error searching user:", err);
      setError("Something went wrong");
    }
  };

  const handleAddUser = async () => {
    if (!currentUser || !user) return;

    try {
      const currentUserRef = doc(db, "users", currentUser.uid);
      await updateDoc(currentUserRef, {
        friends: arrayUnion(user.id)
      });

      toast.success(`${user.username} added successfully!`);
      setUsername("");
      setUser(null);

      if (onUserAdded) {
        onUserAdded();
      }
    } catch (err) {
      console.error("Error adding user:", err);
      setError("Failed to add user");
    }
  };

  return (
    <div className="adduser">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.photoURL || "./avatar.png"} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAddUser}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
