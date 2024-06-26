import { Base64audio } from "types";

export { Base64audio } from "types";

export type Timestamped<T> = {
    timestamp: number;
    message: T;
}

export type PlayerAudio = {
    userID: string;
    roomID: string;
    audioData: Base64audio;
}

export type PlayerAndRoomID = {
    userID: string;
    roomID: string;
}

export type AnswerGuess = {
    userID: string;
    roomID: string;
    guess: string;
    roundNum: number;
    currentSpeakerID: string;
}

export type RoomInfo = {
    roomMaxNum: number;
    roomOwnerId: string;
    theme: string;
    roomPlayersList: RoomPlayer[];
    roomId: string;
    roomName: string;
    status: string;
}

export type RoomPlayer = {
    avatar: string;
    userName: string;
    userId: string;
}

export type StompResponse = {
    success: boolean;
    message: string; // error message
}