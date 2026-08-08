(() => {
  "use strict";

  const HONOR_TILE_CODES = new Set([
    "east",
    "south",
    "west",
    "north",
    "white",
    "green",
    "red"
  ]);

	const DRAGON_TILES = new Set([
	  "white",
	  "green",
	  "red"
	]);

	const WIND_LABELS = {
	  east: "東",
	  south: "南",
	  west: "西",
	  north: "北"
	};

	const HONOR_TILE_LABELS = {
	  east: "東",
	  south: "南",
	  west: "西",
	  north: "北",
	  white: "白",
	  green: "發",
	  red: "中"
	};

  const TERMINAL_NUMBERS = new Set([1, 9]);

  function normalizeConcealedKanTileCode(concealedKan, index) {
    if (typeof concealedKan === "string") {
      return concealedKan;
    }

    if (
      concealedKan &&
      typeof concealedKan === "object" &&
      typeof concealedKan.tile === "string"
    ) {
      return concealedKan.tile;
    }

    throw new Error(
      `concealedKans[${index}]には牌コード、または { tile: 牌コード } を指定してください。`
    );
  }

  function normalizeOpenMeld(openMeld, index) {
    const allowedTypes = new Set(["chi", "pon", "kan-open"]);

    if (!openMeld || typeof openMeld !== "object") {
      throw new Error(
        `openMelds[${index}]には副露オブジェクトを指定してください。`
      );
    }

    if (!allowedTypes.has(openMeld.type)) {
      throw new Error(
        `openMelds[${index}].typeはchi、pon、kan-openのいずれかを指定してください。`
      );
    }

    const expectedTileCount = openMeld.type === "kan-open" ? 4 : 3;

    if (
      !Array.isArray(openMeld.tiles) ||
      openMeld.tiles.length !== expectedTileCount
    ) {
      throw new Error(
        `openMelds[${index}].tilesには${expectedTileCount}枚の牌を指定してください。`
      );
    }

    return {
      type: openMeld.type,
      tiles: [...openMeld.tiles]
    };
  }

  function getAllMelds(question) {
    if (!question || typeof question !== "object") {
      throw new Error("問題データにはオブジェクトを指定してください。");
    }

    const concealedKans = Array.isArray(question.concealedKans)
      ? question.concealedKans
      : [];

    const openMelds = Array.isArray(question.openMelds)
      ? question.openMelds
      : [];

    const normalizedConcealedKans = concealedKans.map(
      (concealedKan, index) => {
        const tileCode = normalizeConcealedKanTileCode(
          concealedKan,
          index
        );

        return {
          type: "kan-concealed",
          tiles: [tileCode, tileCode, tileCode, tileCode],
          isOpen: false
        };
      }
    );

    const normalizedOpenMelds = openMelds.map(
      (openMeld, index) => ({
        ...normalizeOpenMeld(openMeld, index),
        isOpen: true
      })
    );

    return [
      ...normalizedConcealedKans,
      ...normalizedOpenMelds
    ];
  }

  function getAllTiles(question) {
    if (!question || typeof question !== "object") {
      throw new Error("問題データにはオブジェクトを指定してください。");
    }

    if (!Array.isArray(question.concealedTiles)) {
      throw new Error("concealedTilesには配列を指定してください。");
    }

    const tiles = [...question.concealedTiles];

    if (
      typeof question.winningTile === "string" &&
      question.winningTile.trim() !== ""
    ) {
      tiles.push(question.winningTile);
    }

    for (const meld of getAllMelds(question)) {
      tiles.push(...meld.tiles);
    }

    return tiles;
  }

  function getStructuralTileCount(question) {
    if (!question || !Array.isArray(question.concealedTiles)) {
      return 0;
    }

    return (
      question.concealedTiles.length +
      getAllMelds(question).length * 3
    );
  }

  function isMenzen(question) {
    return getAllMelds(question).every(
      meld => !meld.isOpen
    );
  }

  function isHonorTile(tileCode) {
    return HONOR_TILE_CODES.has(tileCode);
  }

  function parseSuitedTile(tileCode) {
    const match = /^(\d)([mps])$/.exec(tileCode);

    if (!match) {
      return null;
    }

    return {
      number: Number(match[1]),
      suit: match[2]
    };
  }

  function isTerminalTile(tileCode) {
    const tile = parseSuitedTile(tileCode);

    return Boolean(
      tile &&
      TERMINAL_NUMBERS.has(tile.number)
    );
  }

  function isTerminalOrHonor(tileCode) {
    return (
      isHonorTile(tileCode) ||
      isTerminalTile(tileCode)
    );
  }

  function isSimpleTile(tileCode) {
    const tile = parseSuitedTile(tileCode);

    return Boolean(
      tile &&
      tile.number >= 2 &&
      tile.number <= 8
    );
  }

	function getTileSortValue(tileCode) {
	  const suitedTile = /^([1-9])([mps])$/.exec(tileCode);

	  if (suitedTile) {
	    const number = Number(suitedTile[1]);
	    const suit = suitedTile[2];
	    const suitOrder = { m: 0, p: 1, s: 2 };

	    return suitOrder[suit] * 10 + number;
	  }

	  const honorOrder = {
	    east: 31,
	    south: 32,
	    west: 33,
	    north: 34,
	    white: 35,
	    green: 36,
	    red: 37
	  };

	  return honorOrder[tileCode] ?? 999;
	}

	function sortTilesForDisplay(tileCodes) {
	  return [...tileCodes].sort(
	    (left, right) => getTileSortValue(left) - getTileSortValue(right)
	  );
	}

	function cloneTileCounts(tileCodes) {
	  const counts = new Map();

	  for (const tileCode of tileCodes) {
	    counts.set(
	      tileCode,
	      (counts.get(tileCode) || 0) + 1
	    );
	  }

	  return counts;
	}

	function getFirstRemainingTile(counts) {
	  return [...counts.keys()]
	    .filter(
	      tileCode => (counts.get(tileCode) || 0) > 0
	    )
	    .sort(
	      (left, right) =>
	        getTileSortValue(left) -
	        getTileSortValue(right)
	    )[0] || null;
	}

	function removeTilesFromCounts(counts, tileCodes) {
	  for (const tileCode of tileCodes) {
	    const count = counts.get(tileCode) || 0;

	    if (count <= 0) {
	      return false;
	    }

	    counts.set(tileCode, count - 1);
	  }

	  return true;
	}

	function addTilesToCounts(counts, tileCodes) {
	  for (const tileCode of tileCodes) {
	    counts.set(
	      tileCode,
	      (counts.get(tileCode) || 0) + 1
	    );
	  }
	}

	function findConcealedHandDecompositions(question) {
	  const fixedMeldCount = getAllMelds(question).length;
	  const neededMeldCount = 4 - fixedMeldCount;

	  if (neededMeldCount < 0) {
	    return [];
	  }

	  const concealedWinningTiles = [
	    ...(question.concealedTiles || []),
	    question.winningTile
	  ];

	  const counts = cloneTileCounts(
	    concealedWinningTiles
	  );

	  const decompositions = [];

	  const pairCandidates = [...counts.entries()]
	    .filter(([, count]) => count >= 2)
	    .map(([tileCode]) => tileCode)
	    .sort(
	      (left, right) =>
	        getTileSortValue(left) -
	        getTileSortValue(right)
	    );

	  for (const pairTile of pairCandidates) {
	    removeTilesFromCounts(
	      counts,
	      [pairTile, pairTile]
	    );

	    const melds = [];

	    const search = () => {
	      const firstTile =
	        getFirstRemainingTile(counts);

	      if (!firstTile) {
	        if (melds.length === neededMeldCount) {
	          decompositions.push({
	            pairTile,
	            concealedMelds: melds.map(
	              meld => ({
	                ...meld,
	                tiles: [...meld.tiles],
	                isOpen: false
	              })
	            )
	          });
	        }

	        return;
	      }

	      if (melds.length >= neededMeldCount) {
	        return;
	      }

	      if ((counts.get(firstTile) || 0) >= 3) {
	        const tripletTiles = [
	          firstTile,
	          firstTile,
	          firstTile
	        ];

	        removeTilesFromCounts(
	          counts,
	          tripletTiles
	        );

	        melds.push({
	          type: "pon",
	          tiles: tripletTiles
	        });

	        search();

	        melds.pop();

	        addTilesToCounts(
	          counts,
	          tripletTiles
	        );
	      }

	      const parsed =
	        parseSuitedTile(firstTile);

	      if (parsed && parsed.number <= 7) {
	        const sequenceTiles = [
	          firstTile,
	          `${parsed.number + 1}${parsed.suit}`,
	          `${parsed.number + 2}${parsed.suit}`
	        ];

	        if (
	          sequenceTiles.every(
	            tileCode =>
	              (counts.get(tileCode) || 0) > 0
	          )
	        ) {
	          removeTilesFromCounts(
	            counts,
	            sequenceTiles
	          );

	          melds.push({
	            type: "chi",
	            tiles: sequenceTiles
	          });

	          search();

	          melds.pop();

	          addTilesToCounts(
	            counts,
	            sequenceTiles
	          );
	        }
	      }
	    };

	    search();

	    addTilesToCounts(
	      counts,
	      [pairTile, pairTile]
	    );
	  }

	  return decompositions;
	}

	function getMeldBaseTile(meld) {
	  return meld.tiles[0];
	}

	function isSequenceMeld(meld) {
	  return meld.type === "chi";
	}

	function isTripletMeld(meld) {
	  return meld.type === "pon";
	}

	function isKanMeld(meld) {
	  return (
	    meld.type === "kan-open" ||
	    meld.type === "kan-concealed"
	  );
	}

	function getSequenceSignature(meld) {
	  if (!isSequenceMeld(meld)) {
	    return null;
	  }

	  const sorted =
	    sortTilesForDisplay(meld.tiles);

	  const first =
	    parseSuitedTile(sorted[0]);

	  return first
	    ? `${first.number}${first.suit}`
	    : null;
	}

	function getValuePairFu(question, pairTile) {
	  let fu = 0;

	  if (DRAGON_TILES.has(pairTile)) {
	    fu += 2;
	  }

	  if (pairTile === question.roundWind) {
	    fu += 2;
	  }

	  if (pairTile === question.seatWind) {
	    fu += 2;
	  }

	  return fu;
	}

	function getWaitFu(question, decomposition) {
	  const winningTile = question.winningTile;

	  if (decomposition.pairTile === winningTile) {
	    return 2;
	  }

	  for (const meld of decomposition.concealedMelds) {
	    if (
	      !isSequenceMeld(meld) ||
	      !meld.tiles.includes(winningTile)
	    ) {
	      continue;
	    }

	    const sorted = sortTilesForDisplay(meld.tiles);
	    const winningIndex = sorted.indexOf(winningTile);
	    const first = parseSuitedTile(sorted[0]);

	    if (!first) {
	      continue;
	    }

	    if (winningIndex === 1) {
	      return 2;
	    }

	    if (first.number === 1 && winningIndex === 2) {
	      return 2;
	    }

	    if (first.number === 7 && winningIndex === 0) {
	      return 2;
	    }
	  }

	  return 0;
	}

	function getMeldFu(question, meld, decomposition) {
	  if (isSequenceMeld(meld)) {
	    return 0;
	  }

	  const terminalOrHonor =
	    isTerminalOrHonor(getMeldBaseTile(meld));

	  let openForFu = meld.isOpen;

	  if (
	    question.winType === "ron" &&
	    !meld.isOpen &&
	    isTripletMeld(meld) &&
	    meld.tiles.includes(question.winningTile)
	  ) {
	    openForFu = true;
	  }

	  if (isKanMeld(meld)) {
	    if (openForFu) {
	      return terminalOrHonor ? 16 : 8;
	    }

	    return terminalOrHonor ? 32 : 16;
	  }

	  if (openForFu) {
	    return terminalOrHonor ? 4 : 2;
	  }

	  return terminalOrHonor ? 8 : 4;
	}

	function countConcealedTriplets(question, melds) {
	  return melds.filter(meld => {
	    if (
	      isSequenceMeld(meld) ||
	      meld.isOpen
	    ) {
	      return false;
	    }

	    if (
	      question.winType === "ron" &&
	      isTripletMeld(meld) &&
	      meld.tiles.includes(question.winningTile)
	    ) {
	      return false;
	    }

	    return true;
	  }).length;
	}

	function getTileSuitSet(tileCodes) {
	  const suits = new Set();
	  let hasHonor = false;

	  for (const tileCode of tileCodes) {
	    const parsed = parseSuitedTile(tileCode);

	    if (parsed) {
	      suits.add(parsed.suit);
	    } else if (isHonorTile(tileCode)) {
	      hasHonor = true;
	    }
	  }

	  return {
	    suits,
	    hasHonor
	  };
	}

	function createYaku(name, han) {
	  return {
	    name,
	    han
	  };
	}

	function detectOpenHandYaku(question, decomposition) {
	  const fixedMelds = getAllMelds(question);

	  const melds = [
	    ...decomposition.concealedMelds,
	    ...fixedMelds
	  ];

	  const allTiles = getAllTiles(question);
	  const yaku = [];
	  const menzen = isMenzen(question);

	  if (allTiles.every(isSimpleTile)) {
	    yaku.push(
	      createYaku("断么九", 1)
	    );
	  }

	  const tripletLikeMelds =
	    melds.filter(
	      meld => !isSequenceMeld(meld)
	    );

	  const tripletTiles = new Set(
	    tripletLikeMelds.map(getMeldBaseTile)
	  );

	  const valueHonorDefinitions = [
	    ["white", "役牌 白"],
	    ["green", "役牌 發"],
	    ["red", "役牌 中"],
	    [
	      question.roundWind,
	      `場風（${WIND_LABELS[question.roundWind]}）`
	    ],
	    [
	      question.seatWind,
	      `自風（${WIND_LABELS[question.seatWind]}）`
	    ]
	  ];

	  for (const [tileCode, name] of valueHonorDefinitions) {
	    if (tripletTiles.has(tileCode)) {
	      yaku.push(
	        createYaku(name, 1)
	      );
	    }
	  }

	  if (
	    melds.every(
	      meld => !isSequenceMeld(meld)
	    )
	  ) {
	    yaku.push(
	      createYaku("対々和", 2)
	    );
	  }

	  if (
	    countConcealedTriplets(question, melds) >= 3
	  ) {
	    yaku.push(
	      createYaku("三暗刻", 2)
	    );
	  }

	  if (
	    melds.filter(isKanMeld).length >= 3
	  ) {
	    yaku.push(
	      createYaku("三槓子", 2)
	    );
	  }

	  for (
	    const number of
	      Array.from(
	        { length: 9 },
	        (_, index) => index + 1
	      )
	  ) {
	    if (
	      ["m", "p", "s"].every(
	        suit =>
	          tripletTiles.has(
	            `${number}${suit}`
	          )
	      )
	    ) {
	      yaku.push(
	        createYaku("三色同刻", 2)
	      );
	      break;
	    }
	  }

	  const sequenceSignatures =
	    new Set(
	      melds
	        .map(getSequenceSignature)
	        .filter(Boolean)
	    );

	  for (let start = 1; start <= 7; start += 1) {
	    if (
	      ["m", "p", "s"].every(
	        suit =>
	          sequenceSignatures.has(
	            `${start}${suit}`
	          )
	      )
	    ) {
	      yaku.push(
	        createYaku(
	          "三色同順",
	          menzen ? 2 : 1
	        )
	      );
	      break;
	    }
	  }

	  for (const suit of ["m", "p", "s"]) {
	    if (
	      [1, 4, 7].every(
	        start =>
	          sequenceSignatures.has(
	            `${start}${suit}`
	          )
	      )
	    ) {
	      yaku.push(
	        createYaku(
	          "一気通貫",
	          menzen ? 2 : 1
	        )
	      );
	      break;
	    }
	  }

	  const eachGroupHasTerminalOrHonor = [
	    decomposition.pairTile,
	    ...melds.map(meld => meld.tiles)
	  ].every(group => {
	    const tiles =
	      Array.isArray(group)
	        ? group
	        : [group];

	    return tiles.some(
	      isTerminalOrHonor
	    );
	  });

	  const hasSequence =
	    melds.some(isSequenceMeld);

	  const hasHonor =
	    allTiles.some(isHonorTile);

	  if (
	    eachGroupHasTerminalOrHonor &&
	    hasSequence
	  ) {
	    if (hasHonor) {
	      yaku.push(
	        createYaku(
	          "混全帯么九",
	          menzen ? 2 : 1
	        )
	      );
	    } else {
	      yaku.push(
	        createYaku(
	          "純全帯么九",
	          menzen ? 3 : 2
	        )
	      );
	    }
	  }

	  if (
	    allTiles.every(
	      isTerminalOrHonor
	    )
	  ) {
	    yaku.push(
	      createYaku("混老頭", 2)
	    );
	  }

	  const dragonTripletCount =
	    ["white", "green", "red"]
	      .filter(
	        tileCode =>
	          tripletTiles.has(tileCode)
	      )
	      .length;

	  if (
	    dragonTripletCount === 2 &&
	    DRAGON_TILES.has(
	      decomposition.pairTile
	    )
	  ) {
	    yaku.push(
	      createYaku("小三元", 2)
	    );
	  }

	  const {
	    suits,
	    hasHonor: containsHonor
	  } = getTileSuitSet(allTiles);

	  if (suits.size === 1) {
	    if (containsHonor) {
	      yaku.push(
	        createYaku(
	          "混一色",
	          menzen ? 3 : 2
	        )
	      );
	    } else {
	      yaku.push(
	        createYaku(
	          "清一色",
	          menzen ? 6 : 5
	        )
	      );
	    }
	  }

	  return yaku;
	}

	function roundFuToTen(fu) {
	  return Math.ceil(fu / 10) * 10;
	}

	function calculateOpenHandFu(
	  question,
	  decomposition
	) {
	  const melds = [
	    ...decomposition.concealedMelds,
	    ...getAllMelds(question)
	  ];

	  const components = [
	    {
	      label: "副底",
	      fu: 20
	    }
	  ];

	  if (question.winType === "tsumo") {
	    components.push({
	      label: "ツモ",
	      fu: 2
	    });
	  } else if (isMenzen(question)) {
	    components.push({
	      label: "門前ロン",
	      fu: 10
	    });
	  }

	  const pairFu =
	    getValuePairFu(
	      question,
	      decomposition.pairTile
	    );

	  if (pairFu > 0) {
	    components.push({
	      label: "役牌の雀頭",
	      fu: pairFu
	    });
	  }

	  const waitFu =
	    getWaitFu(
	      question,
	      decomposition
	    );

	  if (waitFu > 0) {
	    components.push({
	      label: "待ち",
	      fu: waitFu
	    });
	  }

	  for (const meld of melds) {
	    const fu =
	      getMeldFu(
	        question,
	        meld,
	        decomposition
	      );

	    if (fu <= 0) {
	      continue;
	    }

	    const baseTile =
	      getMeldBaseTile(meld);

	    const tileLabel =
	      HONOR_TILE_LABELS[baseTile] ||
	      baseTile;

	    const meldLabel =
	      isKanMeld(meld)
	        ? (
	            meld.isOpen
	              ? "明槓"
	              : "暗槓"
	          )
	        : (
	            meld.isOpen
	              ? "明刻"
	              : "暗刻"
	          );

	    components.push({
	      label:
	        `${tileLabel}の${meldLabel}`,
	      fu
	    });
	  }

	  const rawFu =
	    components.reduce(
	      (sum, component) =>
	        sum + component.fu,
	      0
	    );

	  const isOpenPinfuShape =
	    !isMenzen(question) &&
	    question.winType === "ron" &&
	    rawFu === 20;

	  const roundedFu =
	    isOpenPinfuShape
	      ? 30
	      : roundFuToTen(rawFu);

	  const fuBreakdown =
	    components.map(
	      component =>
	        `${component.label}：${component.fu}符`
	    );

	  if (isOpenPinfuShape) {
	    fuBreakdown.push(
	      "副露した平和形のロン和了：30符固定（加算ではありません）"
	    );
	    fuBreakdown.push(
	      "最終符：30符"
	    );
	  } else if (rawFu === roundedFu) {
	    fuBreakdown.push(
	      `合計：${roundedFu}符`
	    );
	  } else {
	    fuBreakdown.push(
	      `合計：${rawFu}符 → ${roundedFu}符`
	    );
	  }

	  return {
	    fu: roundedFu,
	    fuBreakdown
	  };
	}

  window.MahjongEngine = {
    normalizeConcealedKanTileCode,
    normalizeOpenMeld,
    getAllMelds,
    getAllTiles,
    getStructuralTileCount,
    isMenzen,
    isHonorTile,
    parseSuitedTile,
    isTerminalTile,
    isTerminalOrHonor,
    isSimpleTile,
    getTileSortValue,
	sortTilesForDisplay,
	cloneTileCounts,
	getFirstRemainingTile,
	removeTilesFromCounts,
	addTilesToCounts,
	findConcealedHandDecompositions,
	getMeldBaseTile,
	isSequenceMeld,
	isTripletMeld,
	isKanMeld,
	getSequenceSignature,
	getValuePairFu,
	getWaitFu,
	getMeldFu,
	countConcealedTriplets,
	getTileSuitSet,
	createYaku,
	detectOpenHandYaku,
	roundFuToTen,
	calculateOpenHandFu
  };
})();