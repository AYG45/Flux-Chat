import { useState } from "react";
import { db, auth } from "../../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./adduser.css";
import { toast } from "react-toastify";

const AddUser = ({ onUserAdded, onClose }) => {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUser = auth.currentUser;

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUser(null);

    if (!username.trim()) {
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        setUser({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError("User not found. Please check the username.");
      }
    } catch (err) {
      console.error("Error searching user:", err);
      setError("An error occurred while searching.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!currentUser || !user) return;
    setError("");

    try {
      // ✅ This now reads the server URL from an environment variable
      const res = await fetch(`${import.meta.env.VITE_API_URL}/add-friend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          friendId: user.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add friend");
      
      toast.success(`${user.username} has been added!`);
      onClose();
    } catch (err) {
      console.error("Error adding user:", err);
      setError(err.message);
      toast.error(err.message);
    }
  };

  return (
    <div className="addUser-backdrop">
      <div className="addUser-modal">
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>Add New User</h2>
        <p>Find new users by their exact username.</p>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Enter username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        {user && (
          <div className="user-result">
            <div className="detail">
              <img src={user.photoURL || "./avatar.png"} alt={user.username} />
              <span>{user.username}</span>
            </div>
            <button onClick={handleAddUser}>Add User</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUser;
