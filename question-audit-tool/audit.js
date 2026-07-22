window.addEventListener("DOMContentLoaded", () => {
    initialize();
});

function initialize() {
    loadQuestions();

    document
        .getElementById("auditButton")
        .addEventListener("click", startAudit);
}

function loadQuestions() {
    const countElement = document.getElementById("questionCount");
    const listElement = document.getElementById("questionList");
    const resultElement = document.getElementById("auditResult");

    const questions = window.MAHJONG_QUESTIONS;

    if (!Array.isArray(questions)) {
        countElement.textContent = "0";
        resultElement.textContent =
            "questions.jsを読み込めませんでした。\n" +
            "questions.jsが同じフォルダにあり、index.htmlから正しく参照されているか確認してください。";
        return;
    }

    countElement.textContent = questions.length;
    listElement.innerHTML = "";

    questions.forEach((question) => {
        const li = document.createElement("li");
        li.textContent = question.id;
        listElement.appendChild(li);
    });

    resultElement.textContent = "監査準備完了";
}

function startAudit() {
    document
        .getElementById("auditResult")
        .textContent = "Ver0.1では監査処理は未実装です。";
}