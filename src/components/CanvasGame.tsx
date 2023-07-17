import { nanoid } from "nanoid";
import { createMemo, createSignal, onMount } from "solid-js";

type Position = { x: number; y: number };
const DIRECTIONS = ["left", "right", "up", "down"] as const;
type Direction = (typeof DIRECTIONS)[number];
type Enemy = { position: Position; id: string; direction: Direction };
type DirectionKey = "w" | "a" | "s" | "d";

const MOVEMENT_DISTANCE = 2;
const ENEMY_MOVEMENT_DISTANCE = 5;
const PLAYER_SIZE = 50;
const ENEMY_SIZE = 10;
const DIRECTION_MAGNITUDES: Record<
  Direction,
  { magnitude: number; key: DirectionKey }
> = {
  down: { magnitude: -1, key: "s" },
  left: { magnitude: -1, key: "a" },
  right: { magnitude: 1, key: "d" },
  up: { magnitude: 1, key: "w" },
};

/**
 * Get a random number between 0 and n
 */
const rand = (n: number) => Math.floor(Math.random() * n);

// Math.floor(Math.random()*width) - Generate random number between 0 and width
// Max - Make sure target center position is at least 1/2 target size from x=0/y=0
// Min - Make sure target center position is at least 1/2 target size from x=WIDTH_MAX/y=HEIGHT_MAX
const getRandomPosition = (max: number, size: number) => {
  return Math.min(Math.max(rand(max), size / 2), max - size / 2);
};

export const CanvasGame = () => {
  let canvas: HTMLCanvasElement;

  const [pos, setPos] = createSignal<Position>(
    { x: 50, y: 50 },
    { equals: (a, b) => a.x === b.x && a.y === b.y }
  );

  const [score, setScore] = createSignal(0);
  const getEnemyStartingPosition = (dir: Direction) => {
    if (dir === "left" || dir == "right") {
      return { x: dir === "right" ? 0 : canvas.width, y: rand(canvas.height) };
    }
    return { y: dir === "down" ? 0 : canvas.height, x: rand(canvas.width) };
  };

  const [enemies, setEnemies] = createSignal<Enemy[]>([]);
  const [pressedKeys, setPressedKeys] = createSignal<string[]>([]);

  const isOutOfBounds = (pos: Position) => {
    return (
      pos.x < 0 || pos.y < 0 || pos.x > canvas.width || pos.y > canvas.height
    );
  };

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
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return;
      }

      const { x, y } = pos();

      ctx.reset();

      ctx.strokeStyle = "red";
      let xMagnitude = 0;
      let yMagnitude = 0;
      let newEnemies: ReturnType<typeof enemies> = [];
      for (const e of enemies()) {
        xMagnitude = 0;
        yMagnitude = 0;
        if (e.direction === "left" || e.direction === "right") {
          xMagnitude +=
            DIRECTION_MAGNITUDES[e.direction].magnitude *
            ENEMY_MOVEMENT_DISTANCE;
        } else {
          yMagnitude +=
            -DIRECTION_MAGNITUDES[e.direction].magnitude *
            ENEMY_MOVEMENT_DISTANCE;
        }

        const newX = e.position.x + xMagnitude;
        const newY = e.position.y + yMagnitude;

        if (!isOutOfBounds({ x: newX, y: newY })) {
          ctx.beginPath();
          newEnemies.push({
            ...e,
            position: {
              x: newX,
              y: newY,
            },
          });

          ctx.rect(newX, newY, ENEMY_SIZE, ENEMY_SIZE);

          ctx.closePath();
          ctx.stroke();
        } else {
          setScore((s) => s + 1);
        }
      }

      setEnemies(newEnemies);

      ctx.strokeStyle = "black";
      ctx.beginPath();
      ctx.ellipse(x, y, PLAYER_SIZE / 2, PLAYER_SIZE / 2, 0, 0, 360);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.closePath();
      ctx.stroke();
    }, 1);

    setInterval(() => {
      const dir = DIRECTIONS[Math.floor(Math.random() * 4)];
      if (!dir) {
        return;
      }

      setEnemies((prev) => [
        ...prev,
        {
          id: nanoid(),
          position: getEnemyStartingPosition(dir),
          direction: dir,
        },
      ]);
    }, 10);
  });

  // createEffect(() => {
  //   const ctx = canvas.getContext("2d");

  //   if (!ctx) {
  //     return;
  //   }

  //   const { x, y } = pos();

  //   ctx.reset();

  //   ctx.strokeStyle = "red";
  //   let xMagnitude = 0;
  //   let yMagnitude = 0;
  //   let newEnemies: ReturnType<typeof enemies> = [];
  //   for (const e of enemies()) {
  //     ctx.beginPath();

  //     xMagnitude = 0;
  //     yMagnitude = 0;
  //     if (e.direction === "left" || e.direction === "right") {
  //       xMagnitude +=
  //         DIRECTION_MAGNITUDES[e.direction].magnitude * MOVEMENT_DISTANCE;
  //     } else {
  //       yMagnitude +=
  //         -DIRECTION_MAGNITUDES[e.direction].magnitude * MOVEMENT_DISTANCE;
  //     }
  //     console.log(e.position.x, e.position.y, xMagnitude, yMagnitude);

  //     newEnemies.push({
  //       ...e,
  //       position: {
  //         x: e.position.x + xMagnitude,
  //         y: e.position.y + yMagnitude,
  //       },
  //     });

  //     ctx.rect(
  //       e.position.x + xMagnitude,
  //       e.position.y + yMagnitude,
  //       ENEMY_SIZE,
  //       ENEMY_SIZE
  //     );

  //     ctx.closePath();
  //     ctx.stroke();
  //   }
  //   // setEnemies(newEnemies);

  //   ctx.strokeStyle = "black";
  //   ctx.beginPath();
  //   ctx.ellipse(x, y, PLAYER_SIZE / 2, PLAYER_SIZE / 2, 0, 0, 360);
  //   ctx.fillStyle = "white";
  //   ctx.fill();
  //   ctx.closePath();
  //   ctx.stroke();
  // });

  return (
    <div class="flex flex-col gap-4">
      <div class="bg-gray-100 border rounded-xl mx-auto p-4">
        <p class="text-center text-gray-500 text-sm">Score</p>
        <p class="font-bold text-3xl text-center">{score()}</p>
      </div>
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
    </div>
  );
};

