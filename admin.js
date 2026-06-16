(function () {
  "use strict";

  const IMPACT_EVENTS_KEY = "faaImpactEvents";
  const DONATIONS_KEY = "faaDonationRecords";

  const CAUSES = {
    rice: { label: "Rice", unit: "grain", unitPlural: "grains", perAnswer: 10 },
    beans: { label: "Beans", unit: "bean", unitPlural: "beans", perAnswer: 1 },
    kibble: { label: "Kibble", unit: "kibble piece", unitPlural: "kibble pieces", perAnswer: 1 },
    ocean: { label: "Ocean Plastic Cleanup", unit: "plastic item", unitPlural: "plastic items", perAnswer: 1 },
    trees: { label: "Plant Trees", unit: "tree answer", unitPlural: "tree answers", perAnswer: 1 }
  };

  const els = {
    periodFilter: document.getElementById("period-filter"),
    causeFilter: document.getElementById("cause-filter"),
    startDate: document.getElementById("start-date"),
    endDate: document.getElementById("end-date"),
    summaryCards: document.getElementById("summary-cards"),
    impactTableBody: document.getElementById("impact-table-body"),
    donationTableBody: document.getElementById("donation-table-body"),
    donationForm: document.getElementById("donation-form"),
    donationCause: document.getElementById("donation-cause"),
    donationAmount: document.getElementById("donation-amount"),
    donationDate: document.getElementById("donation-date"),
    donationThrough: document.getElementById("donation-through"),
    donationNote: document.getElementById("donation-note"),
    exportData: document.getElementById("export-data")
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const today = formatLocalDate(new Date());
    els.endDate.value = today;
    els.donationDate.value = today;
    els.donationThrough.value = today;
    applyPeriodPreset();
    bindEvents();
    renderDashboard();
  }

  function bindEvents() {
    [els.periodFilter, els.causeFilter, els.startDate, els.endDate].forEach((control) => {
      control.addEventListener("change", () => {
        if (control === els.periodFilter) {
          applyPeriodPreset();
        } else {
          els.periodFilter.value = "custom";
        }
        renderDashboard();
      });
    });

    els.donationForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveDonationRecord();
    });

    els.donationTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete-donation]");
      if (!button) { return; }
      deleteDonationRecord(button.dataset.deleteDonation);
    });

    els.exportData.addEventListener("click", exportData);
  }

  function applyPeriodPreset() {
    const now = new Date();
    const today = stripTime(now);
    const period = els.periodFilter.value;
    let start = new Date(today);
    let end = new Date(today);

    if (period === "today") {
      start = today;
    } else if (period === "7" || period === "30" || period === "90") {
      start.setDate(start.getDate() - (Number(period) - 1));
    } else if (period === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (period === "all") {
      els.startDate.value = "";
      els.endDate.value = "";
      return;
    } else {
      return;
    }

    els.startDate.value = formatLocalDate(start);
    els.endDate.value = formatLocalDate(end);
  }

  function renderDashboard() {
    const range = currentRange();
    const selectedCause = els.causeFilter.value;
    const events = loadEvents().filter((event) => inRange(event.day, range) && matchesCause(event.cause, selectedCause));
    const donations = loadDonations();
    const filteredDonations = donations.filter((record) => inRange(record.donationDate, range) && matchesCause(record.cause, selectedCause));
    const allTimeDonations = donations.filter((record) => matchesCause(record.cause, selectedCause));
    const totals = summarizeEvents(events);
    const donationTotals = summarizeDonations(allTimeDonations);

    renderSummaryCards(totals, donationTotals, events.length);
    renderImpactTable(totals, donationTotals);
    renderDonationHistory(filteredDonations);
  }

  function summarizeEvents(events) {
    const totals = emptyCauseTotals();
    events.forEach((event) => {
      const cause = CAUSES[event.cause] ? event.cause : "beans";
      totals[cause].answers += Number(event.correctAnswers) || 0;
      totals[cause].units += Number(event.units) || 0;
      totals[cause].treesPlanted += Number(event.treesPlanted) || 0;
    });
    return totals;
  }

  function summarizeDonations(records) {
    const totals = emptyCauseTotals();
    records.forEach((record) => {
      if (!CAUSES[record.cause]) { return; }
      totals[record.cause].donated += Number(record.amount) || 0;
      if (!totals[record.cause].through || record.throughDate > totals[record.cause].through) {
        totals[record.cause].through = record.throughDate;
      }
    });
    return totals;
  }

  function emptyCauseTotals() {
    return Object.keys(CAUSES).reduce((totals, cause) => {
      totals[cause] = { answers: 0, units: 0, treesPlanted: 0, donated: 0, through: "" };
      return totals;
    }, {});
  }

  function renderSummaryCards(totals, donations, eventCount) {
    const answers = sumBy(totals, "answers");
    const rice = totals.rice.units;
    const trees = totals.trees.answers;
    const planted = totals.trees.treesPlanted || Math.floor(totals.trees.answers / 100);
    const donatedCount = sumBy(donations, "donated");

    els.summaryCards.innerHTML = [
      summaryCard("Correct Answers", formatNumber(answers), eventCount + " recorded events"),
      summaryCard("Rice Earned", formatNumber(rice), pluralize(rice, "grain", "grains")),
    summaryCard("Tree Answers", formatNumber(trees), formatNumber(planted) + " " + pluralize(planted, "planted marker", "planted markers")),
      summaryCard("Donation Units Marked", formatNumber(donatedCount), "Across recorded initiatives")
    ].join("");
  }

  function summaryCard(label, value, detail) {
    return '<article class="admin-card"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong><small>' + escapeHtml(detail) + '</small></article>';
  }

  function renderImpactTable(totals, donations) {
    const rows = Object.keys(CAUSES)
      .filter((cause) => matchesCause(cause, els.causeFilter.value))
      .map((cause) => {
        const meta = CAUSES[cause];
        const earnedUnits = cause === "trees" ? totals[cause].answers : totals[cause].units;
        const donated = donations[cause].donated;
        const remaining = Math.max(0, earnedUnits - donated);
        const impactText = cause === "trees"
          ? formatNumber(totals[cause].answers) + " " + pluralize(totals[cause].answers, "tree answer", "tree answers") + " / " + formatNumber(Math.floor(totals[cause].answers / 100)) + " " + pluralize(Math.floor(totals[cause].answers / 100), "tree", "trees")
          : formatNumber(earnedUnits) + " " + pluralize(earnedUnits, meta.unit, meta.unitPlural);

        return '<tr>' +
          '<td><span class="tag-mark tag-mark--' + cause + '" aria-hidden="true"></span><strong>' + escapeHtml(meta.label) + '</strong></td>' +
          '<td>' + formatNumber(totals[cause].answers) + '</td>' +
          '<td>' + escapeHtml(impactText) + '</td>' +
          '<td>' + formatNumber(donated) + '</td>' +
          '<td>' + formatNumber(remaining) + '</td>' +
          '<td>' + escapeHtml(donations[cause].through || "Not marked") + '</td>' +
        '</tr>';
      });

    els.impactTableBody.innerHTML = rows.join("") || emptyRow("No impact events in this range.", 6);
  }

  function renderDonationHistory(records) {
    const rows = records
      .slice()
      .sort((a, b) => b.donationDate.localeCompare(a.donationDate))
      .map((record) => {
        const meta = CAUSES[record.cause] || CAUSES.beans;
        return '<tr>' +
          '<td>' + escapeHtml(record.donationDate) + '</td>' +
          '<td><span class="tag-mark tag-mark--' + record.cause + '" aria-hidden="true"></span>' + escapeHtml(meta.label) + '</td>' +
          '<td>' + formatNumber(record.amount) + " " + escapeHtml(pluralize(record.amount, meta.unit, meta.unitPlural)) + '</td>' +
          '<td>' + escapeHtml(record.throughDate) + '</td>' +
          '<td>' + escapeHtml(record.note || "") + '</td>' +
          '<td><button class="text-button" type="button" data-delete-donation="' + escapeHtml(record.id) + '">Delete</button></td>' +
        '</tr>';
      });

    els.donationTableBody.innerHTML = rows.join("") || emptyRow("No donation records for this view.", 6);
  }

  function saveDonationRecord() {
    const cause = els.donationCause.value;
    const amount = Math.max(0, Number.parseInt(els.donationAmount.value, 10) || 0);
    if (!CAUSES[cause] || amount <= 0 || !els.donationDate.value || !els.donationThrough.value) {
      return;
    }

    const records = loadDonations();
    records.push({
      id: "donation-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      cause,
      amount,
      donationDate: els.donationDate.value,
      throughDate: els.donationThrough.value,
      note: els.donationNote.value.trim()
    });
    saveDonations(records);
    els.donationAmount.value = "";
    els.donationNote.value = "";
    renderDashboard();
  }

  function deleteDonationRecord(id) {
    const records = loadDonations().filter((record) => record.id !== id);
    saveDonations(records);
    renderDashboard();
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      impactEvents: loadEvents(),
      donationRecords: loadDonations()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "free-aid-impact-export-" + formatLocalDate(new Date()) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function currentRange() {
    return {
      start: els.startDate.value || "",
      end: els.endDate.value || ""
    };
  }

  function inRange(day, range) {
    if (!day) { return false; }
    if (range.start && day < range.start) { return false; }
    if (range.end && day > range.end) { return false; }
    return true;
  }

  function matchesCause(cause, selectedCause) {
    return selectedCause === "all" || cause === selectedCause;
  }

  function loadEvents() {
    try {
      const events = JSON.parse(window.localStorage.getItem(IMPACT_EVENTS_KEY) || "[]");
      return Array.isArray(events) ? events : [];
    } catch (error) {
      return [];
    }
  }

  function loadDonations() {
    try {
      const records = JSON.parse(window.localStorage.getItem(DONATIONS_KEY) || "[]");
      return Array.isArray(records) ? records : [];
    } catch (error) {
      return [];
    }
  }

  function saveDonations(records) {
    window.localStorage.setItem(DONATIONS_KEY, JSON.stringify(records));
  }

  function stripTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(Number(value) || 0);
  }

  function pluralize(value, singular, plural) {
    return Number(value) === 1 ? singular : plural;
  }

  function sumBy(totals, key) {
    return Object.keys(totals).reduce((sum, cause) => sum + (Number(totals[cause][key]) || 0), 0);
  }

  function emptyRow(message, columns) {
    return '<tr><td colspan="' + columns + '" class="empty-table">' + escapeHtml(message) + '</td></tr>';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
