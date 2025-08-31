import { useEffect, useState } from "react";
import "./userinfo.css";
import { auth, db } from "../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const UserInfo = () => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
        };

        fetchUserData();
    }, []);

    return (
        <div className="userInfo">
            <div className="user">
                <img
                    src={userData?.photoURL || "./avatar.png"}
                    alt="Profile"
                />
                <h2>{userData?.username || "Loading..."}</h2>
            </div>
            <div className="icons">
                <img src="./more.png" alt="More" />
                <img src="./video.png" alt="Video" />
                <img src="./edit.png" alt="Edit" />
            </div>
        </div>
    );
};

export default UserInfo;
