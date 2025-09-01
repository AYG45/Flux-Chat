import './detail.css';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

const Detail = ({ selectedUser }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!selectedUser) {
      setUserDetails(null);
      return;
    }
    const userDocRef = doc(db, "users", selectedUser.id);
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserDetails(docSnap.data());
      }
    });
    return () => unsub();
  }, [selectedUser]);

  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const currentUserDocRef = doc(db, "users", currentUser.uid);
    const unsub = onSnapshot(currentUserDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setIsBlocked(userData.blocked?.includes(selectedUser.id));
      }
    });
    return () => unsub();
  }, [currentUser, selectedUser]);

  const handleBlockToggle = async () => {
    if (!currentUser || !selectedUser) return;
    try {
      await fetch(`http://localhost:3001/toggle-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          targetId: selectedUser.id,
        }),
      });
    } catch (err) {
      console.error("Error toggling block status:", err);
      toast.error("Failed to update block status.");
    }
  };

  const handleLogout = () => {
    signOut(auth).catch((error) => toast.error(error.message));
  };

  if (!selectedUser) {
    return (
      <div className="detail empty">
        <p>Select a conversation to see details.</p>
        <button className='logout' onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="detail">
      <div className="user">
        <img src={userDetails?.photoURL || "./avatar.png"} alt="User Avatar" />
        <h2>{userDetails?.username || "..."}</h2>
        <p>Online Status</p>
      </div>
      <div className="info">
        <div className="option">
          <span>Email:</span>
          <p>{userDetails?.email}</p>
        </div>
        <div className="option">
          <span>User ID:</span>
          <p className="user-id">{selectedUser.id}</p>
        </div>
      </div>
      <div className="actions">
        <button 
          className={isBlocked ? 'unblock-user' : 'block-user'} 
          onClick={handleBlockToggle}
        >
          {isBlocked ? 'Unblock User' : 'Block User'}
        </button>
        <button className='logout' onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Detail;

