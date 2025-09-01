import "./list.css";
import UserInfo from "./UserInfo/UserInfo";
import ChatList from "./chatList/ChatList";

const List = ({ onSelectChat, selectedChat, onFriendRemoved }) => {
  return (
    <div className='list'>
      <UserInfo />
      <ChatList
        onSelectChat={onSelectChat}
        selectedChat={selectedChat}
        onFriendRemoved={onFriendRemoved}
      />
    </div>
  )
}

export default List;
