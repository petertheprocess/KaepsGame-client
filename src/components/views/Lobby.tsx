import React, { useRef, useEffect, useState } from "react";
import { api, handleError } from "helpers/api";
import { Spinner } from "components/ui/Spinner";
import { Button } from "components/ui/Button";
import { useNavigate } from "react-router-dom";
import BaseContainer from "components/ui/BaseContainer";
import PropTypes from "prop-types";
import { User, Room } from "types";
import Popup from "components/ui/Popup";
import { Dropdown } from "components/ui/Dropdown";
import "styles/views/Lobby.scss";
import "styles/ui/Popup.scss";
type PlayerProps = {
  user: User;
};
type RoomComponentProps = {
  room: Room;
};

type RoomListProps = {
  rooms: Room[];
};
const Player: React.FC<PlayerProps> = ({ user }) => (
  <div className="player">
    <img
      src={"https://twemoji.maxcdn.com/v/latest/72x72/1f604.png"}
      alt={user.username}
      className="player-avatar"
    />
    <div className="player-username">{user.username}</div>
  </div>
);
const RoomComponent: React.FC<RoomComponentProps> = ({ room }) => (
  <div className="room">
    <div className="room-header">
      {room.roomPlayersList.map((user) => (
        <Player key={user.id} user={user} />
      ))}
    </div>
    <div className="room-footer">
      <div className="room-theme">{room.theme}</div>
      <div
        className="room-status"
        style={{ color: room.status === "In Game" ? "orange" : "green" }}
      >
        {room.status}
      </div>
    </div>
  </div>
);
const RoomList: React.FC<RoomListProps> = ({ rooms }) => (
  <div className="room-list">
    {rooms.map((room) => (
      <RoomComponent key={room.id} room={room} />
    ))}
  </div>
);
interface FormFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = (props) => {
  return (
    <div className="profile-popup field">
      <label className="profile-popup label">
        {props.label}
      </label>
      <input
        className="profile-popup input"
        placeholder={props.placeholder}
        value={props.value}
        type={props.type}
        onChange={e => props.onChange(e.target.value)}
        disabled={props.disabled}
      />
    </div>
  );
};
Player.propTypes = {
  user: PropTypes.object,
};

const mockRoomPlayers: User[] = [

  { id: "1", username: "Alice", avatar: "grinning-face-with-sweat", name: "Alice Wonderland", status: "ONLINE", registerDate: new Date("2021-08-01"), birthday: new Date("1990-01-01") },
  { id: "2", username: "Bob", avatar: "grinning-face-with-sweat", name: "Bob Builder", status: "OFFLINE", registerDate: new Date("2021-09-01"), birthday: new Date("1985-02-02") },
  { id: "3", username: "Han", avatar: "grinning-face-with-sweat", name: "Alice Wonderland", status: "ONLINE", registerDate: new Date("2021-08-01"), birthday: new Date("1990-01-01") },
  { id: "4", username: "Li", avatar: "grinning-face-with-sweat", name: "Bob Builder", status: "OFFLINE", registerDate: new Date("2021-09-01"), birthday: new Date("1985-02-02") },
  { id: "5", username: "Liuz", avatar: "grinning-face-with-sweat", name: "Bob Builder", status: "OFFLINE", registerDate: new Date("2021-09-01"), birthday: new Date("1985-02-02") },

];

const avatarList: string[] = [
  "grinning-face-with-sweat","horse-face", "hot-face","hushed-face", "kissing-face",
  "last-quarter-moon-face","loudly-crying-face", "lying-face"
]

const mockRooms: Room[] = [
  {
    id: "1",
    roomOwnerId: "1",
    roomPlayersList: mockRoomPlayers,
    theme: "Advanced",
    status: "In Game",
    maxPlayersNum: 4,
    alivePlayersList: mockRoomPlayers,
    currentPlayerIndex: 0,
    playToOuted: false,
  },
  {
    id: "2",
    roomOwnerId: "2",
    roomPlayersList: mockRoomPlayers,
    theme: "Food",
    status: "Free",
    maxPlayersNum: 4,
    alivePlayersList: mockRoomPlayers,
    currentPlayerIndex: 1,
    playToOuted: false,
  },
];

const Lobby = () => {
  const navigate = useNavigate();
  const roomCreationPopRef = useRef<HTMLDialogElement>(null);
  const profilePopRef = useRef<HTMLDialogElement>(null);
  const changeAvatarPopRef = useRef<HTMLDialogElement>(null);
  const infoPopRef = useRef<HTMLDialogElement>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [user, setUser] = useState<User[]>(mockRoomPlayers[0]);
  const [username, setUsername] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [roomName, setRoomName] = useState("");
  const [numRounds, setNumRounds] = useState(2);
  const [roomTheme, setRoomTheme] = useState("");

  const logout = async () => {
    const id = sessionStorage.getItem("id");
    sessionStorage.removeItem("token");
    //apply a post request for user logout
    try {
      const requestBody = JSON.stringify({ id: id });
      const response = await api.post("/users/logout", requestBody);
      console.log(response);
    } catch (error) {
      alert(`Something went wrong during the logout: \n${handleError(error)}`);
    }
    navigate("/login");
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // 获取所有房间信息
        const roomsResponse = await api.get("/games/lobby");
        console.log("Rooms data:", roomsResponse.data);

        // 使用 Promise.all 来并发获取每个房间的用户详细信息
        const roomsWithPlayerDetails = await Promise.all(roomsResponse.data.map(async (room) => {
          // 对每个房间的用户 ID 列表并发请求用户信息
          const playerDetails = await Promise.all(room.roomPlayersList.map(async (userId) => {
            const userResponse = await api.get(`/users/${userId}`);

            return userResponse.data;  // 返回用户的详细信息
          }));

          return {
            ...room,
            roomPlayersList: playerDetails  // 替换房间中的用户 ID 列表为用户详细信息
          };
        }));

        // 更新房间状态，包含了用户的详细信息
        setRooms(roomsWithPlayerDetails);

        console.log("request to:", roomsResponse.request.responseURL);
        console.log("status code:", roomsResponse.status);
        console.log("status text:", roomsResponse.statusText);
        console.log("requested data:", roomsResponse.data);

        // See here to get more data.
        console.log(roomsResponse);

        // Get user ID from sessionStorage
        const userId = sessionStorage.getItem("id");
        if (userId) {
          // Get current user's information
          const userResponse = await api.get(`/users/${userId}`);
          setUser(userResponse.data);  // Set user data from API
          console.log("User data:", userResponse.data);
        } else {
          console.log("No user ID found in sessionStorage.");
        }
      } catch (error) {
        console.error(
          `Something went wrong while fetching the users: \n${handleError(
            error
          )}`
        );
        console.error("Details:", error);
        alert(
          "Something went wrong while fetching the users! See the console for details."
        );
      }
    }

    fetchData().catch(error => {
      console.error("Unhandled error in fetchData:", error);
    });
  }, []);

  const doEdit = async () => {
    try {
      const requestBody = JSON.stringify({ username: username, avatar: avatar });
      const id = sessionStorage.getItem("id");
      console.log("Request body:", requestBody);
      await api.put(`/users/${id}`, requestBody);
      updateUsername(username);
      toggleProfilePop();
    } catch (error) {
      if (error.response && error.response.data) {
        alert(error.response.data.message);
      } else {
        console.error("Error:", error.message);
        alert("An unexpected error occurred.");
      }
    }
  };

  const createRoom = async () => {
    try {
      console.log('Current theme:', roomTheme);
      const ownerId = sessionStorage.getItem("id");  // 假设ownerId存储在sessionStorage中
      const requestBody = JSON.stringify({
        roomName: roomName,
        maxPlayersNum: numRounds,
        roomOwnerId: ownerId,
        theme: roomTheme
      });
      console.log(requestBody)
      const response = await api.post("/games", requestBody);
      console.log("Room created successfully:", response);
      console.log("Room ID:", response.data.roomId);
      const roomId = response.data.roomId;
      navigate(`/rooms/${roomId}`);
      //toggleRoomCreationPop();  // 关闭创建房间的弹窗
    } catch (error) {
      console.error("Error creating room:", handleError(error));
      alert(`Error creating room: ${handleError(error)}`);
    }
  };

  const toggleRoomCreationPop = () => {
    // if the ref is not set, do nothing
    if (!roomCreationPopRef.current) {
      return;
    }
    // if the dialog is open, close it. Otherwise, open it.
    roomCreationPopRef.current.hasAttribute("open")
      ? roomCreationPopRef.current.close()
      : roomCreationPopRef.current.showModal();
  };

  const toggleProfilePop = () => {
    // if the ref is not set, do nothing
    if (!profilePopRef.current) {
      return;
    }
    // if the dialog is open, close it. Otherwise, open it.
    profilePopRef.current.hasAttribute("open")
      ? profilePopRef.current.close()
      : profilePopRef.current.showModal();
  };

  async function enterRoom(roomId, userId) {
    try {
      const requestBody = JSON.stringify({ id: userId });
      await api.put(`/games/${roomId}`, requestBody);
    } catch (error) {
      console.error(`Something went wrong during the enterRoom: \n${handleError(error)}`);
    }
  }

  const toggleAvatarPop = () => {
    // if the ref is not set, do nothing
    if (!changeAvatarPopRef.current) {
      return;
    }
    // if the dialog is open, close it. Otherwise, open it.
    changeAvatarPopRef.current.hasAttribute("open")
      ? changeAvatarPopRef.current.close()
      : changeAvatarPopRef.current.showModal();
  };


  const toggleInfoPop = () => {
    // if the ref is not set, do nothing
    if (!infoPopRef.current) {
      return;
    }
    // if the dialog is open, close it. Otherwise, open it.
    infoPopRef.current.hasAttribute("open")
      ? infoPopRef.current.close()
      : infoPopRef.current.showModal();
  };

  const changeAvatar = async (newAvatar) =>{
    try {
      // 更新本地状态
      setAvatar(newAvatar);

      // 构造请求体，只包含 avatar 更改
      const requestBody = JSON.stringify({ avatar: newAvatar });
      const id = sessionStorage.getItem("id");
      console.log("Request body:", requestBody);
      await api.put(`/users/${id}`, requestBody);
      console.log("Avatar changed successfully");
      updateAvatar(newAvatar);
    } catch (error) {
      if (error.response && error.response.data) {
        alert(error.response.data.message);
      } else {
        console.error("Error:", error.message);
        alert("An unexpected error occurred.");
      }
    }
  }

  const updateAvatar = (newAvatar) => {
    setUser(prevUser => ({
      ...prevUser, // 复制 prevUser 对象的所有现有属性
      avatar: newAvatar // 更新 avatar 属性
    }));
  };

  const updateUsername = (newUsername) => {
    setUser(prevUser => ({
      ...prevUser, // 复制 prevUser 对象的所有现有属性
      username: newUsername // 更新 avatar 属性
    }));
  };
  const userinfo = () => {
    return;
  };


  const renderRoomLists = () => {
    return rooms.map((Room) => (
      <div className="room-container" key={Room.roomId} onClick={(e) => {
        e.preventDefault();
        const currentId = sessionStorage.getItem("id");
        // const isPlayerInRoom = Room.roomPlayersList.join().includes(currentId);
        enterRoom(Room.roomId, currentId)
          .then(() => {
            alert(currentId);
            navigate(`/rooms/${Room.roomId}`);
          })
          .catch(error => {
            console.error(`Something went wrong during the enterRoom: \n${handleError(error)}`);
            alert(`Something went wrong during the enterRoom: \n${handleError(error)}`);
          });
      }}>
        <div className="room-players">
          {Room.roomPlayersList?.map((user, index) => (
            <div className="player" key={index}>
              <i className={"twa twa-" + user.avatar} style={{fontSize: "3.8rem"}}/>
              <div className="name">{user.username}</div>
            </div>
          ))}
        </div>
        <div className="room-header">
          <div style={{fontWeight: "bold"}}>{Room.roomName}</div>
          <div>{Room.theme}</div>
          <span
            className={`room-status ${
              Room.status === "In Game" ? "in-game" : "free"
            }`}
          >
            {Room.roomProperty}
          </span>
        </div>
      </div>
    ));
  };


  return (
    <BaseContainer>
      <div className="user-container" onClick={toggleProfilePop}>
        <i className={"twa twa-" + user.avatar} style={{fontSize: "3.8rem", marginTop:"0.8rem"}}/>
        <div className="name">{user.username}</div>
      </div>
      <div className="title-container">
        <div className="big-title">Kaeps</div>
        <div className="information" onClick={toggleInfoPop}>i</div>
      </div>
      <div className="lobby room-list-wrapper">
        {/* for clip the scrollbar inside the border */}
        <div className="lobby room-list">
          <h1>Rooms</h1>
          {renderRoomLists()}
        </div>
        <div className="lobby room-list btn-container">
          <Button className="create-room-btn" onClick={toggleRoomCreationPop}>
            New Room
          </Button>
        </div>
      </div>


      <Popup ref={profilePopRef} toggleDialog={toggleProfilePop} className = "profile-popup">
        <BaseContainer className="profile-popup content">
          <div className="avatar-container" onClick={() => {
            toggleAvatarPop();
            toggleProfilePop();
          }}>
            <i className={"twa twa-" + user.avatar} style={{fontSize: "10rem", marginTop:"0.8rem", textAlign:"center"}}/>
          </div>
          <div className="profile-popup field">
            <label className="profile-popup label">
              Username:
            </label>
            <input
              // className="profile-popup input"
              //value={user.username}
              type="text"
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>Name: {user.name}</div>
          <div>Status: {user.status}</div>

          <div>RegisterDate: {user && new Date(user.registerDate).toLocaleDateString()}</div>
          <div>Birthday: {user && new Date(user.birthday).toLocaleDateString()}</div>

          <div className="profile-popup btn-container">
            <Button className="cancel" onClick={() => {
              toggleProfilePop();
            }}>
              Cancel
            </Button>
            <Button className="cancel" onClick={() => doEdit()
            }>
              Edit
            </Button>
          </div>
        </BaseContainer>
      </Popup>

      <Popup
        ref={changeAvatarPopRef}
        toggleDialog={toggleAvatarPop}
        className="room-creation-popup"
      >
        <div className="avatar-list">
          {avatarList?.map((avatar,index) => (
            <div className="player" key={index} >
              <i className={"twa twa-" + avatar} style={{fontSize: "3.8rem"}} onClick={() => {
                changeAvatar(avatar).then(r => toggleAvatarPop);
                toggleAvatarPop();
              }}/>
            </div>
          ))}
        </div>
      </Popup>

      <Popup
        ref={roomCreationPopRef}
        toggleDialog={toggleRoomCreationPop}
        className="room-creation-popup"
      >
        <BaseContainer className="room-creation-popup content">
          <div className="title">Create Room</div>
          <input type="text" placeholder="Room Name" value={roomName} onChange={e => setRoomName(e.target.value)} />
          <div>Number of Maximum Players: </div>
          <input
            type="number"
            placeholder="2"
            value={numRounds}
            onChange={e => {
              const value = parseInt(e.target.value, 10);
              setNumRounds(value >= 2 && value <= 10 ? value : '');
            }}
            min={2}
            max={10}
          />
          <Dropdown
            className="theme-dropdown"
            prompt="Select Theme"
            defaultValue={roomTheme}
            options={[
              { value: "JOB", label: "JOB"},
              { value: "FOOD", label: "FOOD" },
              { value: "SUPERHERO", label: "SUPERHERO" },
              { value: "SPORTS", label: "SPORTS" },
            ]}
            onChange={(value) => setRoomTheme(value)}
          />
          <div className="room-creation-popup btn-container">
            <Button className="create-room" onClick={createRoom}>Create Room</Button>
            <Button className="cancel" onClick={toggleRoomCreationPop}>Cancel</Button>
          </div>
        </BaseContainer>

      </Popup>

      <Popup ref={infoPopRef} toggleDialog={toggleInfoPop} className="profile-popup">
        <div>Here is some Guidelines....</div>
        <div className="profile-popup btn-container">
          <Button className="cancel" onClick={toggleInfoPop}>
            Close
          </Button>
        </div>
      </Popup>
    </BaseContainer>
  );
};

export default Lobby;
