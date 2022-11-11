import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import './Game.scss';

const keyCodes = {
  up: 38,
  down: 40,
  right: 39,
  left: 37,
  space: 32,
};

const cellSize = 30;
const gameTickMs = 10;

const itemsCountX = parseInt((window.innerWidth - 250) / cellSize, 10);
const itemsCountY = parseInt((window.innerHeight) / cellSize, 10);

// const itemsCountX = 20;
// const itemsCountY = 10;

const enemyConfig = {
  height: 2,
  width: 3,
  rows: 2,
  movingSpaceDiv: 0.8,
  gapInRow: 1,
  gapInCol: 1,
  moveSpeed: 700,
  // moveSpeed: 1000000,
  startFiringSpeed: 1500,
  fireSpeed: 500,
  images: [
    `${process.env.PUBLIC_URL}/enemy.png`,
    `${process.env.PUBLIC_URL}/enemy2.png`,
    `${process.env.PUBLIC_URL}/enemy3.png`,
    `${process.env.PUBLIC_URL}/enemy4.png`,
    `${process.env.PUBLIC_URL}/enemy5.png`,
  ],
};

const initEnemiesFn = () => {
  const movingSpace = itemsCountX * enemyConfig.movingSpaceDiv;
  const enemiesCountPerRow = parseInt(
    movingSpace / (enemyConfig.width + enemyConfig.gapInRow),
    10
  );

  let ens = [];

  for (let row = 0; row < enemyConfig.rows; row++) {
    const randomImgIndex = Math.floor(
      Math.random() * enemyConfig.images.length
    );
    let image = enemyConfig.images[randomImgIndex];
    for (let indexInRow = 0; indexInRow < enemiesCountPerRow; indexInRow++) {
      const ensInRow = [];
      for (let x = 0; x < enemyConfig.width; x++) {
        for (let y = 0; y < enemyConfig.height; y++) {
          const lastX = itemsCountX - 1;
          const firstY = 0;
          const coordX =
            lastX - indexInRow * (enemyConfig.width + enemyConfig.gapInRow) - x;
          const coordY =
            firstY + row * (enemyConfig.height + enemyConfig.gapInCol) + y;
          ensInRow.push({
            x: coordX,
            y: coordY,
            image,
          });
        }
      }
      ens.push(ensInRow);
    }
  }
  return ens;
};

const craftConfig = {
  fireSpeed: 10,
  width: 3,
  height: 3,
	fireSpeed: 200,
};

const initCraftFn = () => {
  const result = [];
  for (let x = 0; x < craftConfig.width; x++) {
    for (let y = 0; y < craftConfig.height; y++) {
      result.push({ x, y: itemsCountY - (y + 1) });
    }
  }
  return result;
};

