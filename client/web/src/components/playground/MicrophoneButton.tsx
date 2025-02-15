import { TrackToggle, useLocalParticipant } from "@livekit/components-react";
import { Button } from "../button/Button";
import { Track } from "livekit-client";
import { AgentMultibandAudioVisualizer } from "../visualization/AgentMultibandAudioVisualizer";
import { PlaygroundDeviceSelector } from "./PlaygroundDeviceSelector";
import { useEffect, useState } from "react";
import { MicrophoneOffSVG, MicrophoneOnSVG } from "./icons";

type MicrophoneButtonProps = {
  localMultibandVolume: Float32Array[];
  isSpaceBarEnabled?: boolean;
};
export const MicrophoneButton = ({
  localMultibandVolume,
  isSpaceBarEnabled = false,
}: MicrophoneButtonProps) => {
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(localParticipant.isMicrophoneEnabled);
  const [isSpaceBarPressed, setIsSpaceBarPressed] = useState(false);

  useEffect(() => {
    setIsMuted(localParticipant.isMicrophoneEnabled === false);
  }, [localParticipant.isMicrophoneEnabled]);

  useEffect(() => {
    if (!isSpaceBarEnabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        localParticipant.setMicrophoneEnabled(true);
        setIsSpaceBarPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        localParticipant.setMicrophoneEnabled(false);
        setIsSpaceBarPressed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpaceBarEnabled, localParticipant]);

  return (
    <Button
      state="dropdown"
      size="medium"
      className={`flex items-center justify-center gap-2 bg-white rounded-sm ${
        isSpaceBarPressed
          ? "scale-90 border-groq-action-text border"
          : "scale-100"
      }`}
      onClick={() => {}}
    >
      <TrackToggle
        source={Track.Source.Microphone}
        className={
          "flex items-center justify-center gap-2 h-full " +
          (isMuted ? "opacity-50" : "")
        }
        showIcon={false}
      >
        {isMuted ? <MicrophoneOffSVG /> : <MicrophoneOnSVG />}
        <AgentMultibandAudioVisualizer
          state="speaking"
          barWidth={2}
          minBarHeight={2}
          maxBarHeight={16}
          accentColor={"gray"}
          accentShade={950}
          frequencies={localMultibandVolume}
          borderRadius={5}
          gap={2}
        />
        <PlaygroundDeviceSelector kind="audioinput" />
      </TrackToggle>
    </Button>
  );
};
