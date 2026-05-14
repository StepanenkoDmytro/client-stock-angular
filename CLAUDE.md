# Client — Angular memory

> Локальні конвенції для Angular-частини. Спочатку читати `../CLAUDE.md`,
> потім цей. Архітектурні рішення — в `../docs/adr/`.

---

## Stack

- Angular 17 (standalone components, control flow `@if/@for/@switch`).
- NgRx Store + Effects (`provideStore`, `provideState`, `provideEffects`).
- Angular Material 17.
- Service Worker (PWA): `provideServiceWorker('ngsw-worker.js')`.
- RxJS 7.8, TypeScript 5.2.
- Префікс компонентів: **`pgz-`**.

---

## Структура

```
src/app/
├── app.config.ts           ← усі provide*-функції
├── app.routes.ts           ← lazy routes per feature (enum AppRoutes)
├── core/                   ← cross-cutting
│   ├── UI/                 ← reusable UI components (наш міні-design-system)
│   └── components/         ← layout / shell
├── directive/              ← глобальні директиви
├── pipe/                   ← глобальні пайпи
├── domain/                 ← TS-інтерфейси доменних моделей
├── model/                  ← classes (наразі лише User; для нової моделі — теж тут)
├── service/                ← глобальні сервіси (auth, theme, date, helpers)
├── store/                  ← глобальні NgRx feature stores (user, sync-data)
└── pages/
    └── <feature>/
        ├── <feature>.component.ts
        ├── <feature>.routes.ts
        ├── components/     ← локальні UI
        ├── service/        ← локальні сервіси
        ├── store/          ← локальний NgRx state
        └── model/          ← локальні класи/мапери (DTO → domain)
```

**Принцип**: усе, що стосується однієї фічі — у `pages/<feature>/`. Підіймати в `core/` чи `domain/` — лише якщо реально перевикористовується.

---

## Конвенції компонентів

- **Завжди standalone:**
  ```ts
  @Component({
    selector: 'pgz-savings',
    standalone: true,
    imports: [...],
    templateUrl: './savings.component.html',
    styleUrl: './savings.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  ```
- **OnPush** — за замовчуванням. Без виключень. Якщо здається, що потрібен Default — це сигнал перевірити, чому view не оновлюється (мабуть, мутуєш об'єкт).
- **`inject()`** замість конструкторної ін'єкції для нових сервісів — простіший unit-test, чистіша сигнатура. Існуючий код через constructor — не переписувати без причини.
- **Templates:**
  - Сучасний control flow: `@if`, `@for`, `@switch`. Не `*ngIf`/`*ngFor`.
  - `track` обов'язковий у `@for`: `@for (x of items; track x.id) { ... }`.
  - Не використовуй `function calls` у biндингах (наприклад `[disabled]="isDisabled()"`) на гарячих списках — переноси в Signal або computed.

---

## State management

Триярусна політика:

1. **Локальний state компонента** → `signal()` / `computed()` / `inputs/outputs`.
2. **Cross-component у межах однієї feature page** → Angular Signals у локальному сервісі (`@Injectable({ providedIn: 'root' })` або обмежено через `providers`).
3. **Cross-feature або потрібно для ефектів/inter-feature sync** → NgRx (як зараз: user, spendings, assets).

**Не додавати нові NgRx feature states**, якщо логіка живе всередині однієї сторінки. Перевага — Signals.

### NgRx, де він є

- Actions: дієслова, минулий час для подій (`spendingsLoaded`, `assetAdded`), теперішній — для команд (`loadSpendings`).
- Selectors: чисті функції, мемоїзовані через `createSelector`.
- Effects: `switchMap` для запитів-команд, `mergeMap` тільки коли точно знаєш чому.
- Не використовуй `subscribe()` у компонентах для NgRx — `| async` у шаблоні.

---

## Сервіси і HTTP

- Кожна feature page має свій сервіс (`<feature>.service.ts`) — обгортка над HttpClient.
- Базовий URL — з `environment.ts` (`environment.development.ts` для dev).
- JWT — через `JwtInterceptor` (вже зареєстрований).
- **DTO ↔ domain mapping** — у самому сервісі або в `model/<Class>.ts` як static method (`mapDtoToPortfolioStock(...)`), як зараз.
- При зміні моделі (ADR-001) — мапери будуть змінюватись першими, дотримуйся patternу.

---

## Стилі

- SCSS, не CSS.
- **CSS custom properties для теми**, не SCSS-міксини. Темна тема — `:root[data-theme="dark"] { ... }`.
- Material — як єдиний UI kit; не змішувати з Tailwind, Bootstrap, тощо.
- BEM як convention для класів усередині компонента: `.savings__filter`, `.savings__filter--selected`. Не обов'язково, але корисно.
- Не використовуй `::ng-deep` без коментаря «чому».

---

## Маршрутизація

- Усі маршрути — у `app.routes.ts` через `loadChildren` (на feature) або `loadComponent` (на самостійний екран).
- `AppRoutes` enum — єдина точка істини для шляхів, використовуй його замість магічних рядків.

---

## PWA

- `manifest.webmanifest`, `ngsw-config.json`.
- Service Worker працює тільки у prod-build (`!isDevMode()`).
- При додаванні нового API endpoint, що має кешуватись офлайн — оновлюй `dataGroups` у `ngsw-config.json`.

---

## Накладні теми, які варто розуміти у цьому коді

- **`AddTriggerService`** — глобальний bus для FAB-кнопки на головному layout'і (бачив у `savings.component.ts`). Якщо додаєш FAB на новій сторінці — підписуйся на цей сервіс, не створюй свій.
- **`MarketService`** — поточно тримає вибраний `portfolioAsset` для роутингу між `savings` ↔ `savings/<type>-asset`. Після ADR-001 — буде переробка.
- **`SavingsService`** — глобальний (у `service/`), не у `pages/savings/service/`. Це історичне; новий код для savings виносити в `pages/savings/service/`.

---

## Лінтер і форматинг

- Угоди ESLint/Prettier — як зараз у репо (не змінюємо без обговорення).
- Перед коммітом: `npm run lint`, `npm run build` (мінімум).

---

## Тестування

- Karma + Jasmine (default Angular).
- Юніт-тести обов'язкові для:
  - Селекторів NgRx (чисті функції).
  - Мапперів DTO → domain.
  - Сервісів з нетривіальною логікою (обчислення, фільтри).
- UI-snapshots / e2e — на свій розсуд, не наполягаємо на старті.

---

## Що НЕ робити

- Не вводь нову UI-бібліотеку (Tailwind, PrimeNG, Bootstrap) — Material достатньо.
- Не повертайся до `NgModule` — лише standalone.
- Не використовуй `any` як тип повернення HTTP — завжди вузький DTO.
- Не звертайся до `localStorage` напряму з компонента — інкапсулюй у сервісі.
- Не змінюй prefix `pgz-` для існуючих компонентів. Нові — теж `pgz-`.
