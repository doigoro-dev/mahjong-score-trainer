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
    isSimpleTile
  };
})();