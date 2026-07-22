window.addEventListener("DOMContentLoaded", initialize);

const AUDIT_CHECKS = [
  checkDuplicateIds,
  checkRequiredFields,
  checkHanConsistency,
  checkFuConsistency,
  checkScoreCategoryConsistency,
  checkKiriageManganConsistency,
  checkYakuHanTotal,
  checkYakuListConsistency,
  checkCalculatedScoreCategory,
  checkFinalScoreDisplay,
  checkTileCodesAndCounts
];

const REQUIRED_FIELD_PATHS = [
  "id",
  "concealedTiles",
  "winningTile",
  "winType",
  "roundWind",
  "seatWind",
  "riichi",
  "menzen",
  "answer",
  "answer.yaku",
  "answer.totalHan",
  "answer.fu",
  "answer.score",
  "answer.score.display",
  "answer.score.pointText",
  "answer.score.category",
  "answer.score.basePoints",
  "answer.score.kiriageMangan",
  "answer.fuBreakdown",
  "management",
  "management.fu",
  "management.han",
  "management.scoreCategory",
  "management.playerType",
  "management.winType",
  "management.waitType",
  "management.mainYaku",
  "management.kiriageMangan",
  "doraIndicators",
  "uraDoraIndicators"
];

function initialize() {
  const questions = getQuestions();

  renderQuestionData(questions);

  document
    .getElementById("auditButton")
    .addEventListener("click", () => runAudit(questions));
}

function getQuestions() {
  if (!Array.isArray(window.MAHJONG_QUESTIONS)) {
    renderLoadError();
    return [];
  }

  return window.MAHJONG_QUESTIONS;
}

function renderQuestionData(questions) {
  document.getElementById("questionCount").textContent = questions.length;

  const listElement = document.getElementById("questionList");
  listElement.innerHTML = "";

  questions.forEach((question, index) => {
    const item = document.createElement("li");

    item.textContent =
      typeof question?.id === "string" && question.id.length > 0
        ? question.id
        : `(IDなし: ${index + 1}件目)`;

    listElement.appendChild(item);
  });
}

function runAudit(questions) {
  if (questions.length === 0) {
    renderLoadError();
    return;
  }

  const auditButton = document.getElementById("auditButton");
  auditButton.disabled = true;

  try {
    const auditResults = AUDIT_CHECKS.map((auditCheck) =>
      auditCheck(questions)
    );

    renderAuditResults(auditResults);
  } catch (error) {
    console.error(error);
    renderUnexpectedError(error);
  } finally {
    auditButton.disabled = false;
  }
}

function checkDuplicateIds(questions) {
  const idCounts = new Map();

  questions.forEach((question) => {
    const id = question?.id;

    if (typeof id !== "string" || id.length === 0) {
      return;
    }

    idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  });

  const errors = [];

  idCounts.forEach((count, id) => {
    if (count > 1) {
      errors.push(`${id} が ${count}件登録されています。`);
    }
  });

  return createAuditResult("問題ID重複チェック", errors);
}

function checkRequiredFields(questions) {
  const errors = [];

  questions.forEach((question, index) => {
    const questionLabel = getQuestionLabel(question, index);

    REQUIRED_FIELD_PATHS.forEach((fieldPath) => {
      if (!hasRequiredValue(question, fieldPath)) {
        errors.push(`${questionLabel}: 必須項目「${fieldPath}」がありません。`);
      }
    });
  });

  return createAuditResult("必須項目チェック", errors);
}

function checkHanConsistency(questions) {
  return checkFieldConsistency(
    questions,
    "翻数整合性チェック",
    "answer.totalHan",
    "management.han"
  );
}

function checkFuConsistency(questions) {
  return checkFieldConsistency(
    questions,
    "符整合性チェック",
    "answer.fu",
    "management.fu"
  );
}

function checkScoreCategoryConsistency(questions) {
  return checkFieldConsistency(
    questions,
    "点数カテゴリ整合性チェック",
    "answer.score.category",
    "management.scoreCategory"
  );
}

function checkKiriageManganConsistency(questions) {
  return checkFieldConsistency(
    questions,
    "切り上げ満貫整合性チェック",
    "answer.score.kiriageMangan",
    "management.kiriageMangan"
  );
}

function checkYakuHanTotal(questions) {
  const errors = [];

  questions.forEach((question, index) => {
    const questionLabel = getQuestionLabel(question, index);
    const yakuList = getValueByPath(question, "answer.yaku");
    const totalHan = getValueByPath(question, "answer.totalHan");

    if (!Array.isArray(yakuList) || totalHan === undefined || totalHan === null) {
      return;
    }

    let calculatedHan = 0;
    let hasInvalidYaku = false;

    yakuList.forEach((yaku, yakuIndex) => {
      if (
        yaku === null ||
        typeof yaku !== "object" ||
        typeof yaku.name !== "string" ||
        yaku.name.length === 0 ||
        typeof yaku.han !== "number" ||
        !Number.isFinite(yaku.han)
      ) {
        errors.push(
          `${questionLabel}: answer.yaku[${yakuIndex}]の` +
          "nameまたはhanが正しくありません。"
        );
        hasInvalidYaku = true;
        return;
      }

      calculatedHan += yaku.han;
    });

    if (!hasInvalidYaku && calculatedHan !== totalHan) {
      const breakdown = yakuList
        .map((yaku) => `${yaku.name}:${yaku.han}翻`)
        .join(" + ");

      errors.push(
        `${questionLabel}: 役の翻数合計=${calculatedHan}翻 / ` +
        `answer.totalHan=${formatValue(totalHan)} ` +
        `（${breakdown}）`
      );
    }
  });

  return createAuditResult("役の翻数合計チェック", errors);
}

function checkYakuListConsistency(questions) {
  const errors = [];

  questions.forEach((question, index) => {
    const questionLabel = getQuestionLabel(question, index);
    const yakuList = getValueByPath(question, "answer.yaku");
    const mainYaku = getValueByPath(question, "management.mainYaku");

    if (!Array.isArray(yakuList) || !Array.isArray(mainYaku)) {
      return;
    }

    const answerYakuNames = [];
    let hasInvalidYaku = false;

    yakuList.forEach((yaku, yakuIndex) => {
      if (
        yaku === null ||
        typeof yaku !== "object" ||
        typeof yaku.name !== "string" ||
        yaku.name.length === 0
      ) {
        errors.push(
          `${questionLabel}: answer.yaku[${yakuIndex}].nameが正しくありません。`
        );
        hasInvalidYaku = true;
        return;
      }

      answerYakuNames.push(yaku.name);
    });

    if (hasInvalidYaku) {
      return;
    }

    if (!areArraysEqual(answerYakuNames, mainYaku)) {
      errors.push(
        `${questionLabel}: ` +
        `answer.yaku=${formatArray(answerYakuNames)} / ` +
        `management.mainYaku=${formatArray(mainYaku)}`
      );
    }
  });

  return createAuditResult("役一覧整合性チェック", errors);
}


function checkCalculatedScoreCategory(questions) {
  const errors = [];

  questions.forEach((question, index) => {
    const questionLabel = getQuestionLabel(question, index);
    const fu = getValueByPath(question, "answer.fu");
    const han = getValueByPath(question, "answer.totalHan");
    const registeredCategory = getValueByPath(
      question,
      "answer.score.category"
    );

    if (
      typeof fu !== "number" ||
      !Number.isFinite(fu) ||
      typeof han !== "number" ||
      !Number.isFinite(han) ||
      typeof registeredCategory !== "string"
    ) {
      return;
    }

    const calculatedCategory = calculateScoreCategory(fu, han);

    if (calculatedCategory !== registeredCategory) {
      errors.push(
        `${questionLabel}: ${fu}符${han}翻 / ` +
        `計算したカテゴリ="${calculatedCategory}" / ` +
        `answer.score.category="${registeredCategory}"`
      );
    }
  });

  return createAuditResult("点数カテゴリ計算チェック", errors);
}

function calculateScoreCategory(fu, han) {
  if (han >= 13) {
    return "数え役満";
  }

  if (han >= 11) {
    return "三倍満";
  }

  if (han >= 8) {
    return "倍満";
  }

  if (han >= 6) {
    return "跳満";
  }

  if (han >= 5) {
    return "満貫";
  }

  const isKiriageMangan =
    (fu === 30 && han === 4) ||
    (fu === 60 && han === 3);

  if (isKiriageMangan) {
    return "切り上げ満貫";
  }

  const rawBasePoints = fu * (2 ** (han + 2));

  if (rawBasePoints >= 2000) {
    return "満貫";
  }

  return "通常";
}


function checkFinalScoreDisplay(questions) {
  const errors = [];

  questions.forEach((question, index) => {
    const questionLabel = getQuestionLabel(question, index);
    const fu = getValueByPath(question, "answer.fu");
    const han = getValueByPath(question, "answer.totalHan");
    const playerType = getValueByPath(question, "management.playerType");
    const winType = getValueByPath(question, "winType");
    const category = getValueByPath(question, "answer.score.category");
    const registeredPointText = getValueByPath(
      question,
      "answer.score.pointText"
    );
    const registeredDisplay = getValueByPath(
      question,
      "answer.score.display"
    );

    if (
      typeof fu !== "number" ||
      !Number.isFinite(fu) ||
      typeof han !== "number" ||
      !Number.isFinite(han) ||
      !["親", "子"].includes(playerType) ||
      !["ron", "tsumo"].includes(winType) ||
      typeof category !== "string" ||
      typeof registeredPointText !== "string" ||
      typeof registeredDisplay !== "string"
    ) {
      return;
    }

    const expected = calculateFinalScoreDisplay(
      fu,
      han,
      playerType,
      winType,
      category
    );

    if (registeredPointText !== expected.pointText) {
      errors.push(
        `${questionLabel}: answer.score.pointText=` +
        `"${registeredPointText}" / 正しい値="${expected.pointText}"`
      );
    }

    const allowedDisplays = [
      expected.pointText,
      `${category}（${expected.pointText}）`
    ];

    if (!allowedDisplays.includes(registeredDisplay)) {
      errors.push(
        `${questionLabel}: answer.score.display=` +
        `"${registeredDisplay}" / 正しい値候補=` +
        `"${allowedDisplays.join('" または "')}"`
      );
    }
  });

  return createAuditResult("最終点数表示チェック", errors);
}

function calculateFinalScoreDisplay(
  fu,
  han,
  playerType,
  winType,
  category
) {
  const basePoints = calculateBasePointsForScore(fu, han, category);
  let pointText;

  if (winType === "ron") {
    const multiplier = playerType === "親" ? 6 : 4;
    const ronPoints = roundUpToHundred(basePoints * multiplier);
    pointText = `${ronPoints}点`;
  } else if (playerType === "親") {
    const payment = roundUpToHundred(basePoints * 2);
    pointText = `${payment}点オール`;
  } else {
    const childPayment = roundUpToHundred(basePoints);
    const dealerPayment = roundUpToHundred(basePoints * 2);
    pointText = `${childPayment}点／${dealerPayment}点`;
  }

  return {
    pointText
  };
}

function calculateBasePointsForScore(fu, han, category) {
  const limitBasePoints = {
    "切り上げ満貫": 2000,
    "満貫": 2000,
    "跳満": 3000,
    "倍満": 4000,
    "三倍満": 6000,
    "数え役満": 8000
  };

  if (Object.prototype.hasOwnProperty.call(limitBasePoints, category)) {
    return limitBasePoints[category];
  }

  return fu * (2 ** (han + 2));
}

function roundUpToHundred(points) {
  return Math.ceil(points / 100) * 100;
}


const VALID_TILE_CODES = new Set([
  "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m",
  "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p",
  "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s",
  "east", "south", "west", "north",
  "white", "green", "red"
]);

function checkTileCodesAndCounts(questions) {
  const errors = [];

  questions.forEach((question, index) => {
    const questionLabel = getQuestionLabel(question, index);
    const concealedTiles = question?.concealedTiles;
    const winningTile = question?.winningTile;
    const concealedKans =
      question?.concealedKans === undefined
        ? []
        : question.concealedKans;

    let canCheckCounts = true;

    if (!Array.isArray(concealedTiles)) {
      errors.push(
        `${questionLabel}: concealedTilesが配列ではありません。`
      );
      canCheckCounts = false;
    }

    if (typeof winningTile !== "string") {
      errors.push(
        `${questionLabel}: winningTileが文字列ではありません。`
      );
      canCheckCounts = false;
    }

    if (!Array.isArray(concealedKans)) {
      errors.push(
        `${questionLabel}: concealedKansが配列ではありません。`
      );
      canCheckCounts = false;
    }

    if (!canCheckCounts) {
      return;
    }

    validateTileCodeList(
      errors,
      questionLabel,
      "concealedTiles",
      concealedTiles
    );

    validateTileCodeList(
      errors,
      questionLabel,
      "concealedKans",
      concealedKans
    );

    if (!VALID_TILE_CODES.has(winningTile)) {
      errors.push(
        `${questionLabel}: winningTileに無効な牌コード` +
        `「${formatValue(winningTile)}」があります。`
      );
    }

    const structuralTileCount =
      concealedTiles.length +
      1 +
      concealedKans.length * 3;

    if (structuralTileCount !== 14) {
      errors.push(
        `${questionLabel}: 和了形の構成枚数=${structuralTileCount}枚 / ` +
        "正しい枚数=14枚 " +
        `（concealedTiles=${concealedTiles.length}枚、` +
        `winningTile=1枚、暗槓=${concealedKans.length}組×3枚換算）`
      );
    }

    const physicalTileCounts = new Map();

    concealedTiles.forEach((tileCode) => {
      addTileCount(physicalTileCounts, tileCode, 1);
    });

    addTileCount(physicalTileCounts, winningTile, 1);

    concealedKans.forEach((tileCode) => {
      addTileCount(physicalTileCounts, tileCode, 4);
    });

    physicalTileCounts.forEach((count, tileCode) => {
      if (VALID_TILE_CODES.has(tileCode) && count > 4) {
        errors.push(
          `${questionLabel}: 同一牌「${tileCode}」が` +
          `${count}枚あります。上限は4枚です。`
        );
      }
    });
  });

  return createAuditResult("牌コード・牌枚数チェック", errors);
}

function validateTileCodeList(
  errors,
  questionLabel,
  fieldName,
  tileCodes
) {
  tileCodes.forEach((tileCode, tileIndex) => {
    if (typeof tileCode !== "string" || !VALID_TILE_CODES.has(tileCode)) {
      errors.push(
        `${questionLabel}: ${fieldName}[${tileIndex}]に` +
        `無効な牌コード「${formatValue(tileCode)}」があります。`
      );
    }
  });
}

function addTileCount(tileCounts, tileCode, amount) {
  if (typeof tileCode !== "string") {
    return;
  }

  tileCounts.set(
    tileCode,
    (tileCounts.get(tileCode) ?? 0) + amount
  );
}

function checkFieldConsistency(
  questions,
  checkName,
  answerPath,
  managementPath
) {
  const errors = [];

  questions.forEach((question, index) => {
    const answerValue = getValueByPath(question, answerPath);
    const managementValue = getValueByPath(question, managementPath);

    if (
      answerValue === undefined ||
      answerValue === null ||
      managementValue === undefined ||
      managementValue === null
    ) {
      return;
    }

    if (!Object.is(answerValue, managementValue)) {
      const questionLabel = getQuestionLabel(question, index);

      errors.push(
        `${questionLabel}: ` +
        `${answerPath}=${formatValue(answerValue)} / ` +
        `${managementPath}=${formatValue(managementValue)}`
      );
    }
  });

  return createAuditResult(checkName, errors);
}

function areArraysEqual(first, second) {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((value, index) => value === second[index]);
}

function getValueByPath(target, fieldPath) {
  const keys = fieldPath.split(".");
  let current = target;

  for (const key of keys) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(current, key)
    ) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function hasRequiredValue(target, fieldPath) {
  const value = getValueByPath(target, fieldPath);
  return value !== null && value !== undefined;
}

function formatValue(value) {
  if (typeof value === "string") {
    return `"${value}"`;
  }

  return String(value);
}

function formatArray(values) {
  return `[${values.map((value) => `"${value}"`).join(", ")}]`;
}

function getQuestionLabel(question, index) {
  if (typeof question?.id === "string" && question.id.length > 0) {
    return question.id;
  }

  return `${index + 1}件目の問題`;
}

function createAuditResult(name, errors) {
  return {
    name,
    success: errors.length === 0,
    errors
  };
}

function renderAuditResults(auditResults) {
  const successCount = auditResults.filter((result) => result.success).length;
  const failureCount = auditResults.length - successCount;

  const allErrors = auditResults.flatMap((result) =>
    result.errors.map((message) => ({
      checkName: result.name,
      message
    }))
  );

  document.getElementById("checkCount").textContent = auditResults.length;
  document.getElementById("successCount").textContent = successCount;
  document.getElementById("failureCount").textContent = failureCount;
  document.getElementById("errorCount").textContent = allErrors.length;
  document.getElementById("auditSummary").hidden = false;

  renderCheckList(auditResults);
  renderErrorList(allErrors);
}

function renderCheckList(auditResults) {
  const checkList = document.getElementById("auditCheckList");
  checkList.innerHTML = "";

  auditResults.forEach((result) => {
    const item = document.createElement("div");
    const name = document.createElement("span");
    const status = document.createElement("span");

    item.className = "audit-check-item";
    name.className = "audit-check-name";
    status.className =
      `audit-check-result ${result.success ? "result-ok" : "result-ng"}`;

    name.textContent = result.name;
    status.textContent = result.success ? "OK" : "NG";

    item.append(name, status);
    checkList.appendChild(item);
  });
}

function renderErrorList(allErrors) {
  const statusElement = document.getElementById("auditStatus");
  const errorSection = document.getElementById("errorSection");
  const errorList = document.getElementById("errorList");

  errorList.innerHTML = "";

  if (allErrors.length === 0) {
    statusElement.textContent =
      "監査が完了しました。エラーは検出されませんでした。";
    statusElement.className = "status-message status-success";
    errorSection.hidden = true;
    return;
  }

  statusElement.textContent =
    `監査が完了しました。${allErrors.length}件のエラーを検出しました。`;
  statusElement.className = "status-message status-error";

  allErrors.forEach((error) => {
    const item = document.createElement("li");

    item.textContent = `【${error.checkName}】${error.message}`;
    errorList.appendChild(item);
  });

  errorSection.hidden = false;
}

function renderLoadError() {
  document.getElementById("questionCount").textContent = "0";

  const statusElement = document.getElementById("auditStatus");

  statusElement.textContent =
    "questions.jsを読み込めませんでした。\n" +
    "questions.jsが同じフォルダにあり、" +
    "window.MAHJONG_QUESTIONSとして定義されていることを確認してください。";

  statusElement.className = "status-message status-error";
  document.getElementById("auditButton").disabled = true;
}

function renderUnexpectedError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const statusElement = document.getElementById("auditStatus");

  statusElement.textContent =
    `監査中に予期しないエラーが発生しました。\n${message}`;

  statusElement.className = "status-message status-error";
}
