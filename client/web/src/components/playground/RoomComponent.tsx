"use client";

import { useCallback, useMemo, useState } from "react";
import { useConnection } from "@/hooks/useConnection";
import { ImageUploadComponent } from '../ImageUploadComponent';

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
  
  // State to control whether image upload UI is visible
  const [showImageUpload, setShowImageUpload] = useState<boolean>(false);

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

  // Toggle image upload UI visibility
  const toggleImageUpload = () => {
    setShowImageUpload(prev => !prev);
  };

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
      
      {/* Image upload button */}
      <div className="fixed bottom-4 right-4 z-10">
        <button 
          onClick={toggleImageUpload}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg"
          aria-label="Upload Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      
      {/* Image upload modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 m-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload Image</h2>
              <button 
                onClick={toggleImageUpload}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ImageUploadComponent />
          </div>
        </div>
      )}
      
      <RoomAudioRenderer />
      <StartAudio label="Click to enable audio playback" />
    </LiveKitRoom>
  );
}