window.addEventListener("DOMContentLoaded", initialize);

/*
 * 監査項目一覧。
 * 新しい監査を追加する場合は、監査関数を作成してこの配列へ追加する。
 */
const AUDIT_CHECKS = [
  checkDuplicateIds,
  checkRequiredFields
];

/*
 * 現在のquestions.jsで必須とする項目。
 * 配列は空でもよいが、項目自体が存在する必要がある。
 */
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

/*
 * 指定したパスに値が存在し、undefinedまたはnullでないことを確認する。
 * false、0、空文字、空配列は「項目が存在する」と扱う。
 */
function hasRequiredValue(target, fieldPath) {
  const keys = fieldPath.split(".");
  let current = target;

  for (const key of keys) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(current, key)
    ) {
      return false;
    }

    current = current[key];
  }

  return current !== null && current !== undefined;
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
