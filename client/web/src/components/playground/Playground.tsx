"use client";

import { LoadingSVG } from "@/components/button/LoadingSVG";
import { PlaygroundHeader } from "@/components/playground/PlaygroundHeader";
import { PlaygroundTile } from "@/components/playground/PlaygroundTile";
import { GroqAudioVisualizer } from "../visualization/GroqAudioVisualizer";
import { useMultibandTrackVolume } from "@/hooks/useTrackVolume";
import {
  useConnectionState,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ConnectionState,
  LocalParticipant,
  RoomEvent,
  Track,
} from "livekit-client";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "../button/Button";
import { MicrophoneButton } from "./MicrophoneButton";
import { useWindowResize } from "@/hooks/useWindowResize";
import { APIKeyInput } from "./APIKeyInput";

export interface PlaygroundMeta {
  name: string;
  value: string;
}

export interface PlaygroundProps {
  onConnect: (connect: boolean, opts?: { token: string; url: string }) => void;
}

export interface Voice {
  id: string;
  user_id: string | null;
  is_public: boolean;
  name: string;
  description: string;
  created_at: Date;
  embedding: number[];
}

const headerHeight = 56;
const mobileWindowWidth = 768;
const desktopBarWidth = 72;
const desktopMaxBarHeight = 280;
const desktopMinBarHeight = 60;
const mobileMaxBarHeight = 140;
const mobileMinBarHeight = 48;
const mobileBarWidth = 48;
const barCount = 50;
const defaultVolumes = Array.from({ length: barCount }, () => [0.0]);

// API endpoint for setting the API key
const API_KEY_ENDPOINT = "https://groq-livekit-backend-417990686885.us-west1.run.app:5001/api/set-api-key";

