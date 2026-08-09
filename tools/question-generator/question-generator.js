(() => {
  "use strict";

  const SUITS = ["m", "p", "s"];
  const SIMPLE_NUMBERS = [2, 3, 4, 5, 6, 7, 8];
	const ALL_TILE_CODES = [
	  "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m",
	  "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p",
	  "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s",
	  "east", "south", "west", "north",
	  "white", "green", "red"
	];

	function createRandomDoraIndicator() {
	  return randomItem(ALL_TILE_CODES);
	}

  let currentGeneratedQuestion = null;
  const acceptedQuestions = [];

  function getSelectedConditions() {
    return {
      targetYaku:
        document.getElementById("targetYaku").value,
      winType:
        document.getElementById("winType").value,
      playerType:
        document.getElementById("playerType").value,
      handType:
        document.getElementById("handType").value,
      kanType:
        document.getElementById("kanType").value
    };
  }

  function randomItem(items) {
    return items[
      Math.floor(Math.random() * items.length)
    ];
  }

  function shuffle(items) {
    const result = [...items];

    for (
      let index = result.length - 1;
      index > 0;
      index -= 1
    ) {
      const randomIndex =
        Math.floor(Math.random() * (index + 1));

      [
        result[index],
        result[randomIndex]
      ] = [
        result[randomIndex],
        result[index]
      ];
    }

    return result;
  }

  function createRandomSimpleSequence() {
    const suit = randomItem(SUITS);

    // 断么九なので123・789は作らない。
    // 順子の開始牌は2～6。
    const start =
      randomItem([2, 3, 4, 5, 6]);

    return [
      `${start}${suit}`,
      `${start + 1}${suit}`,
      `${start + 2}${suit}`
    ];
  }

  function createRandomSimpleTriplet() {
    const suit = randomItem(SUITS);
    const number = randomItem(SIMPLE_NUMBERS);
    const tile = `${number}${suit}`;

    return [tile, tile, tile];
  }

  function createRandomSimpleMeld() {
    return Math.random() < 0.65
      ? createRandomSimpleSequence()
      : createRandomSimpleTriplet();
  }

  function createRandomSimplePair() {
    const suit = randomItem(SUITS);
    const number = randomItem(SIMPLE_NUMBERS);
    const tile = `${number}${suit}`;

    return [tile, tile];
  }

  function hasMoreThanFourSameTiles(tiles) {
    const counts = new Map();

    for (const tile of tiles) {
      const count =
        (counts.get(tile) || 0) + 1;

      if (count > 4) {
        return true;
      }

      counts.set(tile, count);
    }

    return false;
  }

	function createTanyaoCompleteHand() {
	  for (let attempt = 0; attempt < 1000; attempt += 1) {
	    const melds = [
	      createRandomSimpleMeld(),
	      createRandomSimpleMeld(),
	      createRandomSimpleMeld(),
	      createRandomSimpleMeld()
	    ];

	    const pair =
	      createRandomSimplePair();

	    const tiles = [
	      ...melds.flat(),
	      ...pair
	    ];

	    if (hasMoreThanFourSameTiles(tiles)) {
	      continue;
	    }

	    return {
	      melds,
	      pair,
	      tiles
	    };
	  }

	  throw new Error(
	    "断么九の和了形を生成できませんでした。"
	  );
	}

	function createRandomSequence() {
	  const suit = randomItem(SUITS);
	  const start =
	    randomItem([1, 2, 3, 4, 5, 6, 7]);

	  return [
	    `${start}${suit}`,
	    `${start + 1}${suit}`,
	    `${start + 2}${suit}`
	  ];
	}

	function createPinfuPair(
	  roundWind,
	  seatWind
	) {
	  const candidates = [
	    ...SUITS.flatMap(suit =>
	      [1, 2, 3, 4, 5, 6, 7, 8, 9]
	        .map(number => `${number}${suit}`)
	    ),
	    "east",
	    "south",
	    "west",
	    "north"
	  ].filter(tile =>
	    tile !== roundWind &&
	    tile !== seatWind
	  );

	  const tile =
	    randomItem(candidates);

	  return [tile, tile];
	}

	function createPinfuCompleteHand(
	  roundWind,
	  seatWind
	) {
	  for (
	    let attempt = 0;
	    attempt < 1000;
	    attempt += 1
	  ) {
	    const melds = [
	      createRandomSequence(),
	      createRandomSequence(),
	      createRandomSequence(),
	      createRandomSequence()
	    ];

	    const pair =
	      createPinfuPair(
	        roundWind,
	        seatWind
	      );

	    const tiles = [
	      ...melds.flat(),
	      ...pair
	    ];

	    if (
	      hasMoreThanFourSameTiles(tiles)
	    ) {
	      continue;
	    }

	    return {
	      melds,
	      pair,
	      tiles
	    };
	  }

	  throw new Error(
	    "平和の和了形を生成できませんでした。"
	  );
	}

	function createIipeikouCompleteHand(
	  roundWind,
	  seatWind
	) {
	  for (
	    let attempt = 0;
	    attempt < 1000;
	    attempt += 1
	  ) {
	    const repeatedSequence =
	      createRandomSequence();

	    const melds = [
	      [...repeatedSequence],
	      [...repeatedSequence],
	      createRandomSequence(),
	      createRandomSequence()
	    ];

	    const pair =
	      createPinfuPair(
	        roundWind,
	        seatWind
	      );

	    const tiles = [
	      ...melds.flat(),
	      ...pair
	    ];

	    if (
	      hasMoreThanFourSameTiles(tiles)
	    ) {
	      continue;
	    }

	    return {
	      melds,
	      pair,
	      tiles
	    };
	  }

	  throw new Error(
	    "一盃口の和了形を生成できませんでした。"
	  );
	}

	function createSanshokuDoujunCompleteHand(
	  roundWind,
	  seatWind
	) {
	  for (
	    let attempt = 0;
	    attempt < 1000;
	    attempt += 1
	  ) {
	    const start =
	      randomItem([
	        1, 2, 3, 4, 5, 6, 7
	      ]);

	    const sanshokuMelds = [
	      [
	        `${start}m`,
	        `${start + 1}m`,
	        `${start + 2}m`
	      ],
	      [
	        `${start}p`,
	        `${start + 1}p`,
	        `${start + 2}p`
	      ],
	      [
	        `${start}s`,
	        `${start + 1}s`,
	        `${start + 2}s`
	      ]
	    ];

	    const melds = [
	      ...sanshokuMelds,
	      createRandomSequence()
	    ];

	    const pair =
	      createPinfuPair(
	        roundWind,
	        seatWind
	      );

	    const tiles = [
	      ...melds.flat(),
	      ...pair
	    ];

	    if (
	      hasMoreThanFourSameTiles(tiles)
	    ) {
	      continue;
	    }

	    return {
	      melds,
	      pair,
	      tiles
	    };
	  }

	  throw new Error(
	    "三色同順の和了形を生成できませんでした。"
	  );
	}

	function createIttsuCompleteHand(
	  roundWind,
	  seatWind
	) {
	  for (
	    let attempt = 0;
	    attempt < 1000;
	    attempt += 1
	  ) {
	    const suit =
	      randomItem(SUITS);

	    const ittsuMelds = [
	      [
	        `1${suit}`,
	        `2${suit}`,
	        `3${suit}`
	      ],
	      [
	        `4${suit}`,
	        `5${suit}`,
	        `6${suit}`
	      ],
	      [
	        `7${suit}`,
	        `8${suit}`,
	        `9${suit}`
	      ]
	    ];

	    const melds = [
	      ...ittsuMelds,
	      createRandomSequence()
	    ];

	    const pair =
	      createPinfuPair(
	        roundWind,
	        seatWind
	      );

	    const tiles = [
	      ...melds.flat(),
	      ...pair
	    ];

	    if (
	      hasMoreThanFourSameTiles(tiles)
	    ) {
	      continue;
	    }

	    return {
	      melds,
	      pair,
	      tiles
	    };
	  }

	  throw new Error(
	    "一気通貫の和了形を生成できませんでした。"
	  );
	}

	function createSanshokuDoujunQuestion(
	  conditions
	) {
	  for (
	    let attempt = 0;
	    attempt < 1000;
	    attempt += 1
	  ) {
	    const roundWind =
	      randomItem([
	        "east",
	        "south"
	      ]);

	    const seatWind =
	      resolveSeatWind(
	        conditions.playerType
	      );

	    const handStructure =
	      createSanshokuDoujunCompleteHand(
	        roundWind,
	        seatWind
	      );

	    const completeHand = [
	      ...handStructure.melds.flat(),
	      ...handStructure.pair
	    ];

	    const winningIndex =
	      Math.floor(
	        Math.random() *
	        completeHand.length
	      );

	    const winningTile =
	      completeHand[
	        winningIndex
	      ];

	    const concealedTiles = [
	      ...completeHand
	    ];

	    concealedTiles.splice(
	      winningIndex,
	      1
	    );

	    const question = {
	      id: "generated",
	      concealedTiles,
	      winningTile,

	      generatedStructure: {
	        melds:
	          handStructure.melds,
	        pair:
	          handStructure.pair
	      },

	      winType:
	        resolveWinType(
	          conditions.winType
	        ),

	      roundWind,
	      seatWind,

	      riichi: false,
	      menzen: true,
	      openMelds: [],
	      concealedKans: [],

	      doraIndicators: [
	        createRandomDoraIndicator()
	      ],

	      uraDoraIndicators: [
	        createRandomDoraIndicator()
	      ]
	    };

	    let answer;

	    try {
	      answer =
	        MahjongEngine
	          .calculateOpenHandAnswer(
	            question
	          );
	    } catch (error) {
	      continue;
	    }

	    const hasSanshoku =
	      answer.yaku.some(
	        yaku =>
	          yaku.name === "三色同順"
	      );

	    if (!hasSanshoku) {
	      continue;
	    }

	    return {
	      ...question,
	      answer
	    };
	  }

	  throw new Error(
	    "条件を満たす三色同順問題を生成できませんでした。"
	  );
	}

  function resolveWinType(selectedWinType) {
    if (selectedWinType === "ron") {
      return "ron";
    }

    if (selectedWinType === "tsumo") {
      return "tsumo";
    }

    return Math.random() < 0.5
      ? "ron"
      : "tsumo";
  }

  function resolveSeatWind(playerType) {
    if (playerType === "dealer") {
      return "east";
    }

    if (playerType === "child") {
      return randomItem([
        "south",
        "west",
        "north"
      ]);
    }

    return randomItem([
      "east",
      "south",
      "west",
      "north"
    ]);
  }

  function createTanyaoQuestion(conditions) {
    for (
      let attempt = 0;
      attempt < 500;
      attempt += 1
    ) {
      const handStructure =
		  createTanyaoCompleteHand();

		const completeHand =
		  handStructure.tiles;

      /*
       * 完成形14枚から1枚を和了牌として分離する。
       * どの牌を和了牌にするかもランダム。
       */
      const winningIndex =
        Math.floor(
          Math.random() *
          completeHand.length
        );

      const winningTile =
        completeHand[winningIndex];

      const concealedTiles =
        completeHand.filter(
          (_, index) =>
            index !== winningIndex
        );

		const question = {
		  id: "generated",
		  concealedTiles,
		  winningTile,

		  generatedStructure: {
		    melds: handStructure.melds,
		    pair: handStructure.pair
		  },
        
        winType:
          resolveWinType(
            conditions.winType
          ),
        roundWind:
          randomItem([
            "east",
            "south"
          ]),
        seatWind:
          resolveSeatWind(
            conditions.playerType
          ),
		riichi: false,
		menzen: true,
		openMelds: [],
		concealedKans: [],

		doraIndicators: [
		  createRandomDoraIndicator()
		],

		uraDoraIndicators: [
		  createRandomDoraIndicator()
		]
      };

      let answer;

      try {
        answer =
          MahjongEngine
            .calculateOpenHandAnswer(
              question
            );
      } catch (error) {
        continue;
      }

      const hasTanyao =
        answer.yaku.some(
          yaku =>
            yaku.name === "断么九"
        );

      /*
       * ランダム生成結果をEngineで検証する。
       * 実際に断么九が成立した場合だけ採用候補にする。
       */
      if (!hasTanyao) {
        continue;
      }

      return {
        ...question,
        answer
      };
    }

    throw new Error(
      "条件を満たす断么九問題を生成できませんでした。"
    );
  }

	function createPinfuQuestion(conditions) {
	  for (
	    let attempt = 0;
	    attempt < 1000;
	    attempt += 1
	  ) {
	    const roundWind =
	      randomItem([
	        "east",
	        "south"
	      ]);

	    const seatWind =
	      resolveSeatWind(
	        conditions.playerType
	      );

	    const handStructure =
	      createPinfuCompleteHand(
	        roundWind,
	        seatWind
	      );

	    /*
	     * 平和は両面待ちにする必要があるため、
	     * 4つの順子のいずれかから和了牌候補を選ぶ。
	     */
	    const meldIndex =
	      Math.floor(
	        Math.random() *
	        handStructure.melds.length
	      );

	    const winningMeld =
	      handStructure.melds[
	        meldIndex
	      ];

	    /*
	     * 順子の中央牌を和了牌にすると嵌張になるため、
	     * 両端のどちらかだけを候補にする。
	     */
	    const winningTile =
	      Math.random() < 0.5
	        ? winningMeld[0]
	        : winningMeld[2];

	    /*
	     * 123の3、789の7は辺張になるので除外する。
	     */
	    const firstNumber =
	      Number(winningMeld[0][0]);

	    if (
	      (firstNumber === 1 &&
	        winningTile === winningMeld[2]) ||
	      (firstNumber === 7 &&
	        winningTile === winningMeld[0])
	    ) {
	      continue;
	    }

	    const completeHand = [
	      ...handStructure.melds.flat(),
	      ...handStructure.pair
	    ];

	    const winningIndex =
	      completeHand.indexOf(
	        winningTile
	      );

	    if (winningIndex < 0) {
	      continue;
	    }

	    const concealedTiles = [
	      ...completeHand
	    ];

	    concealedTiles.splice(
	      winningIndex,
	      1
	    );

	    const question = {
	      id: "generated",
	      concealedTiles,
	      winningTile,

	      generatedStructure: {
	        melds:
	          handStructure.melds,
	        pair:
	          handStructure.pair
	      },

	      winType:
	        resolveWinType(
	          conditions.winType
	        ),

	      roundWind,
	      seatWind,

	      riichi: false,
	      menzen: true,
	      openMelds: [],
	      concealedKans: [],

	      doraIndicators: [
	        createRandomDoraIndicator()
	      ],

	      uraDoraIndicators: [
	        createRandomDoraIndicator()
	      ]
	    };

	    let answer;

	    try {
	      answer =
	        MahjongEngine
	          .calculateOpenHandAnswer(
	            question
	          );
	    } catch (error) {
	      continue;
	    }

	    const hasPinfu =
	      answer.yaku.some(
	        yaku =>
	          yaku.name === "平和"
	      );

	    /*
	     * 最終的な正否はEngineで判定する。
	     */
	    if (!hasPinfu) {
	      continue;
	    }

	    return {
	      ...question,
	      answer
	    };
	  }

	  throw new Error(
	    "条件を満たす平和問題を生成できませんでした。"
	  );
	}

	function createIipeikouQuestion(
	  conditions
	) {
	  for (
	    let attempt = 0;
	    attempt < 1000;
	    attempt += 1
	  ) {
	    const roundWind =
	      randomItem([
	        "east",
	        "south"
	      ]);

	    const seatWind =
	      resolveSeatWind(
	        conditions.playerType
	      );

	    const handStructure =
	      createIipeikouCompleteHand(
	        roundWind,
	        seatWind
	      );

	    const completeHand = [
	      ...handStructure.melds.flat(),
	      ...handStructure.pair
	    ];

	    const winningIndex =
	      Math.floor(
	        Math.random() *
	        completeHand.length
	      );

	    const winningTile =
	      completeHand[
	        winningIndex
	      ];

	    const concealedTiles = [
	      ...completeHand
	    ];

	    concealedTiles.splice(
	      winningIndex,
	      1
	    );

	    const question = {
	      id: "generated",
	      concealedTiles,
	      winningTile,

	      generatedStructure: {
	        melds:
	          handStructure.melds,
	        pair:
	          handStructure.pair
	      },

	      winType:
	        resolveWinType(
	          conditions.winType
	        ),

	      roundWind,
	      seatWind,

	      riichi: false,
	      menzen: true,
	      openMelds: [],
	      concealedKans: [],

	      doraIndicators: [
	        createRandomDoraIndicator()
	      ],

	      uraDoraIndicators: [
	        createRandomDoraIndicator()
	      ]
	    };

	    let answer;

	    try {
	      answer =
	        MahjongEngine
	          .calculateOpenHandAnswer(
	            question
	          );
	    } catch (error) {
	      continue;
	    }

	    const hasIipeikou =
	      answer.yaku.some(
	        yaku =>
	          yaku.name === "一盃口"
	      );

	    if (!hasIipeikou) {
	      continue;
	    }

	    return {
	      ...question,
	      answer
	    };
	  }

	  throw new Error(
	    "条件を満たす一盃口問題を生成できませんでした。"
	  );
	}

	function createIttsuQuestion(
	  conditions
	) {
	  for (
	    let attempt = 0;
	    attempt < 1000;
	    attempt += 1
	  ) {
	    const roundWind =
	      randomItem([
	        "east",
	        "south"
	      ]);

	    const seatWind =
	      resolveSeatWind(
	        conditions.playerType
	      );

	    const handStructure =
	      createIttsuCompleteHand(
	        roundWind,
	        seatWind
	      );

	    const completeHand = [
	      ...handStructure.melds.flat(),
	      ...handStructure.pair
	    ];

	    const winningIndex =
	      Math.floor(
	        Math.random() *
	        completeHand.length
	      );

	    const winningTile =
	      completeHand[
	        winningIndex
	      ];

	    const concealedTiles = [
	      ...completeHand
	    ];

	    concealedTiles.splice(
	      winningIndex,
	      1
	    );

	    const question = {
	      id: "generated",
	      concealedTiles,
	      winningTile,

	      generatedStructure: {
	        melds:
	          handStructure.melds,
	        pair:
	          handStructure.pair
	      },

	      winType:
	        resolveWinType(
	          conditions.winType
	        ),

	      roundWind,
	      seatWind,

	      riichi: false,
	      menzen: true,
	      openMelds: [],
	      concealedKans: [],

	      doraIndicators: [
	        createRandomDoraIndicator()
	      ],

	      uraDoraIndicators: [
	        createRandomDoraIndicator()
	      ]
	    };

	    let answer;

	    try {
	      answer =
	        MahjongEngine
	          .calculateOpenHandAnswer(
	            question
	          );
	    } catch (error) {
	      continue;
	    }

	    const hasIttsu =
	      answer.yaku.some(
	        yaku =>
	          yaku.name === "一気通貫"
	      );

	    if (!hasIttsu) {
	      continue;
	    }

	    return {
	      ...question,
	      answer
	    };
	  }

	  throw new Error(
	    "条件を満たす一気通貫問題を生成できませんでした。"
	  );
	}

  function formatTileList(tiles) {
    return tiles.join(" ");
  }

  function formatYaku(answer) {
    return answer.yaku
      .map(
        yaku =>
          `${yaku.name} ${yaku.han}翻`
      )
      .join(" / ");
  }

	function formatGeneratedStructure(question) {
	  const structure =
	    question.generatedStructure;

	  if (!structure) {
	    return formatTileList(
	      question.concealedTiles
	    );
	  }

	  const meldTexts =
	    structure.melds.map(
	      meld => meld.join(" ")
	    );

	  const pairText =
	    structure.pair.join(" ");

	  return [
	    ...meldTexts,
	    pairText
	  ]
	    .map(group => `[ ${group} ]`)
	    .join("　");
	}

  function displayGeneratedQuestion(question) {
    const container =
      document.getElementById(
        "generatedQuestion"
      );

    container.innerHTML = `
      <dl class="condition-summary">
        <dt>手牌</dt>
        <dd>
			${formatGeneratedStructure(
			  question
			)}
        </dd>

        <dt>和了牌</dt>
        <dd>${question.winningTile}</dd>

        <dt>和了方法</dt>
        <dd>
          ${
            question.winType === "ron"
              ? "ロン"
              : "ツモ"
          }
        </dd>

        <dt>自風</dt>
        <dd>${question.seatWind}</dd>

        <dt>場風</dt>
        <dd>${question.roundWind}</dd>

        <dt>役</dt>
        <dd>
          ${formatYaku(question.answer)}
        </dd>

        <dt>符</dt>
        <dd>${question.answer.fu}符</dd>

        <dt>翻</dt>
        <dd>
          ${question.answer.totalHan}翻
        </dd>

        <dt>点数</dt>
        <dd>
          ${question.answer.score.pointText}
        </dd>
      </dl>
    `;

    document.getElementById(
      "retryButton"
    ).disabled = false;

    document.getElementById(
      "acceptButton"
    ).disabled = false;
  }

	function renderAcceptedQuestions() {
	  const container =
	    document.getElementById(
	      "acceptedQuestionList"
	    );

	  const exportButton =
	    document.getElementById(
	      "exportButton"
	    );

	  if (acceptedQuestions.length === 0) {
	    container.innerHTML =
	      "<p>採用した問題はまだありません。</p>";

	    exportButton.disabled = true;
	    return;
	  }

	  container.innerHTML =
	    acceptedQuestions
	      .map((question, index) => {
	        const yakuText =
	          formatYaku(question.answer);

	        return `
	          <div class="accepted-question-item">
	            <div class="accepted-question-info">
	              <strong>
	                問題 ${index + 1}
	              </strong>

	              <div>
	                手牌：
	                ${formatGeneratedStructure(
	                  question
	                )}
	              </div>

	              <div>
	                和了牌：
	                ${question.winningTile}
	              </div>

	              <div>
	                役：
	                ${yakuText}
	              </div>

	              <div>
	                ${question.answer.fu}符
	                ${question.answer.totalHan}翻
	                /
	                ${question.answer.score.pointText}
	              </div>
	            </div>

	            <div class="accepted-question-actions">
	              <button
	                type="button"
	                class="move-question-button"
	                data-action="up"
	                data-index="${index}"
	                ${index === 0 ? "disabled" : ""}
	              >
	                ↑ 上へ
	              </button>

	              <button
	                type="button"
	                class="move-question-button"
	                data-action="down"
	                data-index="${index}"
	                ${
	                  index === acceptedQuestions.length - 1
	                    ? "disabled"
	                    : ""
	                }
	              >
	                ↓ 下へ
	              </button>

	              <button
	                type="button"
	                class="delete-question-button"
	                data-index="${index}"
	              >
	                削除
	              </button>
	            </div>
	          </div>
	        `;
	      })
	      .join("");

	  container
	    .querySelectorAll(
	      ".move-question-button"
	    )
	    .forEach(button => {
	      button.addEventListener(
	        "click",
	        () => {
	          const index =
	            Number(button.dataset.index);

	          const direction =
	            button.dataset.action;

	          moveAcceptedQuestion(
	            index,
	            direction
	          );
	        }
	      );
	    });

	  container
	    .querySelectorAll(
	      ".delete-question-button"
	    )
	    .forEach(button => {
	      button.addEventListener(
	        "click",
	        () => {
	          const index =
	            Number(button.dataset.index);

	          deleteAcceptedQuestion(index);
	        }
	      );
	    });

	  exportButton.disabled = false;
	}

	function moveAcceptedQuestion(
	  index,
	  direction
	) {
	  if (
	    !Number.isInteger(index) ||
	    index < 0 ||
	    index >= acceptedQuestions.length
	  ) {
	    return;
	  }

	  const targetIndex =
	    direction === "up"
	      ? index - 1
	      : index + 1;

	  if (
	    targetIndex < 0 ||
	    targetIndex >= acceptedQuestions.length
	  ) {
	    return;
	  }

	  [
	    acceptedQuestions[index],
	    acceptedQuestions[targetIndex]
	  ] = [
	    acceptedQuestions[targetIndex],
	    acceptedQuestions[index]
	  ];

	  renderAcceptedQuestions();
	}

	function acceptCurrentQuestion() {
	  if (!currentGeneratedQuestion) {
	    return;
	  }

	  acceptedQuestions.push(
	    structuredClone(
	      currentGeneratedQuestion
	    )
	  );

	  renderAcceptedQuestions();

	  console.info(
	    "問題を採用しました。",
	    currentGeneratedQuestion
	  );
	}

	function deleteAcceptedQuestion(index) {
	  if (
	    !Number.isInteger(index) ||
	    index < 0 ||
	    index >= acceptedQuestions.length
	  ) {
	    return;
	  }

	  acceptedQuestions.splice(
	    index,
	    1
	  );

	  renderAcceptedQuestions();
	}

	function getWaitTypeForExport(question) {
	  const winningPlacement =
	    question.answer?.winningPlacement;

	  if (!winningPlacement) {
	    return "未分類";
	  }

	  if (winningPlacement.type === "pair") {
	    return "単騎";
	  }

	  const meld =
	    winningPlacement.meld;

	  if (!meld) {
	    return "未分類";
	  }

	  if (meld.type === "pon") {
	    return "双碰";
	  }

	  if (meld.type !== "chi") {
	    return "未分類";
	  }

	  const winningTile =
	    question.winningTile;

	  const sortedTiles =
	    [...meld.tiles].sort(
	      (left, right) =>
	        Number(left[0]) -
	        Number(right[0])
	    );

	  const winningIndex =
	    sortedTiles.indexOf(
	      winningTile
	    );

	  const firstNumber =
	    Number(sortedTiles[0][0]);

	  // 嵌張
	  if (winningIndex === 1) {
	    return "嵌張";
	  }

	  // 12 + 3
	  if (
	    firstNumber === 1 &&
	    winningIndex === 2
	  ) {
	    return "辺張";
	  }

	  // 89 + 7
	  if (
	    firstNumber === 7 &&
	    winningIndex === 0
	  ) {
	    return "辺張";
	  }

	  return "両面";
	}

	function createManagement(question) {
	  return {
	    fu: question.answer.fu,

	    han:
	      question.answer.totalHan,

	    scoreCategory:
	      question.answer.score.category,

	    playerType:
	      question.seatWind === "east"
	        ? "親"
	        : "子",

	    winType:
	      question.winType === "ron"
	        ? "ロン"
	        : "ツモ",

	    waitType:
	      getWaitTypeForExport(question),

	    mainYaku:
	      question.answer.yaku.map(
	        yaku => yaku.name
	      ),

	    kiriageMangan:
	      question.answer.score
	        .kiriageMangan
	  };
	}

	function createExportQuestion(
	  question,
	  index
	) {
	  const exportQuestion =
	    structuredClone(question);

	  /*
	   * 出力前に、Engine内部情報を使って
	   * managementを生成する。
	   */
	  exportQuestion.management =
	    createManagement(question);

	  /*
	   * 既存questions.jsに存在しない
	   * 作成ツール・Engine内部情報を削除。
	   */
	  delete exportQuestion.generatedStructure;

	  if (exportQuestion.answer) {
	    delete exportQuestion.answer
	      .decomposition;

	    delete exportQuestion.answer
	      .winningPlacement;
	  }

	  /*
	   * 通常問題では空のconcealedKansは
	   * 既存questions.jsに出力しない。
	   */
	  if (
	    Array.isArray(
	      exportQuestion.concealedKans
	    ) &&
	    exportQuestion.concealedKans
	      .length === 0
	  ) {
	    delete exportQuestion
	      .concealedKans;
	  }

		/*
		 * score.displayを既存形式に合わせる。
		 */
		if (exportQuestion.answer?.score) {
		  const score =
		    exportQuestion.answer.score;

		  if (score.category === "通常") {
		    score.display =
		      score.pointText;
		  } else {
		    score.display =
		      `${score.category}（${score.pointText}）`;
		  }
		}

	  /*
	   * 問題ID
	   */
	  exportQuestion.id =
	    `q${String(
	      index + 127
	    ).padStart(3, "0")}`;

	  return exportQuestion;
	}

	function exportAcceptedQuestions() {
	  if (acceptedQuestions.length === 0) {
	    return;
	  }

	  const exportQuestions =
	    acceptedQuestions.map(
	      (question, index) =>
	        createExportQuestion(
	          question,
	          index
	        )
	    );

	  const output =
	    JSON.stringify(
	      exportQuestions,
	      null,
	      2
	    );

	  document.getElementById(
	    "exportOutput"
	  ).textContent = output;

	  console.info(
	    "questions.js形式で出力しました。",
	    exportQuestions
	  );
	}

  function generateQuestion() {
    const conditions =
      getSelectedConditions();

    try {
		if (
			  conditions.handType === "open"
			) 
			{
			throw new Error(
		    	"現在は門前問題のみ生成できます。"
		  	);
		}

		if (
		  conditions.kanType ===
		    "concealed" ||
		  conditions.kanType === "open"
		) {
		  throw new Error(
		    "現在は槓なし問題のみ生成できます。"
		  );
		}

      if (
		  conditions.targetYaku ===
		  "tanyao"
		) {
		  currentGeneratedQuestion =
		    createTanyaoQuestion(
		      conditions
		    );
		} else if (
		  conditions.targetYaku ===
		  "pinfu"
		) {
		  currentGeneratedQuestion =
		    createPinfuQuestion(
		      conditions
		    );
		} else if (
		  conditions.targetYaku ===
		  "iipeikou"
		) {
		  currentGeneratedQuestion =
		    createIipeikouQuestion(
		      conditions
		    );
		} else if (
		  conditions.targetYaku ===
		  "sanshoku"
		) {
		  currentGeneratedQuestion =
		    createSanshokuDoujunQuestion(
		      conditions
		    );
		} else if (
		  conditions.targetYaku ===
		  "ittsu"
		) {
		  currentGeneratedQuestion =
		    createIttsuQuestion(
		      conditions
		    );
		} else {
		  throw new Error(
		    "現在対応していない役です。"
		  );
		}

      console.log(
        "生成問題:",
        currentGeneratedQuestion
      );

      displayGeneratedQuestion(
        currentGeneratedQuestion
      );
    } catch (error) {
      currentGeneratedQuestion = null;

      document.getElementById(
        "generatedQuestion"
      ).innerHTML =
        `<p>${error.message}</p>`;

      document.getElementById(
        "retryButton"
      ).disabled = true;

      document.getElementById(
        "acceptButton"
      ).disabled = true;

      console.error(error);
    }
  }

  function initializeQuestionGenerator() {
    document.getElementById(
      "generateButton"
    ).addEventListener(
      "click",
      generateQuestion
    );

    document.getElementById(
      "retryButton"
    ).addEventListener(
      "click",
      generateQuestion
    );

	document.getElementById(
	  "acceptButton"
	).addEventListener(
	  "click",
	  acceptCurrentQuestion
	);

	document.getElementById(
	  "exportButton"
	).addEventListener(
	  "click",
	  exportAcceptedQuestions
	);

    console.info(
      "麻雀問題作成ツールを初期化しました。"
    );

    console.info(
      "MahjongEngine:",
      window.MahjongEngine
    );
  }

  initializeQuestionGenerator();
})();