# The Bean Counter

Static financial literacy quiz site for `freebeansquiz.com`.

## Files

- `index.html` - main quiz page
- `about.html` - concept, sponsor, and charity commitment page
- `admin.html` - local admin dashboard for impact totals and donation records
- `questions.json` - editable 400-question bank with Basic, Intermediate, and Advanced tiers
- `style.css` - all visual styling and animation
- `app.js` - quiz logic, random order, answer feedback, and bean bowl animation
- `admin.js` - local dashboard filtering, aggregation, donation ledger, and JSON export

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any basic static server.

Examples:

```powershell
npx serve .
```

```powershell
python -m http.server 8000
```

Then visit the local URL shown by the server.

## Editing Questions

Questions live in `questions.json`. Each question needs this shape:

```json
{
  "id": 101,
  "difficulty": "basic",
  "category": "Budgeting",
  "question": "What is a budget?",
  "choices": [
    "A plan for income, spending, and saving",
    "A loan application",
    "A tax penalty",
    "A credit report"
  ],
  "answer": 0
}
```

Use one of these difficulty values: `basic`, `intermediate`, or `advanced`. Keep exactly four choices. The `answer` value is the zero-based index of the correct choice, so `0` means the first choice, `1` means the second choice, and so on.

The quiz defaults to Basic and lets players switch between Basic, Intermediate, and Advanced. Switching tiers reshuffles that tier and resets the tier progress, while the session bean count stays in place.

The current quiz session is stored in browser `sessionStorage`, so players can click internal links like About and return to the quiz without losing selected tier, shuffled deck order, progress, selected cause, or cause-specific correct-answer counts. The saved session is tab-scoped and is cleared by the browser when that tab session ends.

## Admin Dashboard

Open `admin.html` to review locally recorded impact totals by day, week, month, all time, or custom date range. The dashboard shows correct answers, earned impact units such as rice grains and tree answers, donation records, donated-through dates, and remaining earned impact after marked donations.

Correct answers are written to browser `localStorage` as small impact events. Donation records are also stored in `localStorage`, and the dashboard can export the current data to JSON.

Important limitation: because this project is still plain static HTML/CSS/JavaScript with no backend, `admin.html` can only show data recorded in the same browser. It cannot aggregate totals from other visitors, devices, or browsers unless the quiz is later connected to a server, form endpoint, analytics event stream, or database.

When served from a local or hosted web server, the quiz loads `questions.json` directly. Some browsers block direct `file://` JSON loading, so `app.js` includes a synced fallback copy of the same 400 questions for double-click use. If you edit `questions.json`, serve the folder locally to preview those edits right away, or rerun the generator from the project root to sync the fallback:

```powershell
node work\build-question-bank.js
```

The additional Basic questions were written in original wording from topic coverage found in Annuity.org and Investopedia, plus overlapping standard FinancialLiteracy101-style personal finance topics. FinancialLiteracy101 was inaccessible during this pass, so no text was copied or directly adapted from that page.

## Notes

The quiz has no accounts, cookies, backend services, databases, build tools, package managers, or framework dependencies.
