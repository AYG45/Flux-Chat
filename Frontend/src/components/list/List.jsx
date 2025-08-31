import "./list.css";
import UserInfo from "./UserInfo/UserInfo";
import ChatList from "./chatList/ChatList";

const List = ({ onSelectChat }) => {
  return (
    <div className="list">
      <UserInfo />
      <ChatList onSelectChat={onSelectChat} />
    </div>
  );
};

export default List;