// const Enemy = (props: EnemyData & { onRemoveEnemy: () => void }) => {
//   const [removed, setRemoved] = createSignal(false);

//   //Set the starting location
//   const [enemyX, setEnemyX] = createSignal(props.position.x);
//   const [enemyY, setEnemyY] = createSignal(props.position.y);

//   //Create an interval to move in that direction
//   onMount(() => {
//     const xStart = props.position.x;
//     const yStart = props.position.y;
//     const containerWidth = props.containerSize.x;
//     const containerHeight = props.containerSize.y;
//     let direction: Direction;
//     //Figure out what direction we should move in
//     if (xStart == 0) {
//       //Going right
//       direction = { x: 1, y: 0 };
//     } else if (xStart == containerWidth) {
//       //Going left
//       direction = { x: -1, y: 0 };
//     } else if (yStart == 0) {
//       //Going down
//       direction = { x: 0, y: 1 };
//     } else {
//       //Going up
//       direction = { x: 0, y: -1 };
//     }
//     setInterval(() => {
//       setEnemyX((prev) => prev + direction.x);
//       setEnemyY((prev) => prev + direction.y);

//       if (
//         (enemyX() < 0 ||
//           enemyX() > containerWidth ||
//           enemyY() < 0 ||
//           enemyY() > containerHeight) &&
//         !removed()
//       ) {
//         setRemoved(true);
//         props.onRemoveEnemy();
//       }
//     }, 1);
//   });

//   //Based on the direction remove the enemy from the array if it's off the screen
//   return (
//     <div
//       class="bg-red-600 absolute border-white top-0 left-0"
//       style={{
//         width: `${ENEMY_SIZE}px`,
//         height: `${ENEMY_SIZE}px`,
//         "will-change": "transform",
//         transform: `translate(${enemyX()}px,${enemyY()}px)`,
//       }}
//     ></div>
//   );
// };
