# Import templates

Цей каталог містить шаблони для bulk-import фічей.

## `spending-import-template.csv`

Sample data для **Spending Excel/Google Sheets import** ([task ticket](../../../../docs/notes/2026-05-spending-excel-import-task.md)).

**Колонки:**
- `Date` — `YYYY-MM-DD`
- `Type` — `Income` або `Expense` (case-insensitive)
- `Category` — title або path (`Food > Restaurants > Italian`); відсутні рівні auto-create'яться під час імпорту (§2.5 v2)
- `Amount` — positive number (sign defined by Type)
- `Comment` — optional, ≤ 200 chars

**Sample rows demonstrate:**
- Default categories (Salary, Food, Car, Health…) — reuse без створення
- Flat NEW category (`Coffee`) — створюється як top-level під Spending root
- 2-level path (`Subscriptions > Netflix`) — обидва рівні auto-create
- 3-level path (`Food > Restaurants > Italian`) — Italian вкладається у новостворений Restaurants під existing Food
- NEW Income category (`Freelance`) — створюється під Income root

**Як використовується:**
- Юзер тапає «Download template» у Profile → Export / Import data → Import spendings from Excel
- Browser робить direct download через `<a href download>` на цей файл
- Юзер відкриває в Excel / Numbers / Google Sheets, заповнює, експортує
- Завантажує назад у застосунок

**Template strategy (per task §3.3, revised 2026-05-25 v2):**
- **CSV (`spending-import-template.csv`)** — primary downloadable artifact, працює всюди (Excel / Numbers / Google Sheets / LibreOffice / text-edit)
- **Google Sheets template** — public read-only link через `https://docs.google.com/spreadsheets/d/{ID}/copy`, юзер тапає → Sheets робить copy в його Drive. URL конфігурується через `environment.ts` (`IMPORT_TEMPLATE_GSHEET_URL`)
- **`.xlsx` версія deferred** — додамо коли з'явиться real demand від юзерів за `.xlsx`-specific фічами (frozen header, multi-tab інструкції). SheetJS у runtime все одно приймає `.xlsx` якщо юзер заливає власний

Реалізація — Phase 7.6, per [execution-plan.md](../../../../docs/notes/2026-05-execution-plan.md).
