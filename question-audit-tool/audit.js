window.addEventListener("DOMContentLoaded", initialize);

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
    const auditResults = [
      checkDuplicateIds(questions)
    ];

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

  return {
    name: "問題ID重複チェック",
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

  const statusElement = document.getElementById("auditStatus");
  const errorSection = document.getElementById("errorSection");
  const errorList = document.getElementById("errorList");
  errorList.innerHTML = "";

  if (allErrors.length === 0) {
    statusElement.textContent = "監査が完了しました。エラーは検出されませんでした。";
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
    "questions.jsが同じフォルダにあり、window.MAHJONG_QUESTIONSとして定義されていることを確認してください。";
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
