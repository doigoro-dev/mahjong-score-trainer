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
  checkCalculatedScoreCategory
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
