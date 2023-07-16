import { FC, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

type GameState = "game" | "menu";
type Position = { x: number; y: number };
type PlayerData = {
  position: Position;
};
type EnemyData = {
  position: Position;
  containerSize: Position;
  id: string;
};

const PLAYER_SIZE = 15;
const ENEMY_SIZE = 10;

export const Game = () => {
  const [enemies, setEnemies] = useState<EnemyData[]>([]);
  const gameContainer = useRef<HTMLDivElement>(null);

  const handleRemoveEnemy = (id: string) => {
    // Filter out the id of the enemy from the array
    setEnemies((prev) => prev.filter((e) => e.id != id));
  };

  // Starts an interval to spawn enemies once the game state is in "game"
  useEffect(() => {
    // const spawnerInterval = setInterval(() => {
    if (gameContainer.current) {
      const height = gameContainer.current.clientHeight;
      const width = gameContainer.current.clientWidth;

      let xLoc = Math.random();
      let yLoc = Math.random();

      if (Math.random() < 0.5) {
        if (xLoc <= 0.5) {
          xLoc = 0;
        } else {
          xLoc = width;
        }
        yLoc = Math.floor(yLoc * height);
      } else {
        if (yLoc < 0.5) {
          yLoc = 0;
        } else {
          yLoc = height;
        }
        xLoc = Math.floor(xLoc * width);
      }

      const newEnemy: EnemyData = {
        position: {
          x: xLoc,
          y: yLoc,
        },
        containerSize: {
          x: width,
          y: height,
        },
        id: uuid(),
      };
      setEnemies((prev) => [...prev, newEnemy]);
    }
    // }, 100);

    // return () => {
    // clearInterval(spawnerInterval);
    // };
  }, []);

  return (
    // main screen
    <div className="flex flex-col h-screen justify-center bg-gray-400 items-center">
      <div
        className="flex flex-col bg-black h-2/3 w-3/5 text-white text-lg justify-center items-center relative"
        ref={gameContainer}
      >
        <div className="h-max w-max">
          {enemies.map((enemy) => (
            <Enemy
              {...enemy}
              key={enemy.id}
              onRemoveEnemy={() => {
                handleRemoveEnemy(enemy.id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

type Direction = { x: number; y: number };
const Enemy: FC<EnemyData & { onRemoveEnemy: () => void }> = (props) => {
  const removed = useRef<boolean>(false);

  //Set the starting location
  const enemyX = useRef(props.position.x);
  const enemyY = useRef(props.position.y);
  console.log("here");
  //Create an interval to move in that direction
  useEffect(() => {
    const xStart = props.position.x;
    const yStart = props.position.y;
    const containerWidth = props.containerSize.x;
    const containerHeight = props.containerSize.y;
    let direction: Direction;
    //Figure out what direction we should move in
    if (xStart == 0) {
      //Going right
      direction = { x: 1, y: 0 };
    } else if (xStart == containerWidth) {
      //Going left
      direction = { x: -1, y: 0 };
    } else if (yStart == 0) {
      //Going down
      direction = { x: 0, y: 1 };
    } else {
      //Going up
      direction = { x: 0, y: -1 };
    }
    const moveEnemyInterval = setInterval(() => {
      enemyX.current = enemyX.current + direction.x;
      enemyY.current = enemyY.current + direction.y;

      if (
        (enemyX.current < 0 ||
          enemyX.current > containerWidth ||
          enemyY.current < 0 ||
          enemyY.current > containerHeight) &&
        !removed.current
      ) {
        removed.current = true;
        props.onRemoveEnemy();
      }
    }, 1);

    return () => {
      clearInterval(moveEnemyInterval);
    };
  }, []);

  //Based on the direction remove the enemy from the array if it's off the screen
  return (
    <div
      className="bg-red-600 absolute border-white"
      style={{
        width: ENEMY_SIZE,
        height: ENEMY_SIZE,
        left: enemyX.current,
        top: enemyY.current,
      }}
    ></div>
  );
};
