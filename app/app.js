const SVG_NS = "http://www.w3.org/2000/svg";

const KANJI_NUMERALS = {
  1: "一", 2: "二", 3: "三",
  4: "四", 5: "五", 6: "六",
  7: "七", 8: "八", 9: "九"
};

const HONOR_TILES = {
  east:  { label: "東", color: "#1f2937" },
  south: { label: "南", color: "#1f2937" },
  west:  { label: "西", color: "#1f2937" },
  north: { label: "北", color: "#1f2937" },
  white: { label: "白", color: "#1f2937" },
  green: { label: "發", color: "#15803d" },
  red:   { label: "中", color: "#c62828" }
};

const WIND_LABELS = {
  east: "東",
  south: "南",
  west: "西",
  north: "北"
};

const WIN_TYPE_LABELS = {
  ron: "ロン",
  tsumo: "ツモ"
};

/*
 * Ver1.1 固定問題（100問）。各問題に管理用メタデータを付与。
 * 既存108問は副露・槓子を扱わず、q109以降で暗槓問題を収録。
 * すべて門前、立直なし、ドラなし、副露なし。
 */
const questions = window.MAHJONG_QUESTIONS;

const SESSION_STORAGE_KEY = "mahjongScoreTrainerVer2_9Session";
const MODE_NORMAL = "normal";
const MODE_HAN_VARIATION = "hanVariation";
const MODE_PRACTICAL = "practical";
const PRACTICAL_STEP_RIICHI = "riichi";
const PRACTICAL_STEP_AGARI = "agari";
const PRACTICAL_STEP_DORA = "dora";
let currentQuestion = null;
let sessionOrder = [];
let currentQuestionIndex = 0;
let answerShown = false;
let currentMode = MODE_NORMAL;
let sessionVariations = {};
let timerIntervalId = null;
let timerStartedAt = 0;
let elapsedMilliseconds = 0;
let submittedAnswer = null;
let practicalStep = PRACTICAL_STEP_RIICHI;
let practicalRiichiSelected = null;
let practicalWinType = null;
let isReviewMode = false;
let reviewQuestion = null;
let reviewSessionSnapshot = null;

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }

  return element;
}

function createTileBase(label) {
  const wrapper = document.createElement("div");
  wrapper.className = "tile-wrapper";

  const svg = svgElement("svg", {
    class: "tile-svg",
    viewBox: "0 0 120 168",
    role: "img",
    "aria-label": label
  });

  svg.append(
    svgElement("rect", {
      x: "7", y: "9", width: "106", height: "152",
      rx: "12", fill: "#d8e6df"
    }),
    svgElement("rect", {
      x: "3", y: "3", width: "106", height: "152",
      rx: "12", fill: "#fffef8", stroke: "#b7c8bf",
      "stroke-width": "3"
    }),
    svgElement("path", {
      d: "M18 13 H94",
      stroke: "#ffffff",
      "stroke-width": "4",
      "stroke-linecap": "round",
      opacity: "0.95"
    })
  );

  wrapper.appendChild(svg);
  return { wrapper, svg };
}

function createText(svg, text, x, y, size, color) {
  const element = svgElement("text", {
    x: String(x),
    y: String(y),
    "text-anchor": "middle",
    "font-size": String(size),
    "font-weight": "700",
    fill: color,
    "font-family": "'Yu Mincho', 'Hiragino Mincho ProN', serif"
  });

  element.textContent = text;
  svg.appendChild(element);
}

function createManzu(number) {
  const numeral = KANJI_NUMERALS[number];
  const { wrapper, svg } = createTileBase(`${numeral}萬`);

  createText(svg, numeral, 56, 69, 50, "#1f2937");
  createText(svg, "萬", 56, 130, 48, "#c62828");

  return wrapper;
}

/*
 * 筒子は、一般的な日本麻雀牌で見慣れた配置を優先する。
 * 特に3筒と7筒は、ユーザー提供画像の配置に合わせている。
 */
const PIN_LAYOUTS = {
  1: [
    [56, 84, "blue", "large"]
  ],
  2: [
    [56, 47, "green"],
    [56, 121, "blue"]
  ],
  3: [
    [38, 43, "blue"],
    [56, 84, "red"],
    [74, 125, "blue"]
  ],
  4: [
    [38, 50, "blue"],
    [74, 50, "blue"],
    [38, 118, "blue"],
    [74, 118, "blue"]
  ],
  5: [
    [38, 43, "blue"],
    [74, 43, "blue"],
    [56, 84, "red"],
    [38, 125, "blue"],
    [74, 125, "blue"]
  ],
  6: [
    [38, 38, "green"],
    [74, 38, "green"],
    [38, 84, "green"],
    [74, 84, "green"],
    [38, 130, "red"],
    [74, 130, "red"]
  ],
  7: [
    [36, 35, "blue"],
    [56, 53, "blue"],
    [76, 71, "blue"],
    [42, 105, "red"],
    [70, 105, "red"],
    [42, 135, "red"],
    [70, 135, "red"]
  ],
  8: [
    [38, 29, "blue"],
    [74, 29, "blue"],
    [38, 66, "blue"],
    [74, 66, "blue"],
    [38, 103, "blue"],
    [74, 103, "blue"],
    [38, 140, "blue"],
    [74, 140, "blue"]
  ],
  9: [
    [35, 31, "blue"],
    [56, 31, "blue"],
    [77, 31, "blue"],
    [35, 84, "red"],
    [56, 84, "red"],
    [77, 84, "red"],
    [35, 137, "green"],
    [56, 137, "green"],
    [77, 137, "green"]
  ]
};

const PIN_PALETTE = {
  blue: {
    dark: "#111f68",
    main: "#1e3a8a",
    light: "#5b76c9"
  },
  red: {
    dark: "#9f1717",
    main: "#d32626",
    light: "#f06a61"
  },
  green: {
    dark: "#12612d",
    main: "#178447",
    light: "#54b979"
  }
};

function createPinMark(svg, cx, cy, colorName, large = false) {
  const palette = PIN_PALETTE[colorName];
  const radius = large ? 27 : 10.5;
  const group = svgElement("g", {
    transform: `translate(${cx} ${cy})`
  });

  if (large) {
    group.appendChild(svgElement("circle", {
      cx: "0", cy: "0", r: String(radius),
      fill: "#fffdf5",
      stroke: palette.dark,
      "stroke-width": "4"
    }));

    for (let angle = 0; angle < 360; angle += 30) {
      const rad = angle * Math.PI / 180;
      group.appendChild(svgElement("ellipse", {
        cx: String(Math.cos(rad) * 17),
        cy: String(Math.sin(rad) * 17),
        rx: "4.3",
        ry: "8",
        transform: `rotate(${angle + 90} ${Math.cos(rad) * 17} ${Math.sin(rad) * 17})`,
        fill: angle % 60 === 0 ? "#c62828" : palette.main
      }));
    }

    group.append(
      svgElement("circle", {
        cx: "0", cy: "0", r: "10",
        fill: "#fffdf5",
        stroke: palette.main,
        "stroke-width": "3"
      }),
      svgElement("circle", {
        cx: "0", cy: "0", r: "4",
        fill: palette.main
      })
    );
  } else {
    // 花形の縁取りで、実牌の筒子らしい見た目にする
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = angle * Math.PI / 180;
      group.appendChild(svgElement("circle", {
        cx: String(Math.cos(rad) * 6.2),
        cy: String(Math.sin(rad) * 6.2),
        r: "4.7",
        fill: palette.main,
        stroke: palette.dark,
        "stroke-width": "0.7"
      }));
    }

    group.append(
      svgElement("circle", {
        cx: "0", cy: "0", r: String(radius - 2),
        fill: palette.main,
        stroke: palette.dark,
        "stroke-width": "1.3"
      }),
      svgElement("circle", {
        cx: "0", cy: "0", r: "5.8",
        fill: "#fffdf5",
        stroke: palette.light,
        "stroke-width": "1.4"
      }),
      svgElement("circle", {
        cx: "0", cy: "0", r: "2.5",
        fill: palette.main
      })
    );

    // 内側の小さな切り込み
    for (let angle = 0; angle < 360; angle += 90) {
      const rad = angle * Math.PI / 180;
      group.appendChild(svgElement("circle", {
        cx: String(Math.cos(rad) * 4.2),
        cy: String(Math.sin(rad) * 4.2),
        r: "1.1",
        fill: palette.dark
      }));
    }
  }

  svg.appendChild(group);
}

function createPinzu(number) {
  const { wrapper, svg } = createTileBase(`${number}筒`);

  PIN_LAYOUTS[number].forEach(([cx, cy, colorName, size]) => {
    createPinMark(svg, cx, cy, colorName, size === "large");
  });

  return wrapper;
}

/*
 * 索子は、一般的な日本麻雀牌で見慣れた配置を優先する。
 * 1索は鳥、2〜9索は竹の本数と並びが直感的に分かるようにする。
 */
const SOU_LAYOUTS = {
  2: [
    [56, 49, 0, "green"],
    [56, 119, 0, "blue"]
  ],
  3: [
    [56, 37, 0, "green"],
    [38, 112, -15, "blue"],
    [74, 112, 15, "green"]
  ],
  4: [
    [38, 49, -10, "green"],
    [74, 49, 10, "blue"],
    [38, 119, 10, "blue"],
    [74, 119, -10, "green"]
  ],
  5: [
    [38, 41, -10, "green"],
    [74, 41, 10, "blue"],
    [56, 84, 0, "red"],
    [38, 127, 10, "blue"],
    [74, 127, -10, "green"]
  ],
  6: [
    [36, 50, -7, "green"],
    [56, 50, 0, "red"],
    [76, 50, 7, "blue"],
    [36, 119, 7, "blue"],
    [56, 119, 0, "green"],
    [76, 119, -7, "green"]
  ],
  7: [
    [56, 29, 0, "red"],

    [36, 82, -7, "green"],
    [56, 82, 0, "blue"],
    [76, 82, 7, "green"],

    [36, 136, 7, "blue"],
    [56, 136, 0, "green"],
    [76, 136, -7, "blue"]
  ],
  8: [
    /* 上段：|／＼| */
    [31, 49, 0, "green"],
    [48, 55, -32, "blue"],
    [64, 55, 32, "green"],
    [81, 49, 0, "blue"],

    /* 下段：|＼／| */
    [31, 119, 0, "blue"],
    [48, 113, 32, "green"],
    [64, 113, -32, "blue"],
    [81, 119, 0, "green"]
  ],
  9: [
    [36, 31, -8, "green"],
    [56, 31, 0, "red"],
    [76, 31, 8, "blue"],
    [36, 84, 8, "blue"],
    [56, 84, 0, "green"],
    [76, 84, -8, "green"],
    [36, 137, -8, "green"],
    [56, 137, 0, "red"],
    [76, 137, 8, "blue"]
  ]
};

const SOU_PALETTE = {
  green: {
    dark: "#0d642c",
    main: "#16843d",
    light: "#5ab875"
  },
  blue: {
    dark: "#14316f",
    main: "#2552a4",
    light: "#6f91d0"
  },
  red: {
    dark: "#9f1a1a",
    main: "#d12b2b",
    light: "#ef7770"
  }
};

function createBamboo(svg, x, y, rotation, colorName) {
  const palette = SOU_PALETTE[colorName];
  const group = svgElement("g", {
    transform: `translate(${x} ${y}) rotate(${rotation})`
  });

  /*
   * 竹の本体を直線に近い形で表現する。
   * 葉は数字の配置を邪魔しないよう、節付近の小さな飾りに抑える。
   */
  group.append(
    svgElement("line", {
      x1: "0", y1: "-18",
      x2: "0", y2: "18",
      stroke: palette.dark,
      "stroke-width": "8",
      "stroke-linecap": "round"
    }),
    svgElement("line", {
      x1: "0", y1: "-17",
      x2: "0", y2: "17",
      stroke: palette.main,
      "stroke-width": "5",
      "stroke-linecap": "round"
    }),

    // 上下端をわずかに尖らせる
    svgElement("path", {
      d: "M-3 -17 L0 -23 L3 -17 Z",
      fill: palette.main,
      stroke: palette.dark,
      "stroke-width": "0.8"
    }),
    svgElement("path", {
      d: "M-3 17 L0 23 L3 17 Z",
      fill: palette.main,
      stroke: palette.dark,
      "stroke-width": "0.8"
    }),

    // 竹の節
    svgElement("line", {
      x1: "-4", y1: "-6",
      x2: "4", y2: "-6",
      stroke: "#fffdf5",
      "stroke-width": "2"
    }),
    svgElement("line", {
      x1: "-4", y1: "6",
      x2: "4", y2: "6",
      stroke: "#fffdf5",
      "stroke-width": "2"
    }),

    // 小さな葉。W/Mの輪郭を隠さない大きさにする
    svgElement("path", {
      d: "M-1 -7 Q-7 -12 -7 -16 Q-2 -14 2 -9 Z",
      fill: palette.main,
      stroke: palette.dark,
      "stroke-width": "0.7"
    }),
    svgElement("path", {
      d: "M1 5 Q7 0 7 -4 Q2 -2 -2 3 Z",
      fill: colorName === "red" ? palette.main : SOU_PALETTE.blue.main,
      stroke: colorName === "red" ? palette.dark : SOU_PALETTE.blue.dark,
      "stroke-width": "0.7"
    })
  );

  svg.appendChild(group);
}

function createSouOne(svg) {
  const bird = svgElement("g", { transform: "translate(56 82)" });

  bird.append(
    // 尾
    svgElement("path", {
      d: "M-13 24 Q-25 48 -24 67 M-4 27 Q-7 51 -8 69 M6 25 Q13 50 18 66",
      fill: "none",
      stroke: "#16843d",
      "stroke-width": "6",
      "stroke-linecap": "round"
    }),
    // 胴体
    svgElement("ellipse", {
      cx: "-1", cy: "7", rx: "20", ry: "31",
      fill: "#16843d",
      stroke: "#0d642c",
      "stroke-width": "2.2"
    }),
    // 羽
    svgElement("path", {
      d: "M-10 -7 Q-30 4 -23 28 Q-8 19 3 -2 Z",
      fill: "#2552a4",
      stroke: "#14316f",
      "stroke-width": "2"
    }),
    // 首と頭
    svgElement("path", {
      d: "M-1 -18 Q2 -30 7 -36",
      fill: "none",
      stroke: "#16843d",
      "stroke-width": "7",
      "stroke-linecap": "round"
    }),
    svgElement("circle", {
      cx: "8", cy: "-39", r: "11",
      fill: "#2552a4",
      stroke: "#14316f",
      "stroke-width": "2"
    }),
    // くちばし
    svgElement("path", {
      d: "M17 -42 L31 -37 L18 -32 Z",
      fill: "#d12b2b",
      stroke: "#9f1a1a",
      "stroke-width": "1"
    }),
    svgElement("circle", {
      cx: "11", cy: "-42", r: "2.1",
      fill: "#111827"
    }),
    // 羽・胴の飾り
    svgElement("path", {
      d: "M-10 3 Q-1 13 9 3 M-11 14 Q-1 24 10 13",
      fill: "none",
      stroke: "#fffdf5",
      "stroke-width": "2.7",
      "stroke-linecap": "round"
    }),
    svgElement("path", {
      d: "M-4 -32 Q-13 -44 -10 -51 Q-1 -47 5 -37",
      fill: "#d12b2b",
      stroke: "#9f1a1a",
      "stroke-width": "1"
    })
  );

  svg.appendChild(bird);
}

function createSouzu(number) {
  const { wrapper, svg } = createTileBase(`${number}索`);

  if (number === 1) {
    createSouOne(svg);
  } else {
    SOU_LAYOUTS[number].forEach(([x, y, rotation, colorName]) => {
      createBamboo(svg, x, y, rotation, colorName);
    });
  }

  return wrapper;
}

function createHonor(tileCode) {
  const tile = HONOR_TILES[tileCode];
  const { wrapper, svg } = createTileBase(tile.label);

  if (tileCode === "white") {
    svg.appendChild(svgElement("rect", {
      x: "24",
      y: "28",
      width: "64",
      height: "104",
      rx: "5",
      fill: "none",
      stroke: "#3b82f6",
      "stroke-width": "5"
    }));
  } else {
    createText(svg, tile.label, 56, 108, 72, tile.color);
  }

  return wrapper;
}

function createTile(tileCode) {
  const suitedTile = /^([1-9])([mps])$/.exec(tileCode);

  if (suitedTile) {
    const number = Number(suitedTile[1]);
    const suit = suitedTile[2];

    if (suit === "m") return createManzu(number);
    if (suit === "p") return createPinzu(number);
    if (suit === "s") return createSouzu(number);
  }

  if (HONOR_TILES[tileCode]) {
    return createHonor(tileCode);
  }

  throw new Error(`未対応の牌コードです: ${tileCode}`);
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
    throw new Error(`openMelds[${index}]には副露オブジェクトを指定してください。`);
  }

  if (!allowedTypes.has(openMeld.type)) {
    throw new Error(`openMelds[${index}].typeはchi、pon、kan-openのいずれかを指定してください。`);
  }

  const expectedTileCount = openMeld.type === "kan-open" ? 4 : 3;
  if (!Array.isArray(openMeld.tiles) || openMeld.tiles.length !== expectedTileCount) {
    throw new Error(`openMelds[${index}].tilesには${expectedTileCount}枚の牌を指定してください。`);
  }

  return { type: openMeld.type, tiles: [...openMeld.tiles] };
}

function createOpenMeldTile(tileCode, isSideways) {
  const tile = createTile(tileCode);
  if (isSideways) {
    tile.classList.add("is-sideways");
  }
  return tile;
}

function displayCompleteHand(
  concealedTiles,
  winningTile,
  container,
  concealedKans = [],
  openMelds = []
) {
  if (!Array.isArray(concealedTiles)) {
    throw new Error("concealedTilesには配列を指定してください。");
  }

  if (!Array.isArray(concealedKans)) {
    throw new Error("concealedKansには配列を指定してください。");
  }

  if (!Array.isArray(openMelds)) {
    throw new Error("openMeldsには配列を指定してください。");
  }

  const normalizedOpenMelds = openMelds.map(normalizeOpenMeld);

  const normalizedConcealedKans = concealedKans.map(
    normalizeConcealedKanTileCode
  );

  // 暗槓は物理的には4枚だが、手牌構成上は刻子と同じ3枚分として数える。
  // 例：暗槓1組なら concealedTiles 10枚 + 暗槓1組（3枚分） = 13枚分。
  const structuralTileCount =
    concealedTiles.length +
    normalizedConcealedKans.length * 3 +
    normalizedOpenMelds.length * 3;

  if (structuralTileCount !== 13) {
    throw new Error(
      "concealedTiles、concealedKans、openMeldsは、合計13枚分になるよう指定してください。"
    );
  }

  container.replaceChildren();

  for (let count = 1; count <= 4; count += 1) {
    container.classList.remove(`has-concealed-kans-${count}`);
  }
  container.classList.toggle("has-open-melds", normalizedOpenMelds.length > 0);
  const sidewaysTileCount = normalizedOpenMelds.length;
  const physicalTileCount = concealedTiles.length + normalizedConcealedKans.length * 4
    + normalizedOpenMelds.reduce((total, meld) => total + meld.tiles.length, 0)
    + (winningTile ? 1 : 0);
  const layoutUnits = physicalTileCount + sidewaysTileCount * 0.42;
  container.style.setProperty("--layout-scale", String(1 / Math.max(layoutUnits, 14)));

  if (normalizedConcealedKans.length > 0) {
    const layoutKanCount = Math.min(normalizedConcealedKans.length, 4);
    container.classList.add(`has-concealed-kans-${layoutKanCount}`);
  }

  const row = document.createElement("div");
  row.className = "complete-hand-row";

  const concealedHand = document.createElement("div");
  concealedHand.className = "concealed-hand";

  const concealedTileSection = document.createElement("div");
  concealedTileSection.className = "concealed-tile-section";

  const sortedTiles = sortTilesForDisplay(concealedTiles);

  for (const tileCode of sortedTiles) {
    concealedTileSection.appendChild(createTile(tileCode));
  }

  concealedHand.appendChild(concealedTileSection);

  if (normalizedConcealedKans.length > 0) {
    const concealedKanSection = document.createElement("div");
    concealedKanSection.className = "concealed-kan-section";

    const sortedKans = [...normalizedConcealedKans].sort(
      (left, right) => getTileSortValue(left) - getTileSortValue(right)
    );

    for (const tileCode of sortedKans) {
      const kanGroup = document.createElement("div");
      kanGroup.className = "concealed-kan-group";

      const kanTiles = document.createElement("div");
      kanTiles.className = "concealed-kan-tiles";
      kanTiles.setAttribute("aria-label", `${tileCode}の暗槓`);

      for (let index = 0; index < 4; index += 1) {
        kanTiles.appendChild(createTile(tileCode));
      }

      const kanLabel = document.createElement("div");
      kanLabel.className = "concealed-kan-label";
      kanLabel.textContent = "暗槓";

      kanGroup.append(kanTiles, kanLabel);
      concealedKanSection.appendChild(kanGroup);
    }

    concealedHand.appendChild(concealedKanSection);
  }

  if (normalizedOpenMelds.length > 0) {
    const openMeldSection = document.createElement("div");
    openMeldSection.className = "open-meld-section";

    const labels = { chi: "チー", pon: "ポン", "kan-open": "明槓" };
    normalizedOpenMelds.forEach((meld) => {
      const meldGroup = document.createElement("div");
      meldGroup.className = `open-meld-group open-meld-${meld.type}`;

      const meldTiles = document.createElement("div");
      meldTiles.className = "open-meld-tiles";
      meldTiles.setAttribute("aria-label", `${labels[meld.type]}：${meld.tiles.join("、")}`);

      meld.tiles.forEach((tileCode, tileIndex) => {
        const sidewaysIndex = meld.type === "chi" ? 0 : 1;
        meldTiles.appendChild(createOpenMeldTile(tileCode, tileIndex === sidewaysIndex));
      });

      const meldLabel = document.createElement("div");
      meldLabel.className = "open-meld-label";
      meldLabel.textContent = labels[meld.type];
      meldGroup.append(meldTiles, meldLabel);
      openMeldSection.appendChild(meldGroup);
    });

    concealedHand.appendChild(openMeldSection);
  }

  row.appendChild(concealedHand);

  if (winningTile) {
    const winningTileArea = document.createElement("div");
    winningTileArea.className = "winning-tile-area";
    winningTileArea.appendChild(createTile(winningTile));

    const label = document.createElement("div");
    label.className = "winning-label";
    label.textContent = "和了牌";
    winningTileArea.appendChild(label);
    row.appendChild(winningTileArea);
  }

  container.appendChild(row);
}

function createInfoCard(label, value) {
  const card = document.createElement("div");
  card.className = "info-card";

  const labelElement = document.createElement("span");
  labelElement.className = "info-label";
  labelElement.textContent = label;

  const valueElement = document.createElement("span");
  valueElement.className = "info-value";
  valueElement.textContent = value;

  card.append(labelElement, valueElement);
  return card;
}

function createTimerInfoCard() {
  const card = document.createElement("div");
  card.className = "info-card";

  const label = document.createElement("span");
  label.className = "info-label";
  label.textContent = "経過時間";

  const value = document.createElement("span");
  value.id = "timerDisplay";
  value.className = "info-value timer-value";
  value.dataset.testid = "timer-display";
  value.textContent = "00:00";

  card.append(label, value);

  return card;
  }

function formatElapsedTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

function updateTimerDisplay() {
  const timerDisplay = document.getElementById("timerDisplay");

  if (!timerDisplay) {
  return;
  }

  timerDisplay.textContent = formatElapsedTime(elapsedMilliseconds);
  }

function clearTimerInterval() {
  if (timerIntervalId === null) {
  return;
  }

  window.clearInterval(timerIntervalId);
  timerIntervalId = null;
  }

function startTimer() {
  clearTimerInterval();

  elapsedMilliseconds = 0;
  timerStartedAt = Date.now();
  updateTimerDisplay();

  timerIntervalId = window.setInterval(() => {
  elapsedMilliseconds = Date.now() - timerStartedAt;
  updateTimerDisplay();
  }, 250);
  }

function stopTimer() {
  if (timerIntervalId === null) {
  return;
  }

  elapsedMilliseconds = Date.now() - timerStartedAt;
  clearTimerInterval();
  updateTimerDisplay();
  }

function createAnswerItem(label, value) {
  const item = document.createElement("div");
  item.className = "answer-item";

  const heading = document.createElement("strong");
  heading.textContent = label;

  const text = document.createElement("span");
  text.textContent = value;

  item.append(heading, text);
  return item;
}


function validateQuestionData() {
  const errors = [];
  const validWinds = new Set(["east", "south", "west", "north"]);
  const validWinTypes = new Set(["ron", "tsumo"]);

  if (!Array.isArray(questions)) {
    errors.push("questions.jsを読み込めませんでした");
    return errors;
  }

  if (questions.length === 0) {
    errors.push("問題データが0件です");
    return errors;
  }

  const ids = new Set();

  for (const [index, question] of questions.entries()) {
    const location = question?.id || `配列${index + 1}番目`;

    if (!question || typeof question !== "object") {
      errors.push(`${location}：問題データがオブジェクトではありません`);
      continue;
    }

    if (typeof question.id !== "string" || question.id.trim() === "") {
      errors.push(`${location}：問題IDが未設定です`);
    } else if (ids.has(question.id)) {
      errors.push(`${location}：問題IDが重複しています`);
    } else {
      ids.add(question.id);
    }

    if (!Array.isArray(question.concealedTiles)) {
      errors.push(`${location}：concealedTilesが配列ではありません`);
    }

    if (typeof question.winningTile !== "string" || question.winningTile.trim() === "") {
      errors.push(`${location}：winningTileが未設定です`);
    }

    if (!validWinTypes.has(question.winType)) {
      errors.push(`${location}：winTypeはronまたはtsumoで指定してください`);
    }

    if (!validWinds.has(question.roundWind)) {
      errors.push(`${location}：roundWindが不正です`);
    }

    if (!validWinds.has(question.seatWind)) {
      errors.push(`${location}：seatWindが不正です`);
    }

    if (!question.answer || typeof question.answer !== "object") {
      errors.push(`${location}：answerが未設定です`);
    } else {
      if (!Number.isFinite(question.answer.fu)) {
        errors.push(`${location}：answer.fuが数値ではありません`);
      }

      if (!Number.isFinite(question.answer.totalHan)) {
        errors.push(`${location}：answer.totalHanが数値ではありません`);
      }

      if (!question.answer.score || typeof question.answer.score !== "object") {
        errors.push(`${location}：answer.scoreが未設定です`);
      }

      if (!Array.isArray(question.answer.yaku)) {
        errors.push(`${location}：answer.yakuが配列ではありません`);
      } else if (Number.isFinite(question.answer.totalHan)) {
        const invalidYaku = question.answer.yaku.some(
          yaku => !yaku || typeof yaku.name !== "string" || !Number.isFinite(yaku.han)
        );
        if (invalidYaku) {
          errors.push(`${location}：answer.yakuの形式が不正です`);
        } else {
          const hanSum = question.answer.yaku.reduce((sum, yaku) => sum + yaku.han, 0);
          if (hanSum !== question.answer.totalHan) {
            errors.push(`${location}：役の翻数合計がanswer.totalHanと一致しません`);
          }
        }
      }
    }

    if (!Array.isArray(question.doraIndicators)) {
      errors.push(`${location}：doraIndicatorsが配列ではありません`);
    }

    if (!Array.isArray(question.uraDoraIndicators)) {
      errors.push(`${location}：uraDoraIndicatorsが配列ではありません`);
    }

    if (Array.isArray(question.concealedTiles) && typeof question.winningTile === "string") {
      const concealedKans = Array.isArray(question.concealedKans)
        ? question.concealedKans
        : [];
      const openMelds = Array.isArray(question.openMelds)
        ? question.openMelds
        : [];
      const structuralTileCount =
        question.concealedTiles.length +
        concealedKans.length * 3 +
        openMelds.length * 3;

      if (structuralTileCount !== 13) {
        errors.push(
          `${location}：手牌構成が13枚分ではありません（${structuralTileCount}枚分）`
        );
      }

      const physicalTiles = [
        ...question.concealedTiles,
        question.winningTile,
        ...concealedKans.flatMap(kan => {
          const tileCode = normalizeConcealedKanTileCode(kan, 0);
          return [tileCode, tileCode, tileCode, tileCode];
        }),
        ...openMelds.flatMap((meld, meldIndex) => {
          try {
            return normalizeOpenMeld(meld, meldIndex).tiles;
          } catch (error) {
            errors.push(`${location}：${error.message}`);
            return [];
          }
        })
      ];
      const tileCounts = new Map();
      for (const tileCode of physicalTiles) {
        tileCounts.set(tileCode, (tileCounts.get(tileCode) ?? 0) + 1);
      }
      for (const [tileCode, count] of tileCounts) {
        if (count > 4) {
          errors.push(`${location}：${tileCode}が${count}枚あります`);
        }
      }
    }

    if (
      question.answer &&
      Number.isFinite(question.answer.fu) &&
      Number.isFinite(question.answer.totalHan) &&
      question.answer.score
    ) {
      const isKiriage =
        (question.answer.fu === 30 && question.answer.totalHan === 4) ||
        (question.answer.fu === 60 && question.answer.totalHan === 3);

      if (isKiriage && question.answer.score.category !== "切り上げ満貫") {
        errors.push(`${location}：切り上げ満貫が未反映です`);
      }
    }
  }

  return errors;
}

function showQuestionDataError(errors) {
  console.error("Question validation: FAILED", errors);

  const main = document.querySelector("main");
  main.innerHTML = "";

  const panel = document.createElement("section");
  panel.setAttribute("role", "alert");
  panel.style.maxWidth = "760px";
  panel.style.margin = "48px auto";
  panel.style.padding = "24px";
  panel.style.border = "2px solid #b91c1c";
  panel.style.borderRadius = "12px";
  panel.style.background = "#fef2f2";
  panel.style.color = "#7f1d1d";

  const title = document.createElement("h1");
  title.textContent = "問題データにエラーがあります";

  const message = document.createElement("p");
  message.textContent = "詳細は開発者ツールのConsoleを確認してください。";

  const count = document.createElement("p");
  count.textContent = `検出件数：${errors.length}件`;

  panel.append(title, message, count);
  main.appendChild(panel);
}


function summarizeQuestionManagement() {
  const summary = {
    fuHan: {},
    scoreCategory: {},
    playerType: {},
    winType: {},
    waitType: {},
    yaku: {},
    kiriage: {
      "30符4翻": [],
      "60符3翻": []
    }
  };

  const increment = (target, key) => {
    target[key] = (target[key] || 0) + 1;
  };

  for (const question of questions) {
    const meta = question.management;
    increment(summary.fuHan, `${meta.fu}符${meta.han}翻`);
    increment(summary.scoreCategory, meta.scoreCategory);
    increment(summary.playerType, meta.playerType);
    increment(summary.winType, meta.winType);
    increment(summary.waitType, meta.waitType);

    for (const yaku of meta.mainYaku) {
      increment(summary.yaku, yaku);
    }

    if (meta.fu === 30 && meta.han === 4) {
      summary.kiriage["30符4翻"].push(question.id);
    }
    if (meta.fu === 60 && meta.han === 3) {
      summary.kiriage["60符3翻"].push(question.id);
    }
  }

  console.info("問題セット管理集計", summary);
  return summary;
}


function roundUpToHundred(value) {
  return Math.ceil(value / 100) * 100;
}

function calculateScoreFromFuHan(
  question,
  totalHan,
  fu = question.answer.fu,
  winType = question.winType
) {
  const dealer = question.seatWind === "east";
  const tsumo = winType === "tsumo";

  let category = "通常";
  let basePoints;
  let kiriageMangan = false;

  if (totalHan >= 13) {
    category = "数え役満";
    basePoints = 8000;
  } else if (totalHan >= 11) {
    category = "三倍満";
    basePoints = 6000;
  } else if (totalHan >= 8) {
    category = "倍満";
    basePoints = 4000;
  } else if (totalHan >= 6) {
    category = "跳満";
    basePoints = 3000;
  } else if (totalHan >= 5) {
    category = "満貫";
    basePoints = 2000;
  } else {
    const rawBasePoints = fu * (2 ** (totalHan + 2));
    const isKiriage =
      (fu === 30 && totalHan === 4) ||
      (fu === 60 && totalHan === 3);

    if (isKiriage) {
      category = "切り上げ満貫";
      basePoints = 2000;
      kiriageMangan = true;
    } else if (rawBasePoints >= 2000) {
      category = "満貫";
      basePoints = 2000;
    } else {
      basePoints = rawBasePoints;
    }
  }

  let pointText;
  if (!tsumo) {
    const multiplier = dealer ? 6 : 4;
    pointText = `${roundUpToHundred(basePoints * multiplier)}点`;
  } else if (dealer) {
    pointText = `${roundUpToHundred(basePoints * 2)}点オール`;
  } else {
    const childPayment = roundUpToHundred(basePoints);
    const dealerPayment = roundUpToHundred(basePoints * 2);
    pointText = `${childPayment}点／${dealerPayment}点`;
  }

  return {
    category,
    pointText,
    basePoints,
    kiriageMangan
  };
}

function buildAdditionalConditions(extraHan, patternIndex, allowRiichi = true) {
  const patternsByHan = {
    1: [
      [{ name: "立直", han: 1 }],
      [{ name: "ドラ1", han: 1 }],
      [{ name: "赤ドラ", han: 1 }]
    ],
    2: [
      [{ name: "立直", han: 1 }, { name: "一発", han: 1 }],
      [{ name: "立直", han: 1 }, { name: "ドラ1", han: 1 }],
      [{ name: "赤ドラ", han: 1 }, { name: "ドラ1", han: 1 }],
      [{ name: "ドラ2", han: 2 }]
    ],
    3: [
      [{ name: "立直", han: 1 }, { name: "一発", han: 1 }, { name: "ドラ1", han: 1 }],
      [{ name: "立直", han: 1 }, { name: "ドラ2", han: 2 }],
      [{ name: "赤ドラ", han: 1 }, { name: "ドラ2", han: 2 }],
      [{ name: "ドラ3", han: 3 }]
    ],
    4: [
      [{ name: "立直", han: 1 }, { name: "一発", han: 1 }, { name: "ドラ2", han: 2 }],
      [{ name: "立直", han: 1 }, { name: "赤ドラ", han: 1 }, { name: "裏ドラ2", han: 2 }],
      [{ name: "立直", han: 1 }, { name: "ドラ3", han: 3 }],
      [{ name: "ドラ4", han: 4 }]
    ],
    5: [
      [{ name: "立直", han: 1 }, { name: "一発", han: 1 }, { name: "ドラ3", han: 3 }],
      [{ name: "立直", han: 1 }, { name: "赤ドラ", han: 1 }, { name: "裏ドラ3", han: 3 }],
      [{ name: "赤ドラ", han: 1 }, { name: "ドラ4", han: 4 }],
      [{ name: "ドラ5", han: 5 }]
    ],
    6: [
      [{ name: "立直", han: 1 }, { name: "一発", han: 1 }, { name: "ドラ4", han: 4 }],
      [{ name: "立直", han: 1 }, { name: "赤ドラ", han: 1 }, { name: "裏ドラ4", han: 4 }],
      [{ name: "赤ドラ", han: 1 }, { name: "ドラ5", han: 5 }],
      [{ name: "ドラ6", han: 6 }]
    ],
    7: [
      [{ name: "立直", han: 1 }, { name: "一発", han: 1 }, { name: "ドラ5", han: 5 }],
      [{ name: "立直", han: 1 }, { name: "赤ドラ", han: 1 }, { name: "裏ドラ5", han: 5 }],
      [{ name: "赤ドラ", han: 1 }, { name: "ドラ6", han: 6 }],
      [{ name: "ドラ7", han: 7 }]
    ],
    8: [
      [{ name: "立直", han: 1 }, { name: "一発", han: 1 }, { name: "ドラ6", han: 6 }],
      [{ name: "立直", han: 1 }, { name: "赤ドラ", han: 1 }, { name: "裏ドラ6", han: 6 }],
      [{ name: "赤ドラ", han: 1 }, { name: "ドラ7", han: 7 }],
      [{ name: "ドラ8", han: 8 }]
    ]
  };

  const patterns = patternsByHan[extraHan];
  if (patterns) {
    const usablePatterns = allowRiichi
      ? patterns
      : patterns.filter(pattern =>
          pattern.every(condition =>
            !["立直", "一発", "裏ドラ"].some(name => condition.name.includes(name))
          )
        );

    if (usablePatterns.length > 0) {
      return usablePatterns[patternIndex % usablePatterns.length]
        .map(condition => ({ ...condition }));
    }
  }

  return [{ name: `ドラ${extraHan}`, han: extraHan }];
}

function getTargetExtraHanCandidates(question) {
  const baseHan = question.answer.totalHan;
  const targetTotals = [baseHan + 1, 4, 5, 6, 8, 11, 13];
  const uniqueExtras = [];

  for (const targetTotal of targetTotals) {
    const extraHan = targetTotal - baseHan;
    if (extraHan >= 1 && extraHan <= 8 && !uniqueExtras.includes(extraHan)) {
      uniqueExtras.push(extraHan);
    }
  }

  for (let extraHan = 1; extraHan <= 8 && uniqueExtras.length < 5; extraHan += 1) {
    if (baseHan + extraHan <= 13 && !uniqueExtras.includes(extraHan)) {
      uniqueExtras.push(extraHan);
    }
  }

  return uniqueExtras.slice(0, 5);
}

function createVariationPatternsForQuestion(question) {
  const extraCandidates = getTargetExtraHanCandidates(question);

  return extraCandidates.map((extraHan, index) => {
    const totalHan = question.answer.totalHan + extraHan;
    const conditions = buildAdditionalConditions(
      extraHan,
      question.id.length + index,
      (question.openMelds ?? []).length === 0
    );
    const score = calculateScoreFromFuHan(question, totalHan);

    return {
      patternId: `${question.id}-p${index + 1}`,
      extraHan,
      totalHan,
      conditions,
      score
    };
  });
}

function selectRandomVariationPattern(question) {
  const patterns = createVariationPatternsForQuestion(question);
  const selectedIndex = Math.floor(Math.random() * patterns.length);

  return {
    selectedPatternId: patterns[selectedIndex].patternId,
    patternCount: patterns.length,
    ...patterns[selectedIndex]
  };
}

function createSessionVariations() {
  sessionVariations = {};
  for (const question of questions) {
    sessionVariations[question.id] = selectRandomVariationPattern(question);
  }
}

function getNextDoraTile(indicator) {
  if (HONOR_TILES[indicator]) {
    const windOrder = ["east", "south", "west", "north"];
    const dragonOrder = ["white", "green", "red"];
    const order = windOrder.includes(indicator) ? windOrder : dragonOrder;
    return order[(order.indexOf(indicator) + 1) % order.length];
  }

  const number = Number(indicator[0]);
  const suit = indicator[1];
  return `${number === 9 ? 1 : number + 1}${suit}`;
}

function getPhysicalWinningTiles(question) {
  const tiles = [...question.concealedTiles, question.winningTile];

  for (const concealedKan of question.concealedKans ?? []) {
    if (typeof concealedKan === "string") {
      tiles.push(concealedKan, concealedKan, concealedKan, concealedKan);
    } else if (Array.isArray(concealedKan.tiles)) {
      tiles.push(...concealedKan.tiles);
    }
  }

  for (const openMeld of question.openMelds ?? []) {
    if (Array.isArray(openMeld?.tiles)) {
      tiles.push(...openMeld.tiles);
    }
  }

  return tiles;
}

function countDoraFromIndicators(question, indicators) {
  const winningTiles = getPhysicalWinningTiles(question);
  return indicators
    .map(getNextDoraTile)
    .reduce(
      (total, doraTile) =>
        total + winningTiles.filter(tile => tile === doraTile).length,
      0
    );
}

function hasYakuWithoutTsumo(question) {
  const yakuList = Array.isArray(question?.answer?.yaku)
    ? question.answer.yaku
    : [];

  return yakuList.some(yaku => {
    const name = typeof yaku === "string" ? yaku : yaku?.name;
    return Boolean(name) &&
      name !== "門前清自摸和" &&
      name !== "ツモ";
  });
}

function resolvePracticalWinType(question, shouldRiichi) {
  if (!question) {
    return null;
  }

  if (!shouldRiichi && !hasYakuWithoutTsumo(question)) {
    return "tsumo";
  }

  return question.winType;
}

function getEffectiveWinType(question) {
  if (isReviewMode || currentMode !== MODE_PRACTICAL) {
    return question.winType;
  }

  return practicalWinType || question.winType;
}

function roundFuToTen(fu) {
  return Math.ceil(fu / 10) * 10;
}

function calculateRolelessTsumoFu(question) {
  const breakdown = Array.isArray(question?.answer?.fuBreakdown)
    ? question.answer.fuBreakdown
    : [];

  let rawFu = 0;
  let parsedComponent = false;

  for (const item of breakdown) {
    if (
      typeof item !== "string" ||
      item.includes("合計") ||
      item.includes("切り上げ")
    ) {
      continue;
    }

    const match = item.match(/[：:]\s*(\d+)符/);
    if (!match) {
      continue;
    }

    parsedComponent = true;
    const componentFu = Number(match[1]);

    if (item.includes("門前ロン")) {
      continue;
    }

    rawFu += componentFu;
  }

  if (parsedComponent) {
    rawFu += 2;
    return roundFuToTen(Math.max(rawFu, 20));
  }

  return question.answer.fu;
}

function getPracticalDoraSummary(question) {
  const doraIndicators = question.doraIndicators ?? [];
  const uraDoraIndicators = question.uraDoraIndicators ?? [];

  return {
    doraIndicators,
    uraDoraIndicators,
    doraCount: countDoraFromIndicators(question, doraIndicators),
    uraDoraCount: practicalRiichiSelected
      ? countDoraFromIndicators(question, uraDoraIndicators)
      : 0
  };
}

function createPracticalDoraBlock(titleText, indicators) {
  const block = document.createElement("section");
  block.className = "practical-dora-block";

  const title = document.createElement("h3");
  title.className = "practical-dora-title";
  title.textContent = titleText;

  const tiles = document.createElement("div");
  tiles.className = "practical-dora-tiles";

  for (const indicator of indicators) {
    tiles.appendChild(createTile(indicator));
  }

  block.append(title, tiles);
  return block;
}

function renderPracticalDoraArea(showUraDora) {
  const area = document.getElementById("practicalDoraArea");
  const blocks = [
    createPracticalDoraBlock(
      "表ドラ表示牌",
      currentQuestion.doraIndicators ?? []
    )
  ];

  if (showUraDora) {
    blocks.push(
      createPracticalDoraBlock(
        "裏ドラ表示牌",
        currentQuestion.uraDoraIndicators ?? []
      )
    );
  }

  area.replaceChildren(...blocks);
  area.hidden = false;
}

function getActiveAnswer(question) {
  if (!isReviewMode && currentMode === MODE_PRACTICAL) {
    const doraSummary = getPracticalDoraSummary(question);
    const effectiveWinType = getEffectiveWinType(question);
    const isConvertedRolelessTsumo =
      !practicalRiichiSelected &&
      question.winType === "ron" &&
      effectiveWinType === "tsumo" &&
      !hasYakuWithoutTsumo(question);
    const effectiveFu = isConvertedRolelessTsumo
      ? calculateRolelessTsumoFu(question)
      : question.answer.fu;
    const additionalYaku = [];

    if (isConvertedRolelessTsumo) {
      additionalYaku.push({ name: "門前清自摸和", han: 1 });
    }

    if (practicalRiichiSelected) {
      additionalYaku.push({ name: "立直", han: 1 });
    }

    if (doraSummary.doraCount > 0) {
      additionalYaku.push({
        name: `ドラ${doraSummary.doraCount}`,
        han: doraSummary.doraCount
      });
    }

    if (doraSummary.uraDoraCount > 0) {
      additionalYaku.push({
        name: `裏ドラ${doraSummary.uraDoraCount}`,
        han: doraSummary.uraDoraCount
      });
    }

    const extraHan = additionalYaku.reduce(
      (total, yaku) => total + yaku.han,
      0
    );
    const totalHan = question.answer.totalHan + extraHan;
    const score = calculateScoreFromFuHan(
      question,
      totalHan,
      effectiveFu,
      effectiveWinType
    );

    return {
      yaku: [...question.answer.yaku, ...additionalYaku],
      totalHan,
      fu: effectiveFu,
      score,
      fuBreakdown: [
        ...question.answer.fuBreakdown.filter(
          item => !item.includes("切り上げ満貫を適用")
        ),
        `基本${question.answer.totalHan}翻＋実戦条件${extraHan}翻＝合計${totalHan}翻`,
        isConvertedRolelessTsumo
          ? `役なし・非立直のためツモへ変更し、門前清自摸和1翻を追加（${effectiveFu}符）`
          : `和了方法：${WIN_TYPE_LABELS[effectiveWinType]}`,
        `表ドラ：${doraSummary.doraCount}枚`,
        practicalRiichiSelected
          ? `裏ドラ：${doraSummary.uraDoraCount}枚`
          : "裏ドラ：立直しなかったため対象外",
        score.kiriageMangan
          ? "30符4翻または60符3翻のため、切り上げ満貫を適用"
          : `合計${totalHan}翻として点数を計算`
      ],
      conditions: additionalYaku
    };
  }

  if (isReviewMode || currentMode !== MODE_HAN_VARIATION) {
    return {
      yaku: question.answer.yaku,
      totalHan: question.answer.totalHan,
      fu: question.answer.fu,
      score: question.answer.score,
      fuBreakdown: question.answer.fuBreakdown,
      conditions: []
    };
  }

  const variation =
    sessionVariations[question.id] || createVariationForQuestion(question);

  const conditionYaku = variation.conditions.map(condition => ({
    name: condition.name,
    han: condition.han
  }));

  return {
    yaku: [...question.answer.yaku, ...conditionYaku],
    totalHan: variation.totalHan,
    fu: question.answer.fu,
    score: variation.score,
    fuBreakdown: [
      ...question.answer.fuBreakdown.filter(
        item => !item.includes("切り上げ満貫を適用")
      ),
      `基本${question.answer.totalHan}翻＋付加条件${variation.extraHan}翻＝合計${variation.totalHan}翻`,
      variation.score.kiriageMangan
        ? "30符4翻または60符3翻のため、切り上げ満貫を適用"
        : `合計${variation.totalHan}翻として点数を計算`
    ],
    conditions: variation.conditions
  };
}

