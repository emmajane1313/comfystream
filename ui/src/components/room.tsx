"use client";

import { PeerConnector } from "@/components/peer";
import { StreamConfig, StreamSettings } from "@/components/settings";
import { Webcam } from "@/components/webcam";
import { usePeerContext } from "@/context/peer-context";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Slider from "./slider";

interface MediaStreamPlayerProps {
  stream: MediaStream;
  endpoint: string | null;
}

function MediaStreamPlayer({ stream, endpoint }: MediaStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full flex flex-col gap-3">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full flex relative"
      />
      <Slider endpoint={endpoint} />
    </div>
  );
}

interface StageProps {
  connected: boolean;
  onStreamReady: () => void;
  endpoint: string | null;
}

function Stage({ connected, onStreamReady, endpoint }: StageProps) {
  const { remoteStream } = usePeerContext();

  useEffect(() => {
    if (!connected || !remoteStream) return;

    onStreamReady();
  }, [connected]);

  if (!connected || !remoteStream) {
    return (
      <video
        className="w-full relative flex h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/loading.mp4" type="video/mp4" />
      </video>
    );
  }

  return <MediaStreamPlayer endpoint={endpoint} stream={remoteStream} />;
}

export function Room() {
  const [connect, setConnect] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isStreamSettingsOpen, setIsStreamSettingsOpen] =
    useState<boolean>(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [loadingToastId, setLoadingToastId] = useState<
    string | number | undefined
  >(undefined);

  const [config, setConfig] = useState<StreamConfig>({
    streamUrl: "",
    frameRate: 0,
    selectedDeviceId: "",
    prompt: null,
  });

  const connectingRef = useRef(false);

  const onStreamReady = useCallback((stream: MediaStream) => {
    setLocalStream(stream);
  }, []);

  const onRemoteStreamReady = useCallback(() => {
    toast.success("Started stream!", { id: loadingToastId });
    setLoadingToastId(undefined);
  }, [loadingToastId]);

  const onStreamConfigSave = useCallback((config: StreamConfig) => {
    setConfig(config);
  }, []);

  useEffect(() => {
    if (connectingRef.current) return;

    if (!config.streamUrl) {
      setConnect(false);
    } else {
      setConnect(true);

      const id = toast.loading("Starting stream...");
      setLoadingToastId(id);

      connectingRef.current = true;
    }
  }, [config.streamUrl]);

  const handleConnected = useCallback(() => {
    setIsConnected(true);

    console.debug("Connected!");

    connectingRef.current = false;
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);

    console.debug("Disconnected!");
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden overscroll-none">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
      <div className="fixed inset-0 z-[-1] bg-cover bg-[black]">
        <PeerConnector
          url={config.streamUrl}
          prompt={config.prompt}
          connect={connect}
          onConnected={handleConnected}
          onDisconnected={handleDisconnected}
          localStream={localStream}
        >
          <div className="min-h-[100dvh] flex flex-col items-center justify-center">
            <div className="w-full max-h-[100dvh] flex flex-col lg:flex-row landscape:flex-row justify-center items-center lg:space-x-4">
              <div className="landscape:w-full lg:w-1/2 h-[50dvh] lg:h-auto landscape:h-full max-w-[512px] max-h-[512px] aspect-square bg-[black] flex justify-center items-center lg:border-2 lg:rounded-md">
                <Stage
                  connected={isConnected}
                  onStreamReady={onRemoteStreamReady}
                  endpoint={config.streamUrl}
                />
              </div>
              <div className="landscape:w-full lg:w-1/2 h-[50dvh] lg:h-auto landscape:h-full max-w-[512px] max-h-[512px] aspect-square flex justify-center items-center lg:border-2 lg:rounded-md">
                <Webcam
                  onStreamReady={onStreamReady}
                  deviceId={config.selectedDeviceId}
                  frameRate={config.frameRate}
                />
              </div>
            </div>

            <StreamSettings
              open={isStreamSettingsOpen}
              onOpenChange={setIsStreamSettingsOpen}
              onSave={onStreamConfigSave}
            />
          </div>
        </PeerConnector>
      </div>
    </main>
  );
}
