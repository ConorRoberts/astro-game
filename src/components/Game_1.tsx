import { FC, useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

type Screen = "game" | "menu";
type Position = { x: number; y: number };
type TargetData = {
  id: string;
  position: Position;
};
const TARGET_SIZE = 50;

/**
 * Get a random number between 0 and n
 */
const rand = (n: number) => Math.floor(Math.random() * n);

// Math.floor(Math.random()*width) - Generate random number between 0 and width
// Max - Make sure target center position is at least 1/2 target size from x=0/y=0
// Min - Make sure target center position is at least 1/2 target size from x=WIDTH_MAX/y=HEIGHT_MAX
const getRandomTargetPosition = (max: number) => {
  return Math.min(Math.max(rand(max), TARGET_SIZE / 2), max - TARGET_SIZE / 2);
};

export const Game = () => {
  const [hits, setHits] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [screen, setScreen] = useState<Screen>("menu");
  const [targets, setTargets] = useState<TargetData[]>([]);
  const gameContainer = useRef<HTMLDivElement>(null);

  const handleCreateTarget = useCallback(() => {
    if (gameContainer.current) {
      const gameContainerWidth = gameContainer.current.clientWidth;
      const gameContainerHeight = gameContainer.current.clientHeight;

      const newTarget: TargetData = {
        id: uuid(),
        position: {
          x: getRandomTargetPosition(gameContainerWidth),
          y: getRandomTargetPosition(gameContainerHeight),
        },
      };

      setTargets((prev) => [...prev, newTarget]);
    }
  }, []);

  const handleTargetRemove = (id: string) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
  };

  // Target creating interval
  useEffect(() => {
    if (screen === "menu") {
      return;
    }

    const interval = setInterval(() => {
      handleCreateTarget();
    }, 1500);

    return () => {
      clearInterval(interval);
    };
  }, [screen, handleCreateTarget]);

  useEffect(() => {
    if (screen === "menu") {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 5);

    return () => {
      clearInterval(interval);
    };
  }, [startTime, screen]);

  return (
    <div className="bg-gray-900 flex h-screen flex-col items-center">
      <div className="mt-16 border w-96 rounded-xl border-gray-700 overflow-hidden">
        {/* Toolbar (time, hits, etc.) */}
        <div className="border-b border-gray-600 flex gap-2 items-center text-white p-1">
          <p>Time:</p>
          <p className="text-orange-500">
            {Math.floor(elapsedTime / 60000)
              .toString()
              .padStart(2, "0")}
            :{(Math.floor(elapsedTime / 1000) % 60).toString().padStart(2, "0")}
            :{Math.floor(elapsedTime / 100) % 10}
          </p>
          <p>Hits:</p>
          <p className="text-orange-500">{hits}</p>
        </div>
        {/* Game container */}
        <div
          className="flex flex-col h-96 justify-center relative"
          ref={gameContainer}
        >
          {screen === "menu" && (
            <button
              className="bg-orange-500 text-white font-semibold rounded-full px-8 py-1 mx-auto my-8"
              onClick={() => {
                setScreen("game");
                setStartTime(Date.now());
              }}
            >
              Play
            </button>
          )}
          {screen === "game" &&
            targets.map((target) => (
              <Target
                {...target}
                key={target.id}
                onTargetRemove={() => {
                  handleTargetRemove(target.id);
                }}
                onTargetHit={() => {
                  handleTargetRemove(target.id);
                  setHits((h) => h + 1);
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

type ScaleBehaviour = "grow" | "shrink";
const SCALE_INCREMENT = 0.01;

const Target: FC<
  TargetData & { onTargetRemove: () => void; onTargetHit: () => void }
> = (props) => {
  const behaviour = useRef<ScaleBehaviour>("grow");
  const scale = useRef<number>(0);
  const removed = useRef<boolean>(false);

  if (scale.current >= 1) {
    behaviour.current = "shrink";
  }

  useEffect(() => {
    const interval = setInterval(() => {
      scale.current = Math.max(
        Math.min(
          behaviour.current === "grow"
            ? scale.current + SCALE_INCREMENT
            : scale.current - SCALE_INCREMENT,
          1
        ),
        0
      );

      if (scale.current <= 0 && !removed.current) {
        removed.current = true;
        props.onTargetRemove();
      }
    }, 35);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="absolute bg-red-500 -translate-x-1/2 -translate-y-1/2 rounded-full"
      onClick={() => props.onTargetHit()}
      style={{
        width: TARGET_SIZE * scale.current,
        height: TARGET_SIZE * scale.current,
        top: props.position.y,
        left: props.position.x,
      }}
    />
  );
};
