import { ComponentType, CSSProperties, useMemo } from "react";
import { useGridAnimator } from "./useGridAnimator";

export type GridAnimatorState = "paused" | "active";
export type AgentState =
  | "offline"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking";
export type GridAnimationOptions = {
  interval?: number;
  connectingRing?: number;
  onTransition?: string;
  offTransition?: string;
};

export type AgentVisualizerOptions = {
  baseStyle: CSSProperties;
  gridComponent?: ComponentType<{ style: CSSProperties }>;
  gridSpacing?: string;
  onStyle?: CSSProperties;
  offStyle?: CSSProperties;
  transformer?: (distanceFromCenter: number) => CSSProperties;
  rowCount?: number;
  animationOptions?: GridAnimationOptions;
  maxHeight?: number;
  minHeight?: number;
  radiusFactor?: number;
  radial?: boolean;
  stateOptions?: {
    [key in AgentState]: AgentVisualizerOptions;
  };
};

const normalizeFrequencies = (frequencies: number[]) => {
  const normalizeDb = (value: number) => {
    const minDb = -100;
    const maxDb = -10;
    let db = 1 - (Math.max(minDb, Math.min(maxDb, value)) * -1) / 100;
    db = Math.sqrt(db);

    return db;
  };

  // Normalize all frequency values
  return frequencies.map((value) => {
    if (value === -Infinity) {
      return 0;
    }
    return normalizeDb(value);
  });
};

export type AgentVisualizerProps = {
  style?: "grid" | "bar" | "radial" | "waveform";
  state: AgentState;
  volumeBands: number[];
  options?: AgentVisualizerOptions;
};

export const AgentGridVisualizer = ({
  state,
  volumeBands,
  options,
}: AgentVisualizerProps) => {
  const gridColumns = volumeBands.length;
  const gridRows = options?.rowCount ?? gridColumns;
  const gridArray = Array.from({ length: gridColumns }).map((_, i) => i);
  const gridRowsArray = Array.from({ length: gridRows }).map((_, i) => i);
  const highlightedIndex = useGridAnimator(
    state,
    gridRows,
    gridColumns,
    options?.animationOptions?.interval ?? 100,
    state !== "speaking" ? "active" : "paused",
    options?.animationOptions
  );

  const averageVolume =
    volumeBands.reduce((a, b) => a + b, 0) / volumeBands.length;
  const normalizedVolume = Math.pow(averageVolume, 0.8);
  const rowMidPoint = Math.floor(gridRows / 2.0);
  const volumeChunks = 1 / (rowMidPoint + 1);

  let baseStyle = options?.baseStyle ?? {};
  let onStyle = { ...baseStyle, ...(options?.onStyle ?? {}) };
  let offStyle = { ...baseStyle, ...(options?.offStyle ?? {}) };
  const GridComponent = options?.gridComponent || "div";

  const grid = gridArray.map((x) => {
    return (
      <div
        key={x}
        className="flex flex-col"
        style={{
          gap: options?.gridSpacing ?? "4px",
        }}
      >
        {gridRowsArray.map((y) => {
          const distanceToMid = Math.abs(rowMidPoint - y);
          const threshold =
            distanceToMid * volumeChunks === 0
              ? 0.01
              : distanceToMid * volumeChunks;
          let targetStyle;
          if (state !== "speaking") {
            // Get distance from center
            const distanceFromCenter = Math.sqrt(
              Math.pow(rowMidPoint - x, 2) + Math.pow(rowMidPoint - y, 2)
            );
            const maxDistanceFromCenter = Math.sqrt(
              Math.pow(rowMidPoint - 0, 2) + Math.pow(rowMidPoint - 0, 2)
            );
            const distanceFactor = distanceFromCenter / maxDistanceFromCenter;

            if (normalizedVolume < distanceFactor) {
              targetStyle = {
                transition: `all ${
                  (options?.animationOptions?.interval ?? 100) / 1000
                }s ease-out`,
                ...onStyle,
              };
            } else {
              targetStyle = {
                transition: `all ${
                  (options?.animationOptions?.interval ?? 100) / 100
                }s ease-out`,
                ...offStyle,
              };
            }
          } else {
            // Get distance from center
            const distanceFromCenter = Math.sqrt(
              Math.pow(rowMidPoint - x, 2) + Math.pow(rowMidPoint - y, 2)
            );
            const maxDistanceFromCenter = Math.sqrt(
              Math.pow(rowMidPoint - 0, 2) + Math.pow(rowMidPoint - 0, 2)
            );
            const distanceFactor = distanceFromCenter / maxDistanceFromCenter;
            if (distanceFactor < normalizedVolume) {
              targetStyle = onStyle;
            } else {
              targetStyle = offStyle;
            }
          }

          let distanceFromCenter = Math.sqrt(
            Math.pow(rowMidPoint - x, 2) + Math.pow(rowMidPoint - y, 2)
          );
          return (
            <GridComponent
              style={{
                ...targetStyle,
                ...options?.transformer?.(distanceFromCenter),
              }}
              key={x + "-" + y}
            ></GridComponent>
          );
        })}
      </div>
    );
  });
  return (
    <div
      className="flex h-full items-center justify-center"
      style={{
        gap: options?.gridSpacing ?? "4px",
      }}
    >
      {grid}
    </div>
  );
};
