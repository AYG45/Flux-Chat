import "./list.css";
import UserInfo from "./userinfo/userinfo";
import ChatList from "./chatList/chatlist";

const List = ({ onSelectChat }) => {
  return (
    <div className='list'>
      <UserInfo />
      <ChatList onSelectChat={onSelectChat} />
    </div>
  )
}

export default List;