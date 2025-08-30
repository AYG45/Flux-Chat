import "./list.css";
import UserInfo from "./userinfo/UserInfo";
import ChatList from "./chatList/ChatList";

// 1. Accept the onSelectChat prop here
const List = ({ onSelectChat }) => {
  return (
    <div className='list'> {/* Corrected className from 'List' to 'list' to match your CSS */}
      <UserInfo />
      {/* 2. Pass the prop down to ChatList */}
      <ChatList onSelectChat={onSelectChat} />
    </div>
  )
}

export default List;