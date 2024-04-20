import React, { useEffect, useState, useRef, useMemo} from "react";
import { api, handleError } from "helpers/api";
import { useNavigate } from "react-router-dom";
import BaseContainer from "components/ui/BaseContainer";
import PropTypes from "prop-types";
import { User } from "types";
import "styles/views/Gameroom.scss";
import "styles/views/Header.scss";
import "styles/twemoji-amazing.css";
import Header from "./Header";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import AudioRecorder from "components/ui/AudioRecorder";
import WavePlayer from "components/ui/WavePlayer";
import { ButtonPlayer } from "components/ui/ButtonPlayer";
// Stomp related imports
import SockJS from "sockjs-client";
import { over } from "stompjs";
import type { Timestamped, PlayerAudio, PlayerAndRoomID, AnswerGuess, StompResponse , Base64audio} from "stomp_types";

// type AudioBlobDict = { [userId: number]: Base64audio };
type SharedAudioURL = {[userId: number]: string};

const Gameroom = () => {
  const navigate = useNavigate();
  const stompClientRef = useRef(null);
  /**
   * Question: why we need this user state here?
   * if just for saving my id and name, we can make it a const prop
   */
  const [user,setUser] = useState();
  const [users, setUsers] = useState<User[]>(null);
  const [showScore, setShowScore] = useState(false);
  const [showReadyPopup, setShowReadyPopup] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [validateAnswer, setValidateAnswer] = useState(null);
  const [playerLists, setPlayerLists] = useState([]);
  const [gameInfo,setGameInfo] = useState();
  const [roomInfo,setRoomInfo] = useState();
  const [currentStatus, setCurrentStatus] = useState< "speak" | "guess" | "reveal" >("speak");
  const [sharedAudioList, setSharedAudioList] = useState<SharedAudioURL[]>([]);
  const [currentSpeakerAudioURL, setCurrentSpeakerAudioURL] = useState<string | null>(null);
  const myRecordingReversedRef = useRef<Base64audio | null>(null);
  // const sharedAudioListRef = useRef<AudioBlobDict>({}); // store all shared audio blobs
  /**
   * Attention!!: Just for testing purposes
   * need to pass an audio blob to the WavePlayer like this:
   */
  const [testAudioBlob, setTestAudioBlob] = useState<Blob | null>(null);
  const [testAudioURL, setTestAudioURL] = useState<string | null>(null);

  // this ref is used to track the current speaker id in callback functions
  const currentSpeakerIdRef = useRef<number>();
  if (gameInfo && gameInfo.currentSpeaker) {
    currentSpeakerIdRef.current = gameInfo.currentSpeaker.id;
  }

  // useMemo to initialize and load FFmpeg wasm module
  // load FFmpeg wasm module
  const ffmpegObj = useMemo(() => {
    const ffmpeg = new FFmpeg();
    try {
      ffmpeg.load();
      console.log("FFmpeg module loaded");
    }
    catch (error) {
      console.error("Failed to load FFmpeg module", error);
      alert("Failed to load FFmpeg module");
    }
    
    return ffmpeg;
  }, []);

  useEffect(() => {
    // define subscription instances
    let playerInfoSuber;
    let gameInfoSuber;
    let sharedAudioSuber;

    //const roomId = 5;
    const connectWebSocket = () => {
      let Sock = new SockJS("http://localhost:8080/ws/roomID/playerID");
      //let Sock = new SockJS('https://sopra-fs23-group-01-server.oa.r.appspot.com/ws');
      stompClientRef.current = over(Sock);
      stompClientRef.current.connect({}, onConnected, onError);
    };

    const timestamp = new Date().getTime(); // Get current timestamp

    const onConnected = () => {
      // subscribe to the topic
      playerInfoSuber = stompClientRef.current.subscribe("/plays/info", onPlayerInfoReceived);
      gameInfoSuber = stompClientRef.current.subscribe("/games/info", onGameInfoReceived);
      sharedAudioSuber = stompClientRef.current.subscribe("/plays/audio", onShareAudioReceived);
      //connect or reconnect
    };

    const onPlayerInfoReceived = (payload) => {
      const payloadData = JSON.parse(payload.body);
      setPlayerLists(payloadData.message);
      //resp success
    }

    const onGameInfoReceived = (payload) => {
      const payloadData = JSON.parse(payload.body);
      if(payloadData.message.gameStatus === "ready"){
        setShowReadyPopup(true);
      }else if (payloadData.message.gameStatus === "over"){
        setShowReadyPopup(false);
        setGameOver(true);
      }else {
        setShowReadyPopup(false);
      }
      setGameInfo(payloadData.message);
    }

    const onShareAudioReceived = (payload) => {
      const payloadDataStamped = JSON.parse(payload.body) as Timestamped<PlayerAudio>;
      const playerAudio = payloadDataStamped.message as PlayerAudio;
      const userId = playerAudio.userID;
      const audioData = playerAudio.audioData;
      // create URL from base64 audio data
      const blob = new Blob(
        [
          new Uint8Array(
            atob(audioData.split(",")[1])
              .split("")
              .map((c) => c.charCodeAt(0))
          ),
        ],
        { type: "audio/webm" }
      );
      const audioURL = URL.createObjectURL(blob);
      // inside the callback function, we cannot directly read a state
      // since the state is always the initial state when the callback is created
      // so we use a ref to store the current speaker id
      if (!!currentSpeakerIdRef.current && userId === currentSpeakerIdRef.current) {
        // if the audio is from the current speaker
        setCurrentSpeakerAudioURL(audioURL);
      } else {
        // if it is shared audio
        setSharedAudioList((prevState) => {
          return { ...prevState, [userId]: audioURL }
        });
      }
    }

    // const onMessageReceived = (payload) => {
    //   var payloadData = JSON.parse(payload.body);
    //   switch (payloadData.messageType) {
    //     case "PLAYERS":
    //       //jiaoyan
    //       setPlayerLists(payloadData.message);
    //       break;
    //     case "GAME":
    //       setGameInfo(payloadData.message);
    //       break;
    //     case "ROOM":
    //       setRoomInfo(payloadData.message);
    //       break;
    //     case "AUIDOSHARE":
    //       //function to deal with audio
    //       break;
    //   }
    // }


    const onError = (err) => {
      console.error("WebSocket Error: ", err);
      alert("WebSocket connection error. Check console for details.");
    };

    connectWebSocket();

    // Cleanup on component unmount
    return () => {
      if (playerInfoSuber) {
        playerInfoSuber.unsubscribe();
      }
      if (gameInfoSuber) {
        gameInfoSuber.unsubscribe();
      }
      if (sharedAudioSuber) {
        sharedAudioSuber.unsubscribe();
      }
      if (stompClientRef.current) {
        stompClientRef.current.disconnect(() => {
          console.log("Disconnected");
        });
      }
    };
  }, []);

  //#region -----------------WebSocket Send Functions-----------------

  //debounce-throttle
  //ready
  const getReady = () => {
    const payload: Timestamped<PlayerAndRoomID> = {
      // TODO: need to make sure the timestamp is UTC format
      // and invariant to the time zone settings
      timestamp: new Date().getTime(),
      message: {
        userID: user.id,
        roomID: roomInfo.roomId,
      },
    };
    stompClientRef.current?.send("/users/ready", {}, JSON.stringify(payload));
  }

  const cancelReady = () => {
    const payload: Timestamped<PlayerAndRoomID> = {
      // TODO: need to make sure the timestamp is UTC format
      // and invariant to the time zone settings
      timestamp: new Date().getTime(),
      message: {
        userID: user.id,
        roomID: roomInfo.roomId,
      },
    };
    stompClientRef.current?.send("/users/unready", {}, JSON.stringify(payload));
  }


  //start game
  const startGame = () => {
    const payload: Timestamped<PlayerAndRoomID> = {
      // TODO: need to make sure the timestamp is UTC format
      // and invariant to the time zone settings
      timestamp: new Date().getTime(),
      message: {
        userID: user.id,
        roomID: roomInfo.roomId,
      },
    };
    stompClientRef.current?.send("/games/start", {}, JSON.stringify(payload));
  }

  //exit room
  const exitRoom = () => {
    const payload: Timestamped<PlayerAndRoomID> = {
      // TODO: need to make sure the timestamp is UTC format
      // and invariant to the time zone settings
      timestamp: new Date().getTime(),
      message: {
        userID: user.id,
        roomID: roomInfo.roomId,
      },
    };
    stompClientRef.current?.send("/games/exitRoom", {}, JSON.stringify(payload));
  }

  //start game
  const submitAnswer = (validateAnswer : String) => {
    const answer = validateAnswer.toLowerCase().replace(/\s/g, "");
    const payload: Timestamped<AnswerGuess> = {
      timestamp: new Date().getTime(),
      message: {
        userID: user.id,
        roomID: roomInfo.roomId,
        guess: answer,
        roundNum: gameInfo.currentRoundNum,
        currentSpeakerID: gameInfo.currentSpeaker.id,
      },
    };
    stompClientRef.current?.send("/games/validate", {}, JSON.stringify(payload));
  }

  //upload audio
  const uploadAudio = () => {
    if (!myRecordingReversedRef.current) {
      console.error("No audio to upload");
      
      return;
    }
    const payload: Timestamped<PlayerAudio> = {
      timestamp: new Date().getTime(),
      message: {
        userID: user.id,
        audioData: myRecordingReversedRef.current,
      },
    };
    stompClientRef.current?.send("/games/audio/upload"/*URL*/, {}, JSON.stringify(payload));
  }
  //#endregion -----------------WebSocket Send Functions-----------------

  const handleAudioReversed = (audioReversed: Base64audio) => {
    if (audioReversed) {
      myRecordingReversedRef.current = audioReversed;
      console.log("Get reversed audio from AudioRecorder Success");
    }
  }

  const togglePopup = () => {
    setShowReadyPopup((prevState) => !prevState);
  };

  const toggleStatus = () => {
    setCurrentStatus((prevState) => {
      switch (prevState) {
      case "speak":
        return "guess";
      case "guess":
        return "reveal";
      case "reveal":
        return "speak";
      default:
        return "speak";
      }
    });
  };

  // const userRecordings = [
  //   { userId: 1, audioURL: null },
  //   { userId: 3, audioURL: null },
  // ];

  const playerReadyStatus = [
    {
      user: {
        id: 1,
        name: "Maxwell",
        avatar: "smiling-face-with-smiling-eyes",
      },
      score: {
        total: 70,
        guess: 50,
        read: 20,
        details: [
          { word: "Lemon", role: 1, score: 20 },
          { word: "Apple", role: 0, score: 30 },
          { word: "Orange", role: 0, score: 20 },
        ],
      },
      ready: true,
      ifGuess: true,
      roundFinished: true,
    },
    {
      user: {
        id: 2,
        name: "Hanky",
        avatar: "grinning-face-with-sweat",
      },
      score: {
        total: 30,
        guess: 30,
        read: 0,
        details: [
          { word: "Lemon", role: 0, score: 10 },
          { word: "Apple", role: 1, score: 0 },
          { word: "Orange", role: 0, score: 20 },
        ],
      },
      ready: true,
      ifGuess: false,
      roundFinished: true,
    },
    {
      user: {
        id: 3,
        name: "Yang",
        avatar: "face-with-monocle",
      },
      score: {
        total: 50,
        guess: 30,
        read: 20,
        details: [
          { word: "Lemon", role: 0, score: 30 },
          { word: "Apple", role: 0, score: 0 },
          { word: "Orange", role: 1, score: 20 },
        ],
      },
      ready: false,
      ifGuess: true,
      roundFinished: false,
    },
    {
      user: {
        id: 4,
        name: "Sophia",
        avatar: "grinning-squinting-face",
      },
      score: {
        total: 60,
        guess: 0,
        read: 60,
        details: [
          { word: "Lemon", role: 0, score: 30 },
          { word: "Apple", role: 0, score: 10 },
          { word: "Orange", role: 0, score: 20 },
        ],
      },
      ready: true,
      ifGuess: true,
      roundFinished: false,
    },
  ];

  let mePlayer = {
    id: 3,
    name: "Hanky",
    avatar: "grinning-face-with-sweat",
  };

  let mockgameInfo = {
    roomID: 5,
    currentSpeaker: {
      id: 2,
      name: "Hanky",
      avatar: "grinning-face-with-sweat",
    },
    currentAnswer: "Success",
    roundStatus: "speak",
    currentRoundNum: 2,
  };
  const changeSpeaker = () => {
    setShowReadyPopup((prevState) => !prevState);
  };

  const Roundstatus = ({ gameInfo, currentSpeakerAudioURL }) => {
    return (
      <>
        <div className="gameroom roundstatus">
          <div className="gameroom counterdiv">
            <i className={"twa twa-stopwatch"} style={{ fontSize: "2.6rem" }} />
            <span className="gameroom counternum">50</span>
          </div>
          <div className="gameroom statusdiv">
            <div className="gameroom speakPlayerContainer">
              {/*<img src={playerInfo.user.avatar} alt={playerInfo.user.name} />*/}
              <span className="gameroom playerAvatar">
                <i
                  className={"twa twa-" + gameInfo.currentSpeaker.avatar}
                  style={{ fontSize: "3.8rem" }}
                />
                <i
                  className={"twa twa-studio-microphone"}
                  style={{ fontSize: "2.2rem" }}
                />
              </span>
              {gameInfo.currentSpeaker.id === mePlayer.id &&
                currentStatus === "speak" && (
                <>
                  <div className={"gameroom secondcolumn"}>
                    <div
                      className="gameroom speakerName"
                      style={{ flexDirection: "row" }}
                    >
                      <span className="gameroom playerName">
                        {"Round " + gameInfo.currentRoundNum + " "}
                      </span>
                      <span className="gameroom playerName">
                        {gameInfo.currentSpeaker.name + ", please"}
                      </span>
                      <span className="gameroom playerName">
                        {" record:"}
                      </span>
                    </div>
                    <span className="gameroom currentAnswer">
                      {gameInfo.currentAnswer}
                    </span>
                  </div>
                </>
              )}
              {gameInfo.currentSpeaker.id !== mePlayer.id &&
                currentStatus === "speak" && (
                <>
                  <div className={"gameroom secondcolumn"}>
                    <div
                      className="gameroom speakerName"
                      style={{ flexDirection: "row" }}
                    >
                      <span className="gameroom playerName">
                        {"Round " + gameInfo.currentRoundNum + " "}
                      </span>
                      <span className="gameroom playerName">
                        {gameInfo.currentSpeaker.name + "'s'"}
                      </span>
                      <span className="gameroom playerName">
                        {"turn to record"}
                      </span>
                    </div>
                    {/*<span className="gameroom currentAnswer">{gameInfo.currentAnswer}</span>*/}
                  </div>
                </>
              )}
              {gameInfo.currentSpeaker.id !== mePlayer.id &&
                currentStatus === "guess" && (
                <>
                  <div className={"gameroom secondcolumn"}>
                    <div
                      className="gameroom speakerName"
                      style={{ flexDirection: "row" }}
                    >
                      <span className="gameroom playerName">
                        {gameInfo.currentSpeaker.name + "'s revesed audio:"}
                      </span>
                    </div>
                    <WavePlayer
                      className="gameroom waveplayer"
                      audioURL={currentSpeakerAudioURL}
                    />
                  </div>
                </>
              )}
              {gameInfo.currentSpeaker.id === mePlayer.id &&
                currentStatus === "guess" && (
                <>
                  <div className={"gameroom secondcolumn"}>
                    <div
                      className="gameroom speakerName"
                      style={{ flexDirection: "row" }}
                    >
                      <span className="gameroom playerName">
                        {"Your revesed audio:"}
                      </span>
                    </div>
                    <WavePlayer
                      className="gameroom waveplayer"
                      audioURL={currentSpeakerAudioURL}
                    />
                  </div>
                </>
              )}
              {currentStatus === "reveal" && (
                <>
                  <div className={"gameroom secondcolumn"}>
                    <div
                      className="gameroom speakerName"
                      style={{ flexDirection: "row" }}
                    >
                      <span className="gameroom playerName">
                        {"The word " +
                          gameInfo.currentSpeaker.name +
                          " recorded is "}
                      </span>
                      <span className="gameroom revealAnswer">
                        {" "}
                        {gameInfo.currentAnswer}
                      </span>
                    </div>
                    <WavePlayer
                      className="gameroom waveplayer"
                      audioURL={currentSpeakerAudioURL}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="gameroom remindermssg">
            {gameInfo.currentSpeaker.id === mePlayer.id &&
              currentStatus === "speak" && (
              <span className="gameroom remindertext">
                {"Try to read and record the word steadily and loudly!"}
              </span>
            )}
            {gameInfo.currentSpeaker.id !== mePlayer.id &&
              currentStatus === "speak" && (
              <span className="gameroom remindertext">
                {
                  "Please wait until the speak player finishes recording and uploading!"
                }
              </span>
            )}
            {gameInfo.currentSpeaker.id !== mePlayer.id &&
              currentStatus === "guess" && (
              <span className="gameroom remindertext">
                {
                  "Try to simulate the reversed audio and reverse again to figure out the word!"
                }
              </span>
            )}
            {gameInfo.currentSpeaker.id === mePlayer.id &&
              currentStatus === "guess" && (
              <span className="gameroom remindertext">
                {
                  "You can try to simulate the reversed audio or listen to others' audio!"
                }
              </span>
            )}
            {currentStatus === "reveal" && (
              <span className="gameroom remindertext">
                {"Time is up and now reveals the answer!"}
              </span>
            )}
            <AudioRecorder
              className="gameroom audiorecorder"
              ffmpeg={ffmpegObj}
              audioName="user1"
              handleReversedAudioChange={handleAudioReversed}
            />
          </div>
        </div>
      </>
    );
  };

  const submitValidateAnswer = () => {
    // TBD
  };

  Roundstatus.propTypes = {
    gameInfo: PropTypes.shape({
      roomID: PropTypes.number.isRequired,
      currentSpeaker: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        avatar: PropTypes.string.isRequired,
      }).isRequired,
      currentAnswer: PropTypes.string.isRequired,
      roundStatus: PropTypes.string.isRequired,
      currentRoundNum: PropTypes.number.isRequired,
    }).isRequired,
    currentSpeakerAudioURL: PropTypes.string,
  };


  const LeaderBoard = ({ playerStatus }) => {
    return (
      <div className="gameroom leaderboarddiv">
        <div className="gameroom leaderboard">
          {playerStatus.map((playerInfo, index) => (
            <div className="gameroom singleScoreContainer" key={index}>
              <span className={"gameroom ranking-" + index}>{index + 1}</span>
              <span className="gameroom ldPlayerAvatar">
                <i
                  className={"twa twa-" + playerInfo.user.avatar}
                  style={{ fontSize: "2.8rem" }}
                />
              </span>
              <span className="gameroom ldPlayerName">
                {playerInfo.user.name}
              </span>
              <span className="gameroom scorenum" style={{ gridColumn: "3" }}>
                {playerInfo.score.total}
              </span>
              <span className="gameroom ldtitle" style={{ gridColumn: "3" }}>
                Total
              </span>
              <span className="gameroom scorenum" style={{ gridColumn: "4" }}>
                {playerInfo.score.guess}
              </span>
              <span className="gameroom ldtitle" style={{ gridColumn: "4" }}>
                Guess
              </span>
              <span className="gameroom scorenum" style={{ gridColumn: "5" }}>
                {playerInfo.score.read}
              </span>
              <span className="gameroom ldtitle" style={{ gridColumn: "5" }}>
                Read
              </span>
              {playerInfo.score.details.map((detail, detailIndex) => (
                <React.Fragment key={detailIndex}>
                  <span
                    className="gameroom scorenum"
                    style={{ gridColumn: `${detailIndex + 6}` }}
                  >
                    {detail.score}
                  </span>

                  <span
                    className="gameroom ldtitle"
                    style={{ gridColumn: `${detailIndex + 6}` }}
                  >
                    {detail.word}
                  </span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PlayerList = ({ playerStatus, sharedAudioList }) => {
    return (
      <>
        <div className="gameroom roominfocontainer">
          <div className="gameroom roominfotitle">ROOM</div>
          <div className="gameroom roominfo">{"#"+roomInfo.roomId+ "-" + roomInfo.theme}</div>
        </div>
        <div className="gameroom playercontainer">
          {/*map begin*/}
          {playerStatus.map((playerInfo, index) => {
            // const hasRecording = sharedAudioList.some(
            //   (recording) => recording.userId === playerInfo.user.id
            // );
            const hasRecording = playerInfo.user.id in sharedAudioList;
            let _audioURL = null;
            if (hasRecording) {
              _audioURL = sharedAudioList[playerInfo.user.id];
            }

            return (
              <div className="gameroom singlePlayerContainer" key={index}>
                <span className="gameroom playerAvatar">
                  <i
                    className={"twa twa-" + playerInfo.user.avatar}
                    style={{ fontSize: "3.8rem" }}
                  />
                </span>
                {!showReadyPopup && (
                  <>
                    <div className="gameroom secondcolumn">
                      <span className="gameroom playerName">
                        {playerInfo.user.name}
                      </span>
                      <span className="gameroom secondRow">
                        <span className="gameroom scoreTitle">Score:</span>
                        <span className="gameroom playerScore">
                          {playerInfo.score.total}
                        </span>
                        {playerInfo.ifGuess ? (
                          <i className="twa twa-speaking-head" />
                        ) : (
                          <i className="twa twa-studio-microphone" />
                        )}
                      </span>
                    </div>
                    <div className="gameroom playerStatus">
                      {playerInfo.roundFinished ? (
                        <i
                          className="twa twa-check-mark-button"
                          style={{ fontSize: "1.5rem" }}
                        />
                      ) : (
                        <i
                          className="twa twa-one-thirty"
                          style={{ fontSize: "1.5rem" }}
                        />
                      )}
                      {hasRecording && <ButtonPlayer audioURL={_audioURL} />}
                    </div>
                  </>
                )}
                {showReadyPopup && (
                  <>
                    <div className="gameroom secondcolumn">
                      <span className="gameroom playerName">
                        {playerInfo.user.name}
                      </span>
                      <span className="gameroom secondRow"></span>
                    </div>
                    <div className="gameroom playerStatus">
                      {playerInfo.ready ? (
                        <i
                          className="twa twa-check-mark-button"
                          style={{ fontSize: "1.5rem" }}
                        />
                      ) : (
                        <i
                          className="twa twa-one-thirty"
                          style={{ fontSize: "1.5rem" }}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  LeaderBoard.propTypes = {
    playerStatus: PropTypes.arrayOf(
      PropTypes.shape({
        user: PropTypes.shape({
          id: PropTypes.number.isRequired,
          name: PropTypes.string.isRequired,
          avatar: PropTypes.string.isRequired,
        }).isRequired,
        score: PropTypes.shape({
          total: PropTypes.number.isRequired,
          guess: PropTypes.number.isRequired,
          read: PropTypes.number.isRequired,
          details: PropTypes.arrayOf(
            PropTypes.shape({
              word: PropTypes.string.isRequired,
              role: PropTypes.number.isRequired,
              score: PropTypes.number.isRequired,
            })
          ).isRequired,
        }).isRequired,
        ready: PropTypes.bool.isRequired,
        ifGuess: PropTypes.bool.isRequired,
      })
    ).isRequired,
  };

  PlayerList.propTypes = {
    playerStatus: PropTypes.arrayOf(
      PropTypes.shape({
        user: PropTypes.shape({
          id: PropTypes.number.isRequired,
          name: PropTypes.string.isRequired,
          avatar: PropTypes.string.isRequired,
        }).isRequired,
        score: PropTypes.shape({
          total: PropTypes.number.isRequired,
          guess: PropTypes.number.isRequired,
          read: PropTypes.number.isRequired,
          details: PropTypes.arrayOf(
            PropTypes.shape({
              word: PropTypes.string.isRequired,
              role: PropTypes.number.isRequired,
              score: PropTypes.number.isRequired,
            })
          ).isRequired,
        }).isRequired,
        ready: PropTypes.bool.isRequired,
        ifGuess: PropTypes.bool.isRequired,
      })
    ).isRequired,
    sharedAudioList: PropTypes.arrayOf(
      PropTypes.shape({
        userId: PropTypes.number.isRequired,
        audioURL: PropTypes.string,
      })
    ).isRequired,
  };

  return (
    <BaseContainer className="gameroom basecontainer">
      <Header left="28vw" />
      <PlayerList
        playerStatus={playerReadyStatus}
        sharedAudioList={sharedAudioList}
      />
      <div className="gameroom right-area">
        {!gameOver && showReadyPopup && (
          <div className="gameroom readypopupbg">
            <div className="gameroom readypopupcontainer">
              <span className="gameroom popuptitle"> Room#05</span>
              <span className="gameroom popuptheme"> Advanced</span>
              <span className="gameroom popuptext">
                {" "}
                Ready to start the game?
              </span>
              <div className="gameroom buttonset">
                <div className="gameroom readybutton" onClick={()=> getReady()}>Confirm</div>
                <div className="gameroom cancelbutton" onClick={()=> cancelReady()}>Cancel</div>
              </div>
            </div>
          </div>
        )}
        {gameOver && (
          <LeaderBoard playerStatus={playerReadyStatus}></LeaderBoard>
        )}
        {!gameOver && !showReadyPopup && <Roundstatus gameInfo={mockgameInfo} currentSpeakerAudioURL={null}/>}
        <div className="gameroom inputarea">
          {!gameOver &&
            !showReadyPopup &&
            gameInfo.currentSpeaker.id !== mePlayer.id &&
            currentStatus === "guess" && (
            <div style={{ display: "flex", flexDirection: "row" }}>
              <input
                value={validateAnswer}
                onChange={(e) => setValidateAnswer(e.target.value)}
                className="gameroom validateForm"
                type="text"
                placeholder="Validate your answer..."
              />
              <button
                className="gameroom validateUpload"
                disabled={!validateAnswer}
                onClick={() => validateAnswer && submitAnswer(validateAnswer)}
              >
                  Submit
              </button>
            </div>
          )}
          <button onClick={togglePopup}> show</button>
          <button onClick={toggleStatus}> status</button>
          <button onClick={() => setGameOver((prevState) => !prevState)}>
            Over
          </button>
        </div>
      </div>
    </BaseContainer>
  );
};

export default Gameroom;
