/**
 * this component is a button that will play an audio file when clicked
 */
import React, { useState, useRef, useEffect } from "react";
import { Button } from "./Button";
import { FaPause, FaPlay } from "react-icons/fa";
import "../../styles/ui/ButtonPlayer.scss";

type ButtonPlayerProps = {
  audioURL: string;
  className?: string;
  volume: number;
};

export const ButtonPlayer = (props: ButtonPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const playAudio = () => {
    if (isPlaying) {
      audioRef.current.pause().catch((e) => console.error(e));
      setIsPlaying((prev) => !prev);
    } else {
      // play form start
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(()  => {
          setIsPlaying((prev) => !prev);
        }
        )
        .catch((e) => console.error(e));
    }
  };

  // useEffect to add event listener to audio element
  useEffect(() => {
    // check if the audio file is available
    // if the audio file is available add event listener
    const audio = audioRef.current;
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
    });
    audio.volume = props.volume;
    console.log(`[ButtonPlayer-${props.className}]`, "audio volume set to", props.volume);

    return () => {
      audio.removeEventListener("ended", () => {
        setIsPlaying(false);
      });
    };
  }, [props.volume]);

  return (
    <div className={`btn-player ${props.className}`}>
      <Button onClick={playAudio}
        className="play-btn">
        <audio ref={audioRef} src={props.audioURL} />
        {!isPlaying ? <FaPlay /> : <FaPause />}
      </Button>
    </div>
  );
};
