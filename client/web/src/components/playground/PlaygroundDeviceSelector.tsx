import { useMediaDeviceSelect } from "@livekit/components-react";
import { useEffect, useState } from "react";

type PlaygroundDeviceSelectorProps = {
  kind: MediaDeviceKind;
};

export const PlaygroundDeviceSelector = ({
  kind,
}: PlaygroundDeviceSelectorProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const deviceSelect = useMediaDeviceSelect({ kind: kind });
  const [selectedDeviceName, setSelectedDeviceName] = useState("");

  useEffect(() => {
    deviceSelect.devices.forEach((device) => {
      if (device.deviceId === deviceSelect.activeDeviceId) {
        setSelectedDeviceName(device.label);
      }
    });
  }, [deviceSelect.activeDeviceId, deviceSelect.devices, selectedDeviceName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        setShowMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showMenu]);

  const activeClassName = showMenu ? "rotate-180" : "rotate-0";

  return (
    <div className="relative">
      <button
        className={`flex hover:opacity-50 ${activeClassName} transition-all duration-100`}
        onClick={(e) => {
          setShowMenu(!showMenu);
          e.stopPropagation();
        }}
      >
        <ChevronSVG />
      </button>
      <div
        className="absolute left-0 bottom-12 text-[#424049] text-left border-[rgb(234,234,235)] border-[1px] box-border rounded-[5px] z-10 w-[280px]"
        style={{
          display: showMenu ? "block" : "none",
        }}
      >
        {deviceSelect.devices.map((device, index) => {
          const isFirst = index === 0;
          const isLast = index === deviceSelect.devices.length - 1;

          let roundedStyles = "";
          if (isFirst) {
            roundedStyles = " rounded-t-[5px]";
          } else if (isLast) {
            roundedStyles = " rounded-b-[5px]";
          }

          return (
            <div
              onClick={(e) => {
                e.stopPropagation();
                deviceSelect.setActiveMediaDevice(device.deviceId);
                setShowMenu(false);
              }}
              className={`${
                device.deviceId === deviceSelect.activeDeviceId
                  ? "text-groq-action-text"
                  : "text-groq-control-text"
              } bg-white text-xs py-2 px-2 cursor-pointer hover:bg-[#eaeaeb]${roundedStyles}`}
              key={index}
            >
              {device.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ChevronSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
  >
    <path
      d="M13.3334 6L8.00003 11.3333L2.66669 6"
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
);
