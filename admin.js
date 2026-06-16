(function () {
  "use strict";

  const SUPABASE_URL = "https://wuofhyiliyzysnbntpij.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_zJo43n1hDzntqe5NHfd42Q_SAmlB1aN";
  const ADMIN_EMAIL = "rob.heathincometax@gmail.com";

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const CAUSES = {
    rice:   { label: "Rice",                 unit: "grain",        unitPlural: "grains",        perAnswer: 10 },
    beans:  { label: "Beans",                unit: "bean",         unitPlural: "beans",         perAnswer: 1  },
    kibble: { label: "Kibble",               unit: "kibble piece", unitPlural: "kibble pieces", perAnswer: 1  },
    ocean:  { label: "Ocean Plastic Cleanup",unit: "plastic item", unitPlural: "plastic items", perAnswer: 1  },
    trees:  { label: "Plant Trees",          unit: "tree answer",  unitPlural: "tree answers",  perAnswer: 1  }
  };

  const els = {
    authOverlay:    document.getElementById("auth-overlay"),
    authStepEmail:  document.getElementById("auth-step-email"),
    authStepOtp:    document.getElementById("auth-step-otp"),
    loginForm:      document.getElementById("login-form"),
    loginEmail:     document.getElementById("login-email"),
    otpForm:        document.getElementById("otp-form"),
    loginOtp:       document.getElementById("login-otp"),
    backToEmail:    document.getElementById("back-to-email"),
    loginMessage:   document.getElementById("login-message"),
    logoutBtn:      document.getElementById("logout-btn"),
    adminShell:     document.querySelector(".admin-shell"),
    periodFilter:   document.getElementById("period-filter"),
    causeFilter:    document.getElementById("cause-filter"),
    startDate:      document.getElementById("start-date"),
    endDate:        document.getElementById("end-date"),
    summaryCards:   document.getElementById("summary-cards"),
    impactTableBody:    document.getElementById("impact-table-body"),
    donationTableBody:  document.getElementById("donation-table-body"),
    donationForm:   document.getElementById("donation-form"),
    donationCause:  document.getElementById("donation-cause"),
    donationAmount: document.getElementById("donation-amount"),
    donationDate:   document.getElementById("donation-date"),
    donationThrough:document.getElementById("donation-through"),
    donationNote:   document.getElementById("donation-note"),
    exportData:     document.getElementById("export-data")
  };

  let pendingEmail = "";
  let dashboardReady = false;

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bindAuthEvents();

    db.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN")  handleSession(session);
      if (event === "SIGNED_OUT") showLogin();
    });

    const { data: { session } } = await db.auth.getSession();
    handleSession(session);
  }

  function handleSession(session) {
    if (!session) { showLogin(); return; }
    if (session.user.email !== ADMIN_EMAIL) {
      db.auth.signOut();
      showLogin("Access denied.");
      return;
    }
    showDashboard();
  }

  function showLogin(message) {
    els.authOverlay.hidden = false;
    els.adminShell.hidden = true;
    els.logoutBtn.hidden = true;
    setMessage(message || "");
  }

  function showDashboard() {
    els.authOverlay.hidden = true;
    els.adminShell.hidden = false;
    els.logoutBtn.hidden = false;

    if (!dashboardReady) {
      dashboardReady = true;
      const today = formatLocalDate(new Date());
      els.endDate.value = today;
      els.donationDate.value = today;
      els.donationThrough.value = today;
      bindDashboardEvents();
    }

    applyPeriodPreset();
    renderDashboard();
  }

  // ── Auth ─────────────────────────────────────────────────────

  function bindAuthEvents() {
    els.loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      pendingEmail = els.loginEmail.value.trim();
      setMessage("Sending code…");
      const { error } = await db.auth.signInWithOtp({
        email: pendingEmail,
        options: { shouldCreateUser: true }
      });
      if (error) {
        setMessage("Error: " + error.message);
      } else {
        els.authStepEmail.hidden = true;
        els.authStepOtp.hidden = false;
        setMessage("Code sent — check your email.");
        els.loginOtp.focus();
      }
    });

    els.otpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      setMessage("Verifying…");
      const { error } = await db.auth.verifyOtp({
        email: pendingEmail,
        token: els.loginOtp.value.trim(),
        type: "email"
      });
      if (error) setMessage("Invalid or expired code. Try again.");
    });

    els.backToEmail.addEventListener("click", () => {
      els.authStepEmail.hidden = false;
      els.authStepOtp.hidden = true;
      els.loginOtp.value = "";
      setMessage("");
    });

    els.logoutBtn.addEventListener("click", () => db.auth.signOut());
  }

  function setMessage(text) {
    els.loginMessage.textContent = text;
  }

  // ── Dashboard ─────────────────────────────────────────────────

  function bindDashboardEvents() {
    [els.periodFilter, els.causeFilter, els.startDate, els.endDate].forEach((control) => {
      control.addEventListener("change", () => {
        if (control === els.periodFilter) applyPeriodPreset();
        else els.periodFilter.value = "custom";
        renderDashboard();
      });
    });

    els.donationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveDonationRecord();
    });

    els.donationTableBody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-delete-donation]");
      if (btn) deleteDonationRecord(btn.dataset.deleteDonation);
    });

    els.exportData.addEventListener("click", exportData);
  }

  function applyPeriodPreset() {
    const today = stripTime(new Date());
    const period = els.periodFilter.value;
    let start = new Date(today);

    if (period === "today") {
      // start = today
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
    els.endDate.value = formatLocalDate(today);
  }

  async function renderDashboard() {
    const range = currentRange();
    const selectedCause = els.causeFilter.value;

    const [events, allDonations] = await Promise.all([
      loadEvents(range, selectedCause),
      loadDonations()
    ]);

    const filteredDonations = allDonations.filter((r) =>
      inRange(r.donation_date, range) && matchesCause(r.cause, selectedCause));
    const allTimeDonations = allDonations.filter((r) =>
      matchesCause(r.cause, selectedCause));

    const totals = summarizeEvents(events);
    const donationTotals = summarizeDonations(allTimeDonations);

    renderSummaryCards(totals, donationTotals, events.length);
    renderImpactTable(totals, donationTotals);
    renderDonationHistory(filteredDonations);
  }

  // ── Data fetching ─────────────────────────────────────────────

  async function loadEvents(range, cause) {
    let query = db.from("quiz_events").select("*");
    if (range.start) query = query.gte("day", range.start);
    if (range.end)   query = query.lte("day", range.end);
    if (cause && cause !== "all") query = query.eq("cause", cause);
    const { data } = await query;
    return data || [];
  }

  async function loadDonations() {
    const { data } = await db
      .from("donations")
      .select("*")
      .order("donation_date", { ascending: false });
    return data || [];
  }

  // ── Summarise ─────────────────────────────────────────────────

  function summarizeEvents(events) {
    const totals = emptyCauseTotals();
    events.forEach((ev) => {
      const cause = CAUSES[ev.cause] ? ev.cause : "beans";
      totals[cause].answers      += Number(ev.correct_answers) || 0;
      totals[cause].units        += Number(ev.units)           || 0;
      totals[cause].treesPlanted += Number(ev.trees_planted)   || 0;
    });
    return totals;
  }

  function summarizeDonations(records) {
    const totals = emptyCauseTotals();
    records.forEach((r) => {
      if (!CAUSES[r.cause]) return;
      totals[r.cause].donated += Number(r.amount) || 0;
      if (!totals[r.cause].through || r.through_date > totals[r.cause].through) {
        totals[r.cause].through = r.through_date;
      }
    });
    return totals;
  }

  function emptyCauseTotals() {
    return Object.keys(CAUSES).reduce((acc, cause) => {
      acc[cause] = { answers: 0, units: 0, treesPlanted: 0, donated: 0, through: "" };
      return acc;
    }, {});
  }

  // ── Render ────────────────────────────────────────────────────

  function renderSummaryCards(totals, donations, eventCount) {
    const answers     = sumBy(totals, "answers");
    const rice        = totals.rice.units;
    const trees       = totals.trees.answers;
    const planted     = totals.trees.treesPlanted || Math.floor(trees / 100);
    const donatedCount = sumBy(donations, "donated");

    els.summaryCards.innerHTML = [
      summaryCard("Correct Answers",       formatNumber(answers),       eventCount + " recorded events"),
      summaryCard("Rice Earned",           formatNumber(rice),           pluralize(rice, "grain", "grains")),
      summaryCard("Tree Answers",          formatNumber(trees),          formatNumber(planted) + " " + pluralize(planted, "planted marker", "planted markers")),
      summaryCard("Donation Units Marked", formatNumber(donatedCount),  "Across recorded initiatives")
    ].join("");
  }

  function summaryCard(label, value, detail) {
    return '<article class="admin-card">' +
      '<span>'  + escapeHtml(label)  + '</span>' +
      '<strong>'+ escapeHtml(value)  + '</strong>' +
      '<small>' + escapeHtml(detail) + '</small>' +
      '</article>';
  }

  function renderImpactTable(totals, donations) {
    const rows = Object.keys(CAUSES)
      .filter((cause) => matchesCause(cause, els.causeFilter.value))
      .map((cause) => {
        const meta       = CAUSES[cause];
        const earnedUnits = cause === "trees" ? totals[cause].answers : totals[cause].units;
        const donated     = donations[cause].donated;
        const remaining   = Math.max(0, earnedUnits - donated);
        const impactText  = cause === "trees"
          ? formatNumber(totals[cause].answers) + " " + pluralize(totals[cause].answers, "tree answer", "tree answers") +
            " / " + formatNumber(Math.floor(totals[cause].answers / 100)) + " " + pluralize(Math.floor(totals[cause].answers / 100), "tree", "trees")
          : formatNumber(earnedUnits) + " " + pluralize(earnedUnits, meta.unit, meta.unitPlural);

        return "<tr>" +
          "<td><span class=\"tag-mark tag-mark--" + cause + "\" aria-hidden=\"true\"></span><strong>" + escapeHtml(meta.label) + "</strong></td>" +
          "<td>" + formatNumber(totals[cause].answers) + "</td>" +
          "<td>" + escapeHtml(impactText) + "</td>" +
          "<td>" + formatNumber(donated)  + "</td>" +
          "<td>" + formatNumber(remaining)+ "</td>" +
          "<td>" + escapeHtml(donations[cause].through || "Not marked") + "</td>" +
          "</tr>";
      });

    els.impactTableBody.innerHTML = rows.join("") || emptyRow("No impact events in this range.", 6);
  }

  function renderDonationHistory(records) {
    const rows = records
      .slice()
      .sort((a, b) => b.donation_date.localeCompare(a.donation_date))
      .map((r) => {
        const meta = CAUSES[r.cause] || CAUSES.beans;
        return "<tr>" +
          "<td>" + escapeHtml(r.donation_date) + "</td>" +
          "<td><span class=\"tag-mark tag-mark--" + r.cause + "\" aria-hidden=\"true\"></span>" + escapeHtml(meta.label) + "</td>" +
          "<td>" + formatNumber(r.amount) + " " + escapeHtml(pluralize(r.amount, meta.unit, meta.unitPlural)) + "</td>" +
          "<td>" + escapeHtml(r.through_date) + "</td>" +
          "<td>" + escapeHtml(r.note || "") + "</td>" +
          "<td><button class=\"text-button\" type=\"button\" data-delete-donation=\"" + escapeHtml(r.id) + "\">Delete</button></td>" +
          "</tr>";
      });

    els.donationTableBody.innerHTML = rows.join("") || emptyRow("No donation records for this view.", 6);
  }

  // ── Write ─────────────────────────────────────────────────────

  async function saveDonationRecord() {
    const cause  = els.donationCause.value;
    const amount = Math.max(0, Number.parseInt(els.donationAmount.value, 10) || 0);
    if (!CAUSES[cause] || amount <= 0 || !els.donationDate.value || !els.donationThrough.value) return;

    const record = {
      id:            "donation-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      cause,
      amount,
      donation_date: els.donationDate.value,
      through_date:  els.donationThrough.value,
      note:          els.donationNote.value.trim()
    };

    const { error } = await db.from("donations").insert(record);
    if (error) { alert("Error saving: " + error.message); return; }

    els.donationAmount.value = "";
    els.donationNote.value   = "";
    renderDashboard();
  }

  async function deleteDonationRecord(id) {
    await db.from("donations").delete().eq("id", id);
    renderDashboard();
  }

  async function exportData() {
    const [events, donations] = await Promise.all([
      loadEvents({ start: "", end: "" }, "all"),
      loadDonations()
    ]);
    const payload = {
      exportedAt:      new Date().toISOString(),
      quizEvents:      events,
      donationRecords: donations
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "free-aid-export-" + formatLocalDate(new Date()) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ── Helpers ───────────────────────────────────────────────────

  function currentRange() {
    return { start: els.startDate.value || "", end: els.endDate.value || "" };
  }

  function inRange(day, range) {
    if (!day) return false;
    if (range.start && day < range.start) return false;
    if (range.end   && day > range.end)   return false;
    return true;
  }

  function matchesCause(cause, selected) {
    return selected === "all" || cause === selected;
  }

  function stripTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function formatLocalDate(date) {
    return date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0");
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
    return "<tr><td colspan=\"" + columns + "\" class=\"empty-table\">" + escapeHtml(message) + "</td></tr>";
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
