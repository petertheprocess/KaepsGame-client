import React, {useEffect, useState, useRef, useImperativeHandle } from "react";
import WaveSurfer from "wavesurfer.js";
import propTypes from "prop-types";
import { Button } from "./Button";
import "styles/ui/WavePlayer.scss";
const BACKRATE_0_5 = 0.5;
const BACKRATE_0_75 = 0.75;
const BACKRATE_1 = 1;

export const WavePlayer = React.forwardRef((props,ref) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const playbackRateActiveColor = "coral";
  const playbackRateInactiveColor = "grey";

  const initializeWaveSurfer = () => {
    if (wavesurfer.current) {
      console.log(`[${props.className}]`,"WaveSurfer already initialized");
      
      return;
    }

    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "grey",
        cursorWidth: 3,
        progressColor: "rgba(255, 204, 77, 1)",
        height: "auto", 
        barWidth: 5,
        barRadius: 3,
        normalize: true,
      });
    }

    wavesurfer.current?.on("click", ()=>{
      const duration = wavesurfer.current?.getDuration();
      if(duration===0){
        return;
      }
      // play from start
      wavesurfer.current?.seekTo(0);
      wavesurfer.current?.playPause();
      // setIsPlaying(prev => !prev);
    }
    );
  };

  useEffect(() => {
    initializeWaveSurfer();
  }, []);

  // every time the audioBlob changes, load the new audio
  useEffect(() => {
    if (props.audioURL) {
      try {
        wavesurfer.current?.load(props.audioURL);
      } catch (error) {
        console.error(`[${props.className}]`,"WaveSurfer failed to load audioBlob", error);
      }
    }
    console.log(`[${props.className}]`,"WaveSurfer loaded audioBlob");
  }
  , [props.audioURL]);

  useImperativeHandle(ref, () => ({
    setVolume: (volume:number) => {
      wavesurfer.current?.setVolume(volume);
      console.log(`[${props.className}]`,"WaveSurfer set volume to", volume);
    }
  }), []);

  return (
    <div className={`wave-player ${props.className}`}>
      <div className="waveform" ref={waveformRef}/>
      <div className="no-audio-placeholder" style={{display: props.audioURL ? "none":"block"}}>
        ........No Audio Uploaded......
      </div>
      <div className="btn-group"
        style={{display: props.audioURL ? "flex":"none"}}>
        <Button
          className={"x0.5"}
          onClick={() => {
            setPlaybackRate(BACKRATE_0_5);
            wavesurfer.current?.setPlaybackRate(BACKRATE_0_5);
          }}
          style={
            {
              color: (playbackRate===BACKRATE_0_5)? playbackRateActiveColor : playbackRateInactiveColor
            }
          }
        >
          x0.5
        </Button>
        <Button
          className={"x0.75"}
          onClick={() => {
            setPlaybackRate(BACKRATE_0_75);
            wavesurfer.current?.setPlaybackRate(BACKRATE_0_75);
          }}
          style={
            {
              color: (playbackRate===BACKRATE_0_75)? playbackRateActiveColor : playbackRateInactiveColor
            }
          }
        >
          x0.75
        </Button>
        <Button
          className={"x1"}
          onClick={() => {
            setPlaybackRate(BACKRATE_1);
            wavesurfer.current?.setPlaybackRate(BACKRATE_1);
          }}
          style={
            {
              color: (playbackRate===1)? playbackRateActiveColor : playbackRateInactiveColor
            }
          }
        >
          x1
        </Button>
      </div>
    </div>
  );

});

WavePlayer.displayName = "WavePlayer";

WavePlayer.propTypes = {
  className: propTypes.string,
  audioURL: propTypes.string,
}

export default WavePlayer;


