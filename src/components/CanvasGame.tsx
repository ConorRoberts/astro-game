import { createEffect, createMemo, createSignal, onMount } from "solid-js";

type Position = { x: number; y: number };
type HorizontalDirection = "left" | "right";
type VerticalDirection = "up" | "down";
type Direction = VerticalDirection | HorizontalDirection;
type Enemy = { position: Position; id: string };
type DirectionKey = "w" | "a" | "s" | "d";

const MOVEMENT_DISTANCE = 2;
const PLAYER_SIZE = 50;
const DIRECTION_MAGNITUDES: Record<
  Direction,
  { magnitude: number; key: DirectionKey }
> = {
  down: { magnitude: -1, key: "s" },
  left: { magnitude: -1, key: "a" },
  right: { magnitude: 1, key: "d" },
  up: { magnitude: 1, key: "w" },
};

export const CanvasGame = () => {
  let canvas: HTMLCanvasElement;

  const [pos, setPos] = createSignal<Position>({ x: 50, y: 50 });
  const [enemies, setEnemies] = createSignal<Enemy[]>([]);
  const [pressedKeys, setPressedKeys] = createSignal<string[]>([]);

  const direction = createMemo(() => {
    let yMagnitude = 0;
    let xMagnitude = 0;

    Object.entries(DIRECTION_MAGNITUDES).forEach(([, { key, magnitude }]) => {
      const found = pressedKeys().includes(key);
      if ((key === "w" || key === "s") && found) {
        yMagnitude += magnitude;
      } else if ((key === "a" || key === "d") && found) {
        xMagnitude += magnitude;
      }
    });

    return { x: xMagnitude, y: yMagnitude };
  });

  const getNewPosition = () => {
    let newPos: Position = { ...pos() };
    const dir = direction();

    newPos.y += -dir.y * MOVEMENT_DISTANCE;
    newPos.x += dir.x * MOVEMENT_DISTANCE;

    newPos.x = Math.max(
      Math.min(newPos.x, canvas.width - PLAYER_SIZE / 2),
      PLAYER_SIZE / 2
    );
    newPos.y = Math.max(
      Math.min(newPos.y, canvas.height - PLAYER_SIZE / 2),
      PLAYER_SIZE / 2
    );

    return newPos;
  };

  const handleMoveStart = (e: globalThis.KeyboardEvent) => {
    setPressedKeys((keys) => [...keys, e.key]);
  };

  const handleMoveStop = (e: globalThis.KeyboardEvent) => {
    setPressedKeys((keys) => keys.filter((k) => k !== e.key));
  };

  onMount(() => {
    document.addEventListener("keydown", handleMoveStart);
    document.addEventListener("keyup", handleMoveStop);

    setInterval(() => {
      setPos(getNewPosition());
    }, 1);
  });

  createEffect(() => {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const { x, y } = pos();

    ctx.reset();
    ctx.strokeStyle = "red";
    ctx.beginPath();
    // ctx.rect(bounds.x1, bounds.y1, PLAYER_SIZE, PLAYER_SIZE);
    ctx.closePath();
    ctx.stroke();
    // ctx.strokeStyle = "transparent";
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.ellipse(x, y, PLAYER_SIZE / 2, PLAYER_SIZE / 2, 0, 0, 360);
    ctx.closePath();
    // ctx.strokeStyle = "black";
    ctx.stroke();
  });

  return (
    <div class="flex relative flex-col border-4 border-black">
      <div
        class="absolute w-max p-2 border rounded-t-lg rounded-br-lg bg-white"
        style={{
          translate: `${pos().x + PLAYER_SIZE / 2}px ${
            pos().y - PLAYER_SIZE
          }px`,
        }}
      >
        <p>
          ({pos().x}, {pos().y})
        </p>
      </div>
      <canvas
        ref={(el) => (canvas = el)}
        width={900}
        height={900}
        class="outline-4 flex-1"
      />
    </div>
  );
};
