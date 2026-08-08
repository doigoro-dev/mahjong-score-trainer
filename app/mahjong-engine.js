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
	getSequenceSignature
  };
})();