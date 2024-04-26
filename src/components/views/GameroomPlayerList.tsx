import React from "react";
import { ButtonPlayer } from "components/ui/ButtonPlayer";

type PlayerListProps = {
    playerStatus: {
        user: {
            id: string;
            name: string;
            avatar: string;
        };
        score: {
            total: number;
        };
        ifGuess: boolean;
        roundFinished: boolean;
        ready: boolean;
    }[];
    sharedAudioList: {
        [userId: string]: string;
    };
    gameTheme: string;
    currentRoomName: string;
    showReadyPopup: boolean;
    gameOver: boolean;
    globalVolume: number;
}

export const PlayerList = (props:PlayerListProps) => {
  const { playerStatus, sharedAudioList, gameTheme, currentRoomName, showReadyPopup, gameOver, globalVolume } = props;

  return (
    <div className="gameroom left-area">
      <div className="gameroom roominfocontainer">
        <div className="gameroom roominfotitle">ROOM</div>
        <div className="gameroom roominfo">
          {"#" + currentRoomName + "-" + gameTheme}
        </div>
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
              {!showReadyPopup && !gameOver && (
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
                    {hasRecording && <ButtonPlayer audioURL={_audioURL} volume={globalVolume}/>}
                  </div>
                </>
              )}
              {gameOver && (
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
                    </span>
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
    </div>
  );
};