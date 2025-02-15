"use client";

import { useCallback, useMemo } from "react";
import { useConnection } from "@/hooks/useConnection";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";

import { ConnectionMode } from "@/hooks/useConnection";

import { Room, RoomEvent, Track, LocalAudioTrack } from "livekit-client";

import Playground from "@/components/playground/Playground";

export function RoomComponent() {
  const { shouldConnect, wsUrl, token, mode, connect, disconnect } =
    useConnection();

  const handleConnect = useCallback(
    async (c: boolean, mode: ConnectionMode) => {
      c ? connect(mode) : disconnect();
    },
    [connect, disconnect]
  );

  const room = useMemo(() => {
    const r = new Room();
    r.on(RoomEvent.LocalTrackPublished, async (trackPublication) => {
      if (
        trackPublication.source === Track.Source.Microphone &&
        trackPublication.track instanceof LocalAudioTrack
      ) {
        const { KrispNoiseFilter, isKrispNoiseFilterSupported } = await import(
          "@livekit/krisp-noise-filter"
        );
        if (!isKrispNoiseFilterSupported()) {
          console.error(
            "Enhanced noise filter is not supported for this browser"
          );
          return;
        }
        try {
          await trackPublication.track
            // @ts-ignore
            ?.setProcessor(KrispNoiseFilter());
        } catch (e) {
          console.warn("Background noise reduction could not be enabled");
        }
      }
    });
    return r;
  }, [wsUrl]);

  return (
    <LiveKitRoom
      className="flex flex-col h-full w-full"
      serverUrl={wsUrl}
      token={token}
      room={room}
      connect={shouldConnect}
      onError={(e) => {
        //setToastMessage({ message: e.message, type: "error" });
        console.error(e);
      }}
    >
      <Playground
        onConnect={(c) => {
          const m = process.env.NEXT_PUBLIC_LIVEKIT_URL ? "env" : mode;
          handleConnect(c, m);
        }}
      />
      <RoomAudioRenderer />
      <StartAudio label="Click to enable audio playback" />
    </LiveKitRoom>
  );
}
