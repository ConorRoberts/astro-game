import { For, createSignal, onMount } from "solid-js";
import { v4 as uuid } from "uuid";

type Position = { x: number; y: number };

type EnemyData = {
  position: Position;
  containerSize: Position;
  id: string;
  visible: boolean;
};

const getGameContainer = () => document.getElementById("game");

const ENEMY_SIZE = 10;

export const SolidGame = () => {
  const [enemies, setEnemies] = createSignal<EnemyData[]>([]);

  // Create the player object if we switched to the "game" game state

  //This method should add an enemy to the enemies array at random locations at the border of the screen
  const handleCreateEnemies = () => {
    const gameContainer = getGameContainer();
    if (gameContainer) {
      const height = gameContainer.clientHeight;
      const width = gameContainer.clientWidth;

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
        visible: true,
        id: uuid(),
      };
      setEnemies((prev) => [...prev, newEnemy]);
    }
  };

  const handleRemoveEnemy = (id: string) => {
    // Filter out the id of the enemy from the array
    setEnemies((prev) => prev.filter((e) => e.id != id));
    // setEnemies((prev) =>
    //   prev.map((e) => ({ ...e, visible: e.id === id ? false : e.visible }))
    // );
  };

  // Starts an interval to spawn enemies once the game state is in "game"
  onMount(() => {
    setInterval(() => {
      handleCreateEnemies();
    }, 100);
  });

  return (
    <div class="flex flex-col h-screen justify-center bg-gray-400 items-center">
      <div
        class="flex flex-col bg-black h-2/3 w-3/5 text-white text-lg justify-center items-center relative"
        id="game"
      >
        <div class="h-max w-max">
          <For each={enemies()}>
            {(enemy) => (
              <Enemy
                containerSize={enemy.containerSize}
                id={enemy.id}
                position={enemy.position}
                onRemoveEnemy={() => {
                  handleRemoveEnemy(enemy.id);
                }}
                visible={enemy.visible}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  );
};

type Direction = { x: number; y: number };
const Enemy = (props: EnemyData & { onRemoveEnemy: () => void }) => {
  const [removed, setRemoved] = createSignal(false);

  //Set the starting location
  const [enemyX, setEnemyX] = createSignal(props.position.x);
  const [enemyY, setEnemyY] = createSignal(props.position.y);

  //Create an interval to move in that direction
  onMount(() => {
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
    setInterval(() => {
      setEnemyX((prev) => prev + direction.x);
      setEnemyY((prev) => prev + direction.y);

      if (
        (enemyX() < 0 ||
          enemyX() > containerWidth ||
          enemyY() < 0 ||
          enemyY() > containerHeight) &&
        !removed()
      ) {
        setRemoved(true);
        props.onRemoveEnemy();
      }
    }, 1);
  });

  //Based on the direction remove the enemy from the array if it's off the screen
  return (
    <div
      class="bg-red-600 absolute border-white top-0 left-0"
      style={{
        width: `${ENEMY_SIZE}px`,
        height: `${ENEMY_SIZE}px`,
        "will-change": "transform",
        transform: `translate(${enemyX()}px,${enemyY()}px)`,
      }}
    ></div>
  );
};