function updateModeDisplay() {
  const normalButton = document.getElementById("normalModeButton");
  const variationButton = document.getElementById("hanVariationModeButton");
  const practicalButton = document.getElementById("practicalModeButton");
  const description = document.getElementById("modeDescription");
  const reviewIndicator = document.getElementById("reviewModeIndicator");
  const modeButtons = [normalButton, variationButton, practicalButton];

  if (isReviewMode) {
    for (const button of modeButtons) {
      button.setAttribute("aria-pressed", "false");
      button.disabled = true;
    }
    reviewIndicator.hidden = false;
    description.textContent =
      "選択した問題を通常モード形式で復習しています。元の出題モードと進捗は一時停止したまま保持されています。";
    return;
  }

  for (const button of modeButtons) {
    button.disabled = false;
  }
  reviewIndicator.hidden = true;
  normalButton.setAttribute("aria-pressed", String(currentMode === MODE_NORMAL));
  variationButton.setAttribute("aria-pressed", String(currentMode === MODE_HAN_VARIATION));
  practicalButton.setAttribute("aria-pressed", String(currentMode === MODE_PRACTICAL));

  if (currentMode === MODE_HAN_VARIATION) {
    description.textContent = "手牌の基本役・符に、問題ごとの候補から選ばれた立直・一発・ドラ等を加えて点数を計算します。";
  } else if (currentMode === MODE_PRACTICAL) {
    description.textContent = "表ドラを見て立直判断し、和了後に立直時だけ裏ドラを確認して最終点数を計算します。";
  } else {
    description.textContent = "手牌から役・翻・符・点数を計算します。";
  }
}

function switchMode(mode) {
  if (mode === currentMode) {
    return;
  }

  const confirmed = window.confirm(
    "モードを切り替えると、現在の進捗を破棄して第1問から開始します。よろしいですか？"
  );

  if (!confirmed) {
    return;
  }

  isReviewMode = false;
  reviewQuestion = null;
  reviewSessionSnapshot = null;
  currentMode = mode;
  restartSession();
  updateModeDisplay();
}

function shuffleArray(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] =
      [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function saveSessionState() {
  const state = {
    order: sessionOrder,
    currentQuestionIndex,
    answerShown,
    currentMode,
    sessionVariations,
    submittedAnswer,
    practicalStep,
    practicalRiichiSelected,
    practicalWinType
  };

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("セッションの保存に失敗しました。", error);
  }
}

function loadSessionState() {
  try {
    const rawState = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawState) {
      return false;
    }

    const state = JSON.parse(rawState);
    const validIds = new Set(questions.map(question => question.id));
    const orderIsValid =
      Array.isArray(state.order) &&
      state.order.length === questions.length &&
      new Set(state.order).size === questions.length &&
      state.order.every(id => validIds.has(id));

    const indexIsValid =
      Number.isInteger(state.currentQuestionIndex) &&
      state.currentQuestionIndex >= 0 &&
      state.currentQuestionIndex < questions.length;

    if (!orderIsValid || !indexIsValid) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return false;
    }

    sessionOrder = state.order;
    currentQuestionIndex = state.currentQuestionIndex;
    answerShown = Boolean(state.answerShown);
    currentMode =
      state.currentMode === MODE_HAN_VARIATION
        ? MODE_HAN_VARIATION
        : state.currentMode === MODE_PRACTICAL
          ? MODE_PRACTICAL
          : MODE_NORMAL;
    sessionVariations =
      state.sessionVariations && typeof state.sessionVariations === "object"
        ? state.sessionVariations
        : {};
    submittedAnswer =
      state.submittedAnswer && typeof state.submittedAnswer === "object"
        ? state.submittedAnswer
        : null;
    practicalStep = [
      PRACTICAL_STEP_RIICHI,
      PRACTICAL_STEP_AGARI,
      PRACTICAL_STEP_DORA
    ].includes(state.practicalStep)
      ? state.practicalStep
      : PRACTICAL_STEP_RIICHI;
    practicalRiichiSelected =
      typeof state.practicalRiichiSelected === "boolean"
        ? state.practicalRiichiSelected
        : null;
    practicalWinType =
      state.practicalWinType === "tsumo" || state.practicalWinType === "ron"
        ? state.practicalWinType
        : null;

    if (answerShown && !submittedAnswer) {
      answerShown = false;
    }

    return true;
  } catch (error) {
    console.warn("保存済みセッションを読み込めませんでした。", error);
    return false;
  }
}

function createNewSession() {
  sessionOrder = shuffleArray(
    questions.map(question => question.id)
  );
  currentQuestionIndex = 0;
  answerShown = false;
  submittedAnswer = null;
  practicalStep = PRACTICAL_STEP_RIICHI;
  practicalRiichiSelected = null;
  createSessionVariations();
  saveSessionState();
}

function getCurrentSessionQuestion() {
  const questionId = sessionOrder[currentQuestionIndex];
  return questions.find(question => question.id === questionId) || null;
}

function createScoreInput(id, labelText) {
  const group = document.createElement("div");
  group.className = "score-input-group";

  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = labelText;

  const input = document.createElement("input");
  input.id = id;
  input.className = "score-input";
  input.type = "number";
  input.inputMode = "numeric";
  input.min = "0";
  input.step = "100";
  input.autocomplete = "off";
  input.dataset.testid = id;

  const unit = document.createElement("span");
  unit.textContent = "点";

  group.append(label, input, unit);
  return group;
}

function displayScoreInputs(question) {
  const container = document.getElementById("scoreInputContainer");
  document.getElementById("scoreInputError").textContent = "";
  container.replaceChildren();

  if (getEffectiveWinType(question) === "ron") {
    container.append(createScoreInput("ronScoreInput", "申告点数"));
    return;
  }

  if (question.seatWind === "east") {
    container.append(
      createScoreInput("dealerTsumoScoreInput", "各自の支払い")
    );

    const allLabel = document.createElement("strong");
    allLabel.textContent = "オール";
    container.append(allLabel);
    return;
  }

  container.append(
    createScoreInput("childPaymentInput", "子の支払い"),
    createScoreInput("dealerPaymentInput", "親の支払い")
  );
}