export default function Playground({ onConnect }: PlaygroundProps) {
  const { localParticipant } = useLocalParticipant();
  const windowSize = useWindowResize();
  const participants = useRemoteParticipants({
    updateOnlyOn: [RoomEvent.ParticipantMetadataChanged],
  });
  const [isMobile, setIsMobile] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyLoading, setIsApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  
  const agentParticipant = participants.find((p) => p.isAgent);

  const roomState = useConnectionState();
  const tracks = useTracks();

  useEffect(() => {
    setIsMobile(windowSize.width < mobileWindowWidth);
  }, [windowSize]);

  useEffect(() => {
    if (roomState === ConnectionState.Connected) {
      localParticipant.setMicrophoneEnabled(true);
    }
  }, [localParticipant, roomState]);
  
 // Add error handling for network issues
 const handleApiKeySubmit = async (key: string) => {
  setIsApiKeyLoading(true);
  setApiKeyError(null);
  
  console.log("Attempting to send API key to:", API_KEY_ENDPOINT);
  
  try {
    // Check if the server is running first
    const pingResponse = await fetch("https://groq-livekit-backend-417990686885.us-west1.run.app:5001/ping", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(err => {
      console.error("Ping error:", err);
      throw new Error("Cannot connect to server. Is the Flask server running?");
    });
    
    if (!pingResponse.ok) {
      throw new Error("Server is running but not responding correctly");
    }
    
    console.log("Server ping successful, sending API key");
    
    // Send the API key to the backend with improved error handling
    const response = await fetch(API_KEY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey: key }),
    });
    
    console.log("API key submission response:", response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to set API key');
    }
    
    console.log("API key set successfully");
    // If successful, store the API key in state
    setApiKey(key);
  } catch (error) {
    console.error("Error setting API key:", error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      setApiKeyError('Connection refused. Make sure the Flask server is running at ' + API_KEY_ENDPOINT);
    } else {
      setApiKeyError(error instanceof Error ? error.message : 'Failed to set API key');
    }
    setApiKey(null);
  } finally {
    setIsApiKeyLoading(false);
  }
};

  const agentAudioTrack = tracks.find(
    (trackRef) =>
      trackRef.publication.kind === Track.Kind.Audio &&
      trackRef.participant.isAgent
  );

  const subscribedVolumes = useMultibandTrackVolume(
    agentAudioTrack?.publication.track,
    barCount
  );

  const localTracks = tracks.filter(
    ({ participant }) => participant instanceof LocalParticipant
  );

  const localMicTrack = localTracks.find(
    ({ source }) => source === Track.Source.Microphone
  );

  const localMultibandVolume = useMultibandTrackVolume(
    localMicTrack?.publication.track,
    9
  );

  const audioTileContent = useMemo(() => {
    const conversationToolbar = (
      <div
        className="fixed z-50 md:absolute left-1/2 bottom-4 md:bottom-auto md:top-1/2 -translate-y-1/2 -translate-x-1/2"
        style={{
          filter: "drop-shadow(0 8px 10px rgba(0, 0, 0, 0.1))",
        }}
      >
        <motion.div
          className="flex gap-3"
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 25,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          <MicrophoneButton
            localMultibandVolume={localMultibandVolume}
            isSpaceBarEnabled={true}
          />
          <Button
            state="destructive"
            className="flex items-center justify-center px-3 rounded-[4px]"
            size="medium"
            onClick={() => {
              onConnect(roomState === ConnectionState.Disconnected);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M3.33325 3.3335L12.6666 12.6668M12.6666 3.3335L3.33325 12.6668"
                stroke="#FF887A"
                strokeWidth="2"
                strokeLinecap="square"
              />
            </svg>
          </Button>
        </motion.div>
      </div>
    );

    const isLoading =
      roomState === ConnectionState.Connecting ||
      (!agentAudioTrack && roomState === ConnectionState.Connected);

    const apiKeyInputSection = (
      <div className="fixed bottom-2 md:bottom-auto md:absolute left-1/2 md:top-1/2 -translate-y-1/2 -translate-x-1/2 w-11/12 md:w-96 text-center">
        <motion.div
          className="flex flex-col gap-3"
          initial={{
            opacity: 0,
            y: 50,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 50,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          <div className="text-center text-base text-gray-700 mb-2">
            Please enter your Groq API key to continue
          </div>
          <APIKeyInput onApiKeySubmit={handleApiKeySubmit} isLoading={isApiKeyLoading} />
          {apiKeyError && (
            <div className="text-red-500 text-sm mt-1">{apiKeyError}</div>
          )}
        </motion.div>
      </div>
    );

    const startConversationButton = (
      <div className="fixed bottom-2 md:bottom-auto md:absolute left-1/2 md:top-1/2 -translate-y-1/2 -translate-x-1/2 w-11/12 md:w-auto text-center">
        <motion.div
          className="flex gap-3"
          initial={{
            opacity: 0,
            y: 50,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 50,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          <Button
            state="primary"
            size="large"
            className={`relative w-full text-base text-black ${
              isLoading ? "pointer-events-none" : ""
            }`}
            onClick={() => {
              onConnect(roomState === ConnectionState.Disconnected);
            }}
          >
            <div
              className={`w-full ${isLoading ? "opacity-0" : "opacity-100"}`}
            >
              Start a conversation
            </div>
            <div
              className={`absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 ${
                isLoading ? "opacity-100" : "opacity-0"
              }`}
            >
              <LoadingSVG diameter={24} strokeWidth={4} />
            </div>
          </Button>
        </motion.div>
      </div>
    );

    const visualizerContent = (
      <div className="flex flex-col items-center justify-space-between h-full w-full pb-12">
        <div className="h-full flex items-center">
          <GroqAudioVisualizer
            state={
              roomState === ConnectionState.Disconnected
                ? "offline"
                : agentAudioTrack
                ? "speaking"
                : "idle"
            }
            barWidth={isMobile ? mobileBarWidth : desktopBarWidth}
            minBarHeight={isMobile ? mobileMinBarHeight : desktopMinBarHeight}
            maxBarHeight={isMobile ? mobileMaxBarHeight : desktopMaxBarHeight}
            accentColor={!agentAudioTrack ? "gray" : "cartesia"}
            accentShade={!agentAudioTrack ? 200 : 500}
            frequencies={!agentAudioTrack ? defaultVolumes : subscribedVolumes}
            borderRadius={4}
            gap={16}
          />
        </div>
        <div className="min-h-20 w-full relative">
          <AnimatePresence>
            {roomState === ConnectionState.Disconnected && !apiKey && !agentAudioTrack ? apiKeyInputSection : null}
            {roomState === ConnectionState.Disconnected && apiKey && !agentAudioTrack ? startConversationButton : null}
          </AnimatePresence>
          <AnimatePresence>
            {agentAudioTrack ? conversationToolbar : null}
          </AnimatePresence>
        </div>
      </div>
    );

    return visualizerContent;
  }, [
    localMultibandVolume,
    roomState,
    agentAudioTrack,
    isMobile,
    subscribedVolumes,
    onConnect,
    apiKey,
    isApiKeyLoading,
    apiKeyError
  ]);

  return (
    <>
      <PlaygroundHeader height={headerHeight} />
      <div
        className="flex grow w-full"
        style={{ height: `calc(100% - ${headerHeight}px)` }}
      >
        <div className="flex-col grow basis-1/2 gap-4 h-full md:flex">
          <PlaygroundTile
            title="ASSISTANT"
            className="w-full h-full grow"
            childrenClassName="justify-center"
          >
            {audioTileContent}
          </PlaygroundTile>
        </div>
      </div>
    </>
  );
}