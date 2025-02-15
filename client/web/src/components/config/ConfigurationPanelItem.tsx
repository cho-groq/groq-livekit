import { ReactNode } from "react";
import { PlaygroundDeviceSelector } from "@/components/playground/PlaygroundDeviceSelector";
import { TrackToggle } from "@livekit/components-react";
import { Track } from "livekit-client";

type ConfigurationPanelItemProps = {
  title: string;
  children?: ReactNode;
  deviceSelectorKind?: MediaDeviceKind;
};

export const ConfigurationPanelItem: React.FC<ConfigurationPanelItemProps> = ({
  children,
  title,
  deviceSelectorKind,
}) => {
  return (
    <div className="w-full text-black py-4 relative">
      <div className="sticky bg-white py-2 top-0 flex flex-row justify-between items-center px-4 text-xs uppercase tracking-wider">
        <h3 className="font-mono font-semibold text-sm">{title}</h3>
        {deviceSelectorKind && (
          <span className="flex flex-row gap-2">
            <TrackToggle
              className="px-2 py-1 text-black border-2 border-black rounded-sm"
              source={
                deviceSelectorKind === "audioinput"
                  ? Track.Source.Microphone
                  : Track.Source.Camera
              }
            />
            <PlaygroundDeviceSelector kind={deviceSelectorKind} />
          </span>
        )}
      </div>
      <div className="px-4 py-2 text-xs text-black leading-normal">
        {children}
      </div>
    </div>
  );
};
