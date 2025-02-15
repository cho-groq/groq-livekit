import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { AgentGridVisualizer } from "./AgentGridVisualizer";

type VisualizerState =
  | "offline"
  | "listening"
  | "idle"
  | "speaking"
  | "thinking";

type GroqAudioVisualizerProps = {
  state: VisualizerState;
  barWidth: number;
  minBarHeight: number;
  maxBarHeight: number;
  accentColor: string;
  accentShade?: number;
  frequencies: Float32Array[] | number[][];
  borderRadius: number;
  gap: number;
};

export const GroqAudioVisualizer = ({
  state,
  frequencies,
}: GroqAudioVisualizerProps) => {
  const [isTabletOrSmaller, setIsTabletOrSmaller] = useState(false);
  const summedFrequencies = frequencies.map((bandFrequencies) => {
    const sum = (bandFrequencies as number[]).reduce((a, b) => a + b, 0);
    return Math.sqrt(sum / bandFrequencies.length);
  });

  const [thinkingIndex, setThinkingIndex] = useState(
    Math.floor(summedFrequencies.length / 2)
  );
  const [thinkingDirection, setThinkingDirection] = useState<"left" | "right">(
    "right"
  );

  useEffect(() => {
    const handleResize = () => {
      setIsTabletOrSmaller(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (state !== "thinking") {
      setThinkingIndex(Math.floor(summedFrequencies.length / 2));
      return;
    }
    const timeout = setTimeout(() => {
      if (thinkingDirection === "right") {
        if (thinkingIndex === summedFrequencies.length - 1) {
          setThinkingDirection("left");
          setThinkingIndex((prev) => prev - 1);
        } else {
          setThinkingIndex((prev) => prev + 1);
        }
      } else {
        if (thinkingIndex === 0) {
          setThinkingDirection("right");
          setThinkingIndex((prev) => prev + 1);
        } else {
          setThinkingIndex((prev) => prev - 1);
        }
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [state, summedFrequencies.length, thinkingDirection, thinkingIndex]);

  return (
    <div className="relative">
      <div className="relative z-50">
        <CircleChart
          state={state}
          values={[90, 110, 120, 90]}
          frequencies={summedFrequencies.slice(0, 4)}
          radiusBase={isTabletOrSmaller ? 110 : 200}
        />
      </div>
      <motion.div
        initial={{
          opacity: 0,
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          opacity: 1,
        }}
        transition={{
          duration: 2,
        }}
      >
        <div className="relative overflow-hidden w-[320px] h-[320px] lg:w-[480px] lg:h-[480px]">
          <div
            className="absolute top-0 left-0 w-full h-full z-10"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(245, 80, 54, 1.0) 2%, rgba(245, 80, 54, 0.9) 40%, rgba(245, 80, 54, 0.0) 60%, rgba(245, 80, 54, 1) 100%)",
            }}
          />
          <AgentGridVisualizer
            key="visualizer"
            state={"speaking"}
            volumeBands={summedFrequencies}
            options={{
              animationOptions: { interval: 75, connectingRing: 3 },
              baseStyle: {
                width: "5px",
                height: "5px",
                borderRadius: "10px",
              },
              offStyle: {
                backgroundColor: "rgba(0, 0, 0, 0.15)",
                transform: "scale(1)",
              },
              onStyle: {
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                transform: "scale(1.1)",
              },
              gridSpacing: "12px",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

const CircleChart = ({
  state,
  values,
  frequencies,
  radiusBase,
}: {
  state: VisualizerState;
  values: number[];
  frequencies: number[];
  radiusBase: number;
}) => {
  const [isActive, setIsActive] = useState(false);
  const [gap, setGap] = useState(15);
  const strokeWidth = 15;
  let averageVolume =
    frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
  if (isNaN(averageVolume)) {
    averageVolume = 0;
  }
  const normalizedVolume = Math.pow(averageVolume, 0.3);
  const numCircles = values.length;
  const size =
    radiusBase * 2 + strokeWidth + (numCircles - 1) * (gap + strokeWidth * 2);

  useEffect(() => {
    if (state !== "offline") {
      setIsActive(true);
      setGap(20);
    } else {
      setIsActive(false);
      setGap(15);
    }
  }, [state, normalizedVolume]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      overflow="visible"
      className="hovering-element"
    >
      <g filter="url(#filter0_di_61_4534)">
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.1}
          fill="white"
          initial={{
            opacity: 0,
          }}
          animate={{
            r: isActive ? radiusBase * 0.75 : size * 0.2, // Animate between two sizes
            opacity: 1,
          }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 13,
          }}
          transform={`scale(${0.7 + 0.3 * averageVolume})`}
          style={{
            transformOrigin: "50% 50%",
          }}
        />
      </g>
      <defs>
        <filter
          id="filter0_di_61_4534"
          x="0"
          y="0"
          width={size}
          height={size}
          scale={0.9 + 0.2 * averageVolume}
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="21" />
          <feGaussianBlur stdDeviation="17" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.17 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_61_4534"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_61_4534"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={-4 + -8 * averageVolume} />
          <feGaussianBlur stdDeviation={7 + 5 * averageVolume} />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.933333 0 0 0 0 0.168627 0 0 0 0 0.0470588 0 0 0 0.66 0"
          />
          <feBlend
            mode="normal"
            in2="shape"
            result="effect2_innerShadow_61_4534"
          />
        </filter>
      </defs>
    </svg>
  );
};