function readPositiveInteger(inputId) {
  const input = document.getElementById(inputId);
  if (!input || input.value.trim() === "") {
    return null;
  }

  const value = Number(input.value);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function getSubmittedScore(question) {
  if (getEffectiveWinType(question) === "ron") {
    const score = readPositiveInteger("ronScoreInput");
    return score === null ? null : { type: "ron", score };
  }

  if (question.seatWind === "east") {
    const allPayment = readPositiveInteger("dealerTsumoScoreInput");
    return allPayment === null
      ? null
      : { type: "dealerTsumo", allPayment };
  }

  const childPayment = readPositiveInteger("childPaymentInput");
  const dealerPayment = readPositiveInteger("dealerPaymentInput");

  return childPayment === null || dealerPayment === null
    ? null
    : { type: "childTsumo", childPayment, dealerPayment };
}

function getExpectedScore(question, answer) {
  const values = (answer.score.pointText.match(/\d+/g) || []).map(Number);

  if (getEffectiveWinType(question) === "ron") {
    return { type: "ron", score: values[0] };
  }

  if (question.seatWind === "east") {
    return { type: "dealerTsumo", allPayment: values[0] };
  }

  return {
    type: "childTsumo",
    childPayment: values[0],
    dealerPayment: values[1]
  };
}

function isScoreCorrect(submitted, expected) {
  if (!submitted || submitted.type !== expected.type) {
    return false;
  }

  if (expected.type === "ron") {
    return submitted.score === expected.score;
  }

  if (expected.type === "dealerTsumo") {
    return submitted.allPayment === expected.allPayment;
  }

  return (
    submitted.childPayment === expected.childPayment &&
    submitted.dealerPayment === expected.dealerPayment
  );
}

function formatScoreResponse(response) {
  if (response.type === "ron") {
    return `${response.score}点`;
  }

  if (response.type === "dealerTsumo") {
    return `${response.allPayment}点オール`;
  }

  return `${response.childPayment}点／${response.dealerPayment}点`;
}

function renderAnswer(submitted) {
  const answer = getActiveAnswer(currentQuestion);
  const expected = getExpectedScore(currentQuestion, answer);
  const correct = isScoreCorrect(submitted, expected);
  const yakuText = answer.yaku
    .map(yaku => `${yaku.name} ${yaku.han}翻`)
    .join("、");

  const gradingResult = document.getElementById("gradingResult");
  gradingResult.className =
    `grading-result ${correct ? "correct" : "incorrect"}`;
  gradingResult.replaceChildren();

  const resultText = document.createElement("span");
  resultText.textContent = correct ? "○ 正解！" : "× 不正解";

  const detail = document.createElement("span");
  detail.className = "grading-result-detail";
  detail.textContent = correct
    ? `あなたの回答：${formatScoreResponse(submitted)}`
    : `あなたの回答：${formatScoreResponse(submitted)}　正解：${formatScoreResponse(expected)}`;

  gradingResult.append(resultText, detail);

  document.getElementById("answerGrid").replaceChildren(
    createAnswerItem("役", yakuText),
    createAnswerItem("翻", `${answer.totalHan}翻`),
    createAnswerItem("符", `${answer.fu}符`),
    createAnswerItem("点数区分", answer.score.category),
    createAnswerItem("点数", answer.score.pointText)
  );

  const explanation = document.getElementById("answerExplanation");
  explanation.replaceChildren();

  const title = document.createElement("strong");
  title.textContent = "符・点数の内訳";

  const list = document.createElement("ul");
  for (const item of answer.fuBreakdown) {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.appendChild(listItem);
  }

  explanation.append(title, list);

  document.getElementById("answerPanel").hidden = false;
  document.getElementById("scoreResponsePanel").hidden = true;
  document.getElementById("showAnswerButton").hidden = true;
  document.getElementById("nextQuestionButton").textContent = isReviewMode
    ? "通常学習へ戻る"
    : currentQuestionIndex === questions.length - 1
      ? "セッションを終了する"
      : "次の問題";
  document.getElementById("nextQuestionButton").hidden = false;
  document.getElementById("thinkingMessage").hidden = true;

  document.getElementById("answerPanel").scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

function createPracticalButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "practical-action-button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function resetPracticalQuestionState() {
  practicalStep = PRACTICAL_STEP_RIICHI;
  practicalRiichiSelected = null;
  practicalWinType = null;
}

function advancePracticalStep(nextStep) {
  practicalStep = nextStep;
  saveSessionState();
  renderPracticalStep();
}

function hasOpenMelds(question) {
  return Array.isArray(question?.openMelds) && question.openMelds.length > 0;
}

function selectPracticalRiichi(shouldRiichi) {
  practicalRiichiSelected = shouldRiichi;
  practicalWinType = resolvePracticalWinType(
    currentQuestion,
    shouldRiichi
  );
  displayScoreInputs(currentQuestion);
  advancePracticalStep(PRACTICAL_STEP_AGARI);
}

function renderPracticalQuestionInfo(showWinType) {
  const cards = [];
  if (showWinType) {
    cards.push(createInfoCard("和了方法", WIN_TYPE_LABELS[currentQuestion.winType]));
  }
  cards.push(
    createInfoCard("場風", WIND_LABELS[currentQuestion.roundWind]),
    createInfoCard("自風", WIND_LABELS[currentQuestion.seatWind]),
    createTimerInfoCard()
  );
  document.getElementById("questionInfo").replaceChildren(...cards);
  updateTimerDisplay();
}

function renderPracticalStep() {
  if (currentMode !== MODE_PRACTICAL || !currentQuestion) {
    return;
  }

  const panel = document.getElementById("practicalFlowPanel");
  const stepLabel = document.getElementById("practicalStepLabel");
  const title = document.getElementById("practicalFlowTitle");
  const message = document.getElementById("practicalFlowMessage");
  const actions = document.getElementById("practicalActionRow");
  const result = document.getElementById("practicalResult");
  const scorePanel = document.getElementById("scoreResponsePanel");
  const gradeButton = document.getElementById("showAnswerButton");
  const doraArea = document.getElementById("practicalDoraArea");

  if (practicalStep === PRACTICAL_STEP_RIICHI && hasOpenMelds(currentQuestion)) {
    practicalRiichiSelected = false;
    practicalWinType = currentQuestion.winType;
    practicalStep = PRACTICAL_STEP_AGARI;
  }

  panel.hidden = false;
  actions.replaceChildren();
  result.hidden = true;
  result.textContent = "";
  doraArea.hidden = true;
  doraArea.replaceChildren();
  scorePanel.hidden = true;
  gradeButton.hidden = true;

  if (practicalStep === PRACTICAL_STEP_RIICHI) {
    stepLabel.textContent = "STEP 1 / 3　聴牌";
    title.textContent = "立直しますか？";
    message.textContent = "表ドラ表示牌を確認し、現在の手牌から立直するかを判断してください。和了牌と和了方法はまだ表示されません。";
    renderPracticalDoraArea(false);
    actions.append(
      createPracticalButton("立直する", () => selectPracticalRiichi(true)),
      createPracticalButton("立直しない", () => selectPracticalRiichi(false))
    );
    renderPracticalQuestionInfo(false);
    displayCompleteHand(
      currentQuestion.concealedTiles,
      null,
      document.getElementById("completeHandContainer"),
      currentQuestion.concealedKans ?? [],
      currentQuestion.openMelds ?? []
    );
    document.getElementById("thinkingMessage").textContent =
      "表ドラを含めた聴牌時点の役・符・最低点を考えて、立直判断をしてください。";
    return;
  }

  renderPracticalQuestionInfo(true);
  displayCompleteHand(
    currentQuestion.concealedTiles,
    currentQuestion.winningTile,
    document.getElementById("completeHandContainer"),
    currentQuestion.concealedKans ?? [],
    currentQuestion.openMelds ?? []
  );

  if (practicalStep === PRACTICAL_STEP_AGARI) {
    const openHand = hasOpenMelds(currentQuestion);
    stepLabel.textContent = openHand ? "STEP 1 / 2　和了" : "STEP 2 / 3　和了";
    title.textContent = `和了結果：${WIN_TYPE_LABELS[getEffectiveWinType(currentQuestion)]}`;
    message.textContent = openHand
      ? "副露しているため立直はできません。和了牌と和了方法から符・翻を考えてください。"
      : "和了牌と和了方法が確定しました。符やツモ役の変化を考えてください。";
    renderPracticalDoraArea(false);
    result.hidden = false;
    result.textContent = hasOpenMelds(currentQuestion)
      ? `副露あり（立直不可） ／ 和了方法：${WIN_TYPE_LABELS[getEffectiveWinType(currentQuestion)]}`
      : `立直判断：${practicalRiichiSelected ? "立直する" : "立直しない"} ／ 和了方法：${WIN_TYPE_LABELS[getEffectiveWinType(currentQuestion)]}`;
    actions.append(createPracticalButton("ドラ確認へ", () => advancePracticalStep(PRACTICAL_STEP_DORA)));
    document.getElementById("thinkingMessage").textContent =
      "和了方法を反映した最終形を確認し、ドラ確認前の点数を考えてください。";
    return;
  }

  if (practicalStep === PRACTICAL_STEP_DORA) {
    stepLabel.textContent = hasOpenMelds(currentQuestion)
      ? "STEP 2 / 2　ドラ確認・点数入力"
      : "STEP 3 / 3　ドラ確認・点数入力";
    title.textContent = practicalRiichiSelected
      ? "裏ドラを確認して最終点数を入力"
      : "表ドラを確認して最終点数を入力";
    message.textContent = practicalRiichiSelected
      ? "立直したため、裏ドラ表示牌が公開されました。立直・表ドラ・裏ドラを含めて計算してください。"
      : "立直しなかったため、裏ドラはありません。表ドラを含めて計算してください。";
    renderPracticalDoraArea(practicalRiichiSelected);
    result.hidden = false;
    result.textContent = `選択：${practicalRiichiSelected ? "立直する" : "立直しない"} ／ 結果：${WIN_TYPE_LABELS[getEffectiveWinType(currentQuestion)]}`;
    scorePanel.hidden = false;
    gradeButton.hidden = false;
    document.getElementById("thinkingMessage").textContent =
      "役・翻・符を整理し、最終点数を入力して採点してください。";
    return;
  }
}


function createQuestionSelectLabel(question) {
  const yakuNames = Array.isArray(question.answer?.yaku)
    ? question.answer.yaku.map(yaku => yaku.name).join("・")
    : "役情報なし";
  const fu = Number.isFinite(question.answer?.fu) ? `${question.answer.fu}符` : "符不明";
  const han = Number.isFinite(question.answer?.totalHan)
    ? `${question.answer.totalHan}翻`
    : "翻不明";

  return `${question.id}｜${fu}${han}｜${yakuNames}`;
}

function initializeQuestionSelect() {
  const select = document.getElementById("questionSelect");
  const fragment = document.createDocumentFragment();

  for (const question of questions) {
    const option = document.createElement("option");
    option.value = question.id;
    option.textContent = createQuestionSelectLabel(question);
    fragment.appendChild(option);
  }

  select.replaceChildren(fragment);
}

function syncQuestionSelect() {
  const select = document.getElementById("questionSelect");
  if (select && currentQuestion) {
    select.value = currentQuestion.id;
  }
}

function createReviewSessionSnapshot() {
  return {
    answerShown,
    submittedAnswer,
    practicalStep,
    practicalRiichiSelected,
    practicalWinType
  };
}

function startSelectedQuestion() {
  const selectedQuestionId = document.getElementById("questionSelect").value;
  const selectedQuestion = questions.find(
    question => question.id === selectedQuestionId
  );

  if (!selectedQuestion) {
    console.error(`選択した問題が見つかりません: ${selectedQuestionId}`);
    return;
  }

  stopTimer();
  if (!isReviewMode) {
    reviewSessionSnapshot = createReviewSessionSnapshot();
  }

  isReviewMode = true;
  reviewQuestion = selectedQuestion;
  updateModeDisplay();
  answerShown = false;
  submittedAnswer = null;
  resetPracticalQuestionState();
  displayQuestion(reviewQuestion);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function returnToNormalSession() {
  if (!isReviewMode) {
    return;
  }

  stopTimer();
  isReviewMode = false;
  reviewQuestion = null;
  updateModeDisplay();

  if (reviewSessionSnapshot) {
    answerShown = reviewSessionSnapshot.answerShown;
    submittedAnswer = reviewSessionSnapshot.submittedAnswer;
    practicalStep = reviewSessionSnapshot.practicalStep;
    practicalRiichiSelected = reviewSessionSnapshot.practicalRiichiSelected;
    practicalWinType = reviewSessionSnapshot.practicalWinType;
  }
  reviewSessionSnapshot = null;

  displayQuestion(getCurrentSessionQuestion());
  if (answerShown && submittedAnswer) {
    stopTimer();
    renderAnswer(submittedAnswer);
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function displayQuestion(question) {
  if (!question) {
    showCompletion();
    return;
  }

  currentQuestion = question;
  syncQuestionSelect();
  if (
    !isReviewMode &&
    currentMode === MODE_PRACTICAL &&
    practicalRiichiSelected !== null &&
    practicalWinType === null
  ) {
    practicalWinType = resolvePracticalWinType(
      currentQuestion,
      practicalRiichiSelected
    );
  }
  const questionNumber = currentQuestionIndex + 1;
  const remaining = questions.length - questionNumber;

  if (isReviewMode) {
    document.getElementById("questionNumber").textContent =
      `復習問題：${question.id}`;
    document.getElementById("remainingCount").textContent =
      `通常学習は一時停止中（第${questionNumber}問・残り${remaining}問）`;
  } else {
    document.getElementById("questionNumber").textContent =
      `第${questionNumber}問（${questionNumber} / ${questions.length}）`;
    document.getElementById("remainingCount").textContent =
      `残り${remaining}問`;
  }

  const conditionPanel = document.getElementById("additionalConditionPanel");
  const conditionText = document.getElementById("additionalConditionText");
  const practicalPanel = document.getElementById("practicalFlowPanel");

  if (!isReviewMode && currentMode === MODE_HAN_VARIATION) {
    const variation = sessionVariations[question.id];
    conditionText.textContent =
      variation.conditions
        .map(condition => `${condition.name}（${condition.han}翻）`)
        .join("、") +
      `　［候補${variation.patternCount}パターンから選択］`;
    conditionPanel.hidden = false;
  } else {
    conditionText.textContent = "";
    conditionPanel.hidden = true;
  }

  practicalPanel.hidden = isReviewMode || currentMode !== MODE_PRACTICAL;
  document.getElementById("completionPanel").hidden = true;
  document.getElementById("questionInfo").hidden = false;
  document.querySelector(".stage").hidden = false;
  document.getElementById("restartFromBeginningButton").hidden = isReviewMode;
  document.getElementById("returnToSessionButton").hidden = !isReviewMode;
  document.getElementById("answerPanel").hidden = true;
  document.getElementById("nextQuestionButton").hidden = true;
  document.getElementById("thinkingMessage").hidden = false;

  displayScoreInputs(question);

  if (!isReviewMode && currentMode === MODE_PRACTICAL) {
    renderPracticalStep();
  } else {
    document.getElementById("questionInfo").replaceChildren(
      createInfoCard("和了方法", WIN_TYPE_LABELS[question.winType]),
      createInfoCard("場風", WIND_LABELS[question.roundWind]),
      createInfoCard("自風", WIND_LABELS[question.seatWind]),
      createTimerInfoCard()
    );
    displayCompleteHand(
      question.concealedTiles,
      question.winningTile,
      document.getElementById("completeHandContainer"),
      question.concealedKans ?? [],
      question.openMelds ?? []
    );
    document.getElementById("scoreResponsePanel").hidden = false;
    document.getElementById("showAnswerButton").hidden = false;
    document.getElementById("thinkingMessage").textContent =
      "役・翻・符を脳内で計算し、実戦と同じように最終点数を入力してください。";
  }

  startTimer();
}

function showAnswer() {
  if (!currentQuestion) {
    return;
  }

  const submitted = getSubmittedScore(currentQuestion);
  if (!submitted) {
    document.getElementById("scoreInputError").textContent =
      getEffectiveWinType(currentQuestion) === "tsumo" && currentQuestion.seatWind !== "east"
        ? "子と親、両方の支払点数を入力してください。"
        : "点数を入力してください。";
    return;
  }

  stopTimer();
  submittedAnswer = submitted;
  answerShown = true;
  if (!isReviewMode) {
    saveSessionState();
  }
  renderAnswer(submitted);
}

function showCompletion() {
  currentQuestion = null;
  document.getElementById("questionNumber").textContent =
    `全${questions.length}問終了`;
  document.getElementById("remainingCount").textContent = "残り0問";
  document.getElementById("questionInfo").hidden = true;
  document.getElementById("additionalConditionPanel").hidden = true;
  document.getElementById("practicalFlowPanel").hidden = true;
  document.querySelector(".stage").hidden = true;
  document.getElementById("thinkingMessage").hidden = true;
  document.getElementById("scoreResponsePanel").hidden = true;
  document.getElementById("showAnswerButton").hidden = true;
  document.getElementById("nextQuestionButton").hidden = true;
  document.getElementById("restartFromBeginningButton").hidden = true;
  document.getElementById("returnToSessionButton").hidden = true;
  document.getElementById("answerPanel").hidden = true;
  document.getElementById("completionPanel").hidden = false;

  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn("終了済みセッションの削除に失敗しました。", error);
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function showNextQuestion() {
  if (isReviewMode) {
    returnToNormalSession();
    return;
  }

  if (currentQuestionIndex >= questions.length - 1) {
    showCompletion();
    return;
  }

  currentQuestionIndex += 1;
  answerShown = false;
  submittedAnswer = null;
  resetPracticalQuestionState();
  saveSessionState();
  displayQuestion(getCurrentSessionQuestion());

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function restartSession() {
  isReviewMode = false;
  reviewQuestion = null;
  reviewSessionSnapshot = null;
  createNewSession();
  displayQuestion(getCurrentSessionQuestion());

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function confirmRestartFromBeginning() {
  const confirmed = window.confirm(
    "現在の進捗を破棄して、現在のモードを最初からやり直しますか？\n\n問題の順番と付加条件は再作成されます。"
  );

  if (!confirmed) {
    return;
  }

  restartSession();
}

function summarizeVariationPatterns() {
  const summary = questions.map(question => {
    const patterns = createVariationPatternsForQuestion(question);
    return {
      id: question.id,
      baseFu: question.answer.fu,
      baseHan: question.answer.totalHan,
      patternCount: patterns.length,
      targetTotals: patterns.map(pattern => pattern.totalHan),
      categories: patterns.map(pattern => pattern.score.category)
    };
  });

  console.table(summary);
  return summary;
}

function initializeTrainer() {
  const validationErrors = validateQuestionData();
  if (validationErrors.length > 0) {
    showQuestionDataError(validationErrors);
    return;
  }

  console.info(`Question validation: OK (${questions.length} questions)`);
  summarizeQuestionManagement();
  initializeQuestionSelect();

  if (!loadSessionState()) {
    createNewSession();
  }

  updateModeDisplay();
  displayQuestion(getCurrentSessionQuestion());

  if (answerShown && submittedAnswer) {
    stopTimer();
    renderAnswer(submittedAnswer);
  }
}

document
  .getElementById("showAnswerButton")
  .addEventListener("click", showAnswer);

document
  .getElementById("nextQuestionButton")
  .addEventListener("click", showNextQuestion);

document
  .getElementById("restartSessionButton")
  .addEventListener("click", restartSession);

document
  .getElementById("restartFromBeginningButton")
  .addEventListener("click", confirmRestartFromBeginning);

document
  .getElementById("normalModeButton")
  .addEventListener("click", () => switchMode(MODE_NORMAL));

document
  .getElementById("hanVariationModeButton")
  .addEventListener("click", () => switchMode(MODE_HAN_VARIATION));

document
  .getElementById("practicalModeButton")
  .addEventListener("click", () => switchMode(MODE_PRACTICAL));


document
  .getElementById("startSelectedQuestionButton")
  .addEventListener("click", startSelectedQuestion);

document
  .getElementById("returnToSessionButton")
  .addEventListener("click", returnToNormalSession);

initializeTrainer();