function Game() {
  const [gameState, setGameState] = useState('notStarted');
  const [craftFires, setCraftFires] = useState([]);
  const [enemiesFires, setEnemiesFires] = useState([]);
  const [craftImgCoords, setCraftImgCoords] = useState({ x: -100, y: -100 });
  const [craftImgUrl, setCraftImgUrl] = useState('');

  const [craftCoords, setCraftCoords] = useState([]);

  const [enemies, setEnemies] = useState([]);
  const [initialEnemiesCount, setInitialEnemiesCount] = useState(0);


  const enemiesRef = useRef(enemies);
  enemiesRef.current = enemies;

  const defaultAudioRef = useRef(
    new Audio(`${process.env.PUBLIC_URL}/default.mp3`)
  );
  const inProgressAudioRef = useRef(
    new Audio(`${process.env.PUBLIC_URL}/inprogress.mp3`)
  );
  const enemyFireAudioRef = useRef(
    new Audio(`${process.env.PUBLIC_URL}/piu2.mp3`)
  );
  const craftFireAudioRef = useRef(
    new Audio(`${process.env.PUBLIC_URL}/piu1.mp3`)
  );
  const hitAudioRef = useRef(new Audio(`${process.env.PUBLIC_URL}/hit.mp3`));

  const [isEnemiesMoveLeft, setIsEnemiesMoveLeft] = useState(true);

  const startGame = useCallback(() => {
    setCraftCoords(initCraftFn());
		const ens = initEnemiesFn();
    setEnemies(ens);
		setInitialEnemiesCount(ens.length);
    setEnemiesFires([]);
    setCraftFires([]);
    setGameState('inProgress');
    setCraftImgUrl(`${process.env.PUBLIC_URL}/craft.png`);
  }, []);

  const stopBackgroundMusic = useCallback((isDefault) => {
    defaultAudioRef.current.pause();
    defaultAudioRef.current.currentTime = 0;
    defaultAudioRef.current.loop = true;

    inProgressAudioRef.current.pause();
    inProgressAudioRef.current.currentTime = 0;
    inProgressAudioRef.current.loop = true;
  }, []);

  const startBackgroundMusic = useCallback(
    (isDefault) => {
      stopBackgroundMusic();

      if (isDefault) {
        return defaultAudioRef.current.play();
      }
      return inProgressAudioRef.current.play();
    },
    [stopBackgroundMusic]
  );

  const startFireAudio = useCallback((isEnemy) => {
		if (isEnemy) {
			enemyFireAudioRef.current.pause();
			enemyFireAudioRef.current.currentTime = 0;
			enemyFireAudioRef.current.play()
			return;
		}
		craftFireAudioRef.current.pause();
		craftFireAudioRef.current.currentTime = 0;
		craftFireAudioRef.current.play()
  }, []);

  const startHitAudio = useCallback((isEnemy) => {
    hitAudioRef.current.play();
  }, []);

  useEffect(() => {
    document.body.style.backgroundImage = `url(${process.env.PUBLIC_URL}/bg2.jpg)`;
    document.body.style.backgroundSize = '100%';
    // startGame();
  }, []);

  const isRightEnd = useCallback((x) => {
    return x === itemsCountX - 1;
  }, []);

  const isLeftEnd = useCallback((x) => {
    return x === 0;
  }, []);

  const isTopEnd = useCallback((y) => {
    return y === 0;
  }, []);

  const isBottomEnd = useCallback((x) => {
    return x === itemsCountY - 1;
  }, []);

  const isCraft = useCallback(
    ({ x, y }) => {
      return craftCoords.find((item) => {
        return x === item.x && y === item.y;
      });
    },
    [craftCoords]
  );

  const getMinCoord = (items, isX) => {
    let min = Infinity;
    items.forEach((item) => {
      min = Math.min(min, isX ? item.x : item.y);
    });
    return min;
  };

  const getMiddleCoord = (min, max) => {
    return min + parseInt((max - min) / 2, 10);
  };

  const getMaxCoord = (items, isX) => {
    let max = -Infinity;
    items.forEach((item) => {
      max = Math.max(max, isX ? item.x : item.y);
    });
    return max;
  };

  const moveCraftRight = useCallback(() => {
    const max = getMaxCoord(craftCoords, true);

    if (isRightEnd(max)) {
      return;
    }
    setCraftCoords((prevValue) => [
      ...prevValue.map((item) => ({ ...item, x: item.x + 1 })),
    ]);
  }, [craftCoords, isRightEnd]);

  const moveCraftLeft = useCallback(() => {
    let min = getMinCoord(craftCoords, true);
    if (isLeftEnd(min)) {
      return;
    }
    setCraftCoords((prevValue) => [
      ...prevValue.map((item) => ({ ...item, x: item.x - 1 })),
    ]);
  }, [craftCoords, isLeftEnd]);

  const craftFireStart = useCallback(() => {
    const y = itemsCountY - craftConfig.height;
    const minX = getMinCoord(craftCoords, true);
    const maxX = getMaxCoord(craftCoords, true);
    const x = getMiddleCoord(minX, maxX);
    setCraftFires((prevValue) => [
      ...prevValue,
      {
        x,
        y,
      },
    ]);
    startFireAudio(false);
    // eslint-disable-next-line no-use-before-define
  }, [craftCoords, startFireAudio]);

  const isCraftFire = useCallback(
    ({ x, y }) => {
      return craftFires.find((item) => {
        return x === item.x && y === item.y;
      });
    },
    [craftFires]
  );

  const isEnemyItem = useCallback(
    ({ x, y }) => {
      return enemies.find((item) => {
        return item.find((point) => !!(point.x === x && point.y === y));
      });
    },
    [enemies]
  );

  const isEnemyFire = useCallback(
    ({ x, y }) => {
      return enemiesFires.some((item) => {
        return item.x === x && item.y === y;
      });
    },
    [enemiesFires]
  );

  const isOutOfFieldY = useCallback((y) => {
    return y >= itemsCountY || y < 0;
  }, []);

  const intersects = useCallback(({ x, y }, items) => {
    return items.find((item) => {
      return item.x === x && item.y === y;
    });
  }, []);

  const intersectsAnyEnemy = useCallback(
    (item, ens) => {
      return ens.find((enPoints) => {
        return intersects(item, enPoints);
      });
    },
    [intersects]
  );

  useEffect(() => {
    if (gameState !== 'inProgress') {
      return;
    }

    const listener = (event) => {
      if (event.keyCode === keyCodes.right) {
        moveCraftRight();
      }

      if (event.keyCode === keyCodes.left) {
        moveCraftLeft();
      }

      if (event.keyCode === keyCodes.space) {
        craftFireStart();
      }
    };

    document.addEventListener('keyup', listener);

    return () => {
      document.removeEventListener('keyup', listener);
    };
  }, [
    craftFireStart,
    gameState,
    isBottomEnd,
    isLeftEnd,
    isRightEnd,
    isTopEnd,
    moveCraftLeft,
    moveCraftRight,
  ]);

  useEffect(() => {
    const craftFire = () => {
      if (craftFires.length === 0) {
        return;
      }
      const interval = setInterval(() => {
        setCraftFires((prevValue) =>
          prevValue
            .map((item) => {
              if (isOutOfFieldY(item.y)) {
                return null;
              }
              return {
                x: item.x,
                y: item.y - 1,
              };
            })
            .filter(Boolean)
        );
      }, craftConfig.fireSpeed);
      return interval;
    };
    const int = craftFire();

    return () => {
      if (int) {
        clearInterval(int);
      }
    };
  }, [craftFires, intersects, intersectsAnyEnemy, isOutOfFieldY]);

  useEffect(() => {
    if (gameState !== 'inProgress') {
      return;
    }

    if (enemiesRef.current.length === 0) {
      return;
    }

    const enemiesStartFire = () => {
      const getEnemyStartingFirePoint = (item) => {
        let minX = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        item.forEach((point) => {
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });

        const fireStartingCoords = {
          x: getMiddleCoord(minX, maxX),
          y: maxY + 1,
        };

        for (let y = fireStartingCoords.y; y < itemsCountY; y++) {
          if (
            intersectsAnyEnemy(
              { x: fireStartingCoords.x, y },
              enemiesRef.current
            )
          ) {
            return null;
          }
        }
        return fireStartingCoords;
      };

      const startFiring = () => {
        if (enemiesRef.current.length === 0) {
          return;
        }

        const randomEnemyIndex = Math.floor(
          Math.random() * enemiesRef.current.length
        );
        const randomEnemy = enemiesRef.current[randomEnemyIndex];
        const firePoint = getEnemyStartingFirePoint(randomEnemy);
        if (firePoint) {
          setEnemiesFires((prevValue) => [...prevValue, firePoint]);
          startFireAudio(true);
        }
      };

      const interval = setInterval(() => {
        startFiring();
      }, enemyConfig.startFiringSpeed);

      return interval;
    };

    const int = enemiesStartFire();

    return () => {
      if (int) {
        clearInterval(int);
      }
    };
  }, [gameState, intersectsAnyEnemy, startFireAudio]);

  useEffect(() => {
    if (gameState !== 'inProgress') {
      return;
    }

    const enemiesFire = () => {
      if (enemiesFires.length === 0) {
        return;
      }
      const interval = setInterval(() => {
        setEnemiesFires((prevValue) =>
          prevValue
            .map((item) => {
              if (isOutOfFieldY(item.y)) {
                return null;
              }
              return {
                x: item.x,
                y: item.y + 1,
              };
            })
            .filter(Boolean)
        );
      }, enemyConfig.fireSpeed);
      return interval;
    };
    const int = enemiesFire();

    return () => {
      if (int) {
        clearInterval(int);
      }
    };
  }, [isOutOfFieldY, enemiesFires, gameState]);

  useEffect(() => {
    if (gameState !== 'inProgress') {
      return;
    }

    const moveEnemies = () => {
      if (enemies.length === 0) {
        return;
      }
      const interval = setInterval(() => {
        setEnemies((prevValue) => {
          let setX = (x) => x;
          let setY = (y) => y;

          if (isEnemiesMoveLeft) {
            let min = getMinCoord(prevValue.flat(), true);
            if (isLeftEnd(min)) {
              setX = (x) => x;
              setY = (y) => y + 1;
              setIsEnemiesMoveLeft(false);
            } else {
              setX = (x) => x - 1;
              setY = (y) => y;
            }
          } else {
            let max = getMaxCoord(prevValue.flat(), true);
            if (isRightEnd(max)) {
              setX = (x) => x;
              setY = (y) => y + 1;
              setIsEnemiesMoveLeft(true);
            } else {
              setX = (x) => x + 1;
              setY = (y) => y;
            }
          }

          return prevValue.map((item) => {
            const itemCopy = [...item];
            return itemCopy.map((point) => {
              const pointCopy = { ...point };
              return {
								...pointCopy,
                x: setX(pointCopy.x),
                y: setY(pointCopy.y),
              };
            });
          });
        });
      }, enemyConfig.moveSpeed);
      return interval;
    };
    const int = moveEnemies();

    return () => {
      if (int) {
        clearInterval(int);
      }
    };
  }, [
    craftCoords,
    craftFires,
    enemies.length,
    enemies.moveSpeed,
    gameState,
    isEnemiesMoveLeft,
    isLeftEnd,
    isOutOfFieldY,
    isRightEnd,
  ]);

  useEffect(() => {
    if (gameState !== 'inProgress') {
      return;
    }

    const gameTick = () => {
      const interval = setInterval(() => {

        const craftFiresToRemove = [];
				let newEnemiesValue = enemies;

        craftFires.forEach((cFire) => {
          // Craft fires enemies
          const intersectionEnemy = intersectsAnyEnemy(cFire, newEnemiesValue);
          if (intersectionEnemy) {
            craftFiresToRemove.push(cFire);
						setEnemies((prevValue) => {
							return prevValue.filter(
								(item) => item !== intersectionEnemy
							);
						});
            startHitAudio();
          }
          // Craft fires enemies' fire
          const intersectionEmemyFire = intersects(cFire, enemiesFires);
          if (intersectionEmemyFire) {
            craftFiresToRemove.push(cFire);
            setEnemiesFires((prevValue) => {
              return prevValue.filter((item) => item !== intersectionEmemyFire);
            });
            startHitAudio();
          }
        });

        if (craftFiresToRemove.length > 0) {
          setCraftFires((prevValue) => {
            return prevValue.filter(
              (item) => craftFiresToRemove.indexOf(item) === -1
            );
          });
        }

        // Enemies fire craft
        const enemyFiresToRemove = [];
        enemiesFires.forEach((cFire) => {
          const intersectionCraft = craftCoords.some(
            (item) => item.x === cFire.x && item.y === cFire.y
          );
          if (intersectionCraft) {
            enemyFiresToRemove.push(cFire);
            startHitAudio();
            setGameState('lost');
          }
        });

        if (enemyFiresToRemove.length > 0) {
          setEnemiesFires((prevValue) => {
            return prevValue.filter(
              (item) => enemyFiresToRemove.indexOf(item) === -1
            );
          });
        }

        // Enemies hit craft
        const isIntersectionCraftEnemies = craftCoords.some((item) =>
          intersectsAnyEnemy(item, enemies)
        );
        if (isIntersectionCraftEnemies) {
          startHitAudio();
          setGameState('lost');
        }
      }, gameTickMs);

      return interval;
    };

    const int = gameTick();

    return () => {
      if (int) {
        clearInterval(int);
      }
    };
  }, [
    craftCoords,
    craftFires,
    enemies,
    enemiesFires,
    gameState,
    intersects,
    intersectsAnyEnemy,
    startHitAudio,
  ]);

  useEffect(() => {
    if (enemies.length === 0 && gameState === 'inProgress') {
      setGameState('won');
    }
  }, [enemies.length, gameState]);

  useEffect(() => {
    const moveCraftCover = () => {
      const minX = getMinCoord(craftCoords, true);
      const minY = getMinCoord(craftCoords, false);

      const imgX = cellSize * minX + 'px';
      const imgY = cellSize * (minY) + 'px';

      setCraftImgCoords({ x: imgX, y: imgY });
    };
    moveCraftCover();
  }, [craftCoords]);

  useEffect(() => {
    const setCraftCoverUrl = () => {
      if (gameState !== 'lost') {
        return;
      }
      setCraftImgUrl(`${process.env.PUBLIC_URL}/burst.png`);
    };
    setCraftCoverUrl();
  }, [craftImgUrl, gameState]);

  useEffect(() => {
    const resolveAudio = () => {
      if (gameState === 'notStarted') {
        return stopBackgroundMusic();
      }
      startBackgroundMusic(gameState !== 'inProgress');
    };
    resolveAudio();
  }, [gameState, startBackgroundMusic, stopBackgroundMusic]);

  const getBackgroundImage = useCallback(
    (item) => {
      const isEnFire = isEnemyFire(item);
      const isCr = isCraft(item);
      const isCrFire = isCraftFire(item);
      const isEn = isEnemyItem(item);

      if (isEnFire && isCr) {
        return `url(${process.env.PUBLIC_URL}/burst.png)`;
      }
      if (isCrFire && isEn) {
        return `url(${process.env.PUBLIC_URL}/burst.png)`;
      }
      if (isEn) {
        return `url(${isEn[0].image})`;
      }
      if (isEnFire) {
        return `url(${process.env.PUBLIC_URL}/carrot.png)`;
      }
      if (isCrFire) {
        return `url(${process.env.PUBLIC_URL}/paut.png)`;
      }
      return undefined;
    },
    [isCraft, isCraftFire, isEnemyFire, isEnemyItem]
  );

	const rows = useMemo(() => [...Array(itemsCountY).keys()], []);
	const cols = useMemo(() => [...Array(itemsCountX).keys()], []);

  return (
    <div>
      <div className="gameWrapper">
        {gameState === 'paused' && (
          <div className="modalBg">
            <div className="modal gameState--lost">
              <h4>Paused</h4>,
              <button
                className="btn"
                onClick={() => setGameState('inProgress')}
              >
                Resume
              </button>
            </div>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="modalBg">
            <div className="modal gameState--lost">
              <h4>You lost</h4>,
              <button className="btn" onClick={startGame}>
                Start Again
              </button>
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <div className="modalBg">
            <div className="modal gameState--won">
              <h4>You won!!!</h4>,
              <button className="btn" onClick={startGame}>
                Start Again
              </button>
              <br />
              <button
                className="btn"
                onClick={() => setGameState('notStarted')}
              >
                Exit
              </button>
            </div>
          </div>
        )}

        <div className="gameWrapper__inner">
          {gameState === 'notStarted' && (
            <div className="gameState--notStarted">
              <div>
								<img className='gameCover' src={`${process.env.PUBLIC_URL}/game-cover.png`} alt='' />
							</div> 
							<button className="btn" onClick={startGame}>
                Start Game
              </button>
            </div>
          )}

          {(gameState === 'inProgress' ||
            gameState === 'won' ||
            gameState === 'paused' ||
            gameState === 'lost') && (
            <>
              <div className="gameField">
                <img
                  className="craftCover"
                  src={craftImgUrl}
                  alt=""
                  style={{
                    width: `${cellSize * craftConfig.width}px`,
                    height: `${cellSize * craftConfig.height}px`,
                    left: craftImgCoords.x,
                    top: craftImgCoords.y,
                  }}
                />

                {rows.map((row) => (
                  <div key={row} className="game__row">
                    {cols.map((col) => (
                      <div
                        key={`${row}_${col}`}
                        style={{
                          backgroundImage: getBackgroundImage({
                            x: col,
                            y: row,
                          }),
                        }}
                        className={classNames('game__col', {
                          head: isCraft({ x: col, y: row }),
                          craftFire: isCraftFire({ x: col, y: row }),
                          enemyPoint: isEnemyItem({ x: col, y: row }),
                          enemyFire: isEnemyFire({ x: col, y: row }),
                        })}
                      >
                        <div
                          style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                          }}
                        ></div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="dashboard">
                <div className="dashboard__score">{ initialEnemiesCount - enemies.length }</div>
                {(gameState === 'inProgress' || gameState === 'paused') && (
                  <>
                    <button
                      className="btn"
                      onClick={() => setGameState('notStarted')}
                    >
                      Exit
                    </button>

                    {gameState === 'inProgress' && (
                      <button
                        className="btn"
                        onClick={() => setGameState('paused')}
                      >
                        Pause
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Game;
