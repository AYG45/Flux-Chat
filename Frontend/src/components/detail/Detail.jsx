import './detail.css';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const Detail = () => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const userDocRef = doc(db, "users", currentUser.uid);

        // Set online status to true when logged in
        await updateDoc(userDocRef, {
          isOnline: true,
          lastSeen: serverTimestamp()
        });

        // Listen for changes (online status and lastSeen)
        const unsubUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUsername(data.username);
            setIsOnline(data.isOnline || false);
            setLastSeen(data.lastSeen?.toDate());
          }
        });

        return () => {
          unsubUser();
        };
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);

        // Set user offline and update last seen
        await updateDoc(userDocRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        });
      }
      await signOut(auth);
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Logout failed: " + error.message);
    }
  };

  return (
    <div className='detail'>
      {user ? (
        <>
          <div className="user">
            <img src="./avatar.png" alt="User Avatar" />
            <h2>{username || "Loading..."}</h2>
            <p>
              {isOnline ? (
                <span style={{ color: "green" }}>● Online</span>
              ) : (
                `Last seen: ${lastSeen ? lastSeen.toLocaleString() : "unknown"}`
              )}
            </p>
          </div>
          <div className="info">
            <p>Email: {user.email}</p>
            <p>User ID: {user.uid}</p>
            <button>Block User</button>
            <button className='Logout' onClick={handleLogout}>Logout</button>
          </div>
        </>
      ) : (
        <p>Loading user details...</p>
      )}
    </div>
  );
};

export default Detail;
