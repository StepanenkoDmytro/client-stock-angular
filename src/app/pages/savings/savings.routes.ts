import { Route } from "@angular/router";
import { SavingsComponent } from "./savings.component";
import { CryptoAssetComponent } from "./components/markets-assets/crypto-market/crypto-asset/crypto-asset.component";
import { CryptoMarketComponent } from "./components/markets-assets/crypto-market/crypto-market.component";
import { StockMarketComponent } from "./components/markets-assets/stock-market/stock-market.component";
import { StockAssetComponent } from "./components/markets-assets/stock-market/stock-asset/stock-asset.component";
import { AddHoldingClassGridComponent } from "./components/holdings/add-holding/add-holding-class-grid/add-holding-class-grid.component";
import { AddHoldingComponent } from "./components/holdings/add-holding/add-holding.component";
import { AddLiabilityComponent } from "./components/liabilities/add-liability/add-liability.component";
import { AddLoopComponent } from "./components/strategies/add-loop/add-loop.component";


export const MARKETS: string[] = ['crypto', 'stock'];

export const SAVINGS_ROUTES: Route[] = [
    {
        path: '',
        component: SavingsComponent
    },
    {
        path: 'crypto',
        component: CryptoMarketComponent,
    },
    {
        path: 'crypto-asset',
        component: CryptoAssetComponent,
    },
    {
        path: 'stock',
        component: StockMarketComponent,
    },
    {
        path: 'stock-asset',
        component: StockAssetComponent
    },
    {
        path: 'holdings',
        loadComponent: () => import('./components/holdings/holdings-list.component').then(c => c.HoldingsListComponent),
    },
    {
        // PR5b entry point: class-grid (6 active cards + future placeholders).
        // Eager-loaded (not `loadComponent`) because Phase 2 promises that
        // manual-class adds work offline — but a lazy chunk can't be fetched
        // when `navigator.onLine` is false, so the route would fail to
        // resolve. Same for `add-holding/:class` and `edit-holding/:id`
        // below. Costs ~30 KB in the main bundle; PWA service worker
        // (CC-5) is the proper fix.
        path: 'add-holding',
        component: AddHoldingClassGridComponent,
    },
    {
        // PR5b form route. `:class` is a lowercase slug from ASSET_CLASS_SLUGS
        // (e.g. `stock`, `real-estate`, `tokenized-stock`). AddHoldingComponent
        // reads it and pre-fills the AssetClass control.
        path: 'add-holding/:class',
        component: AddHoldingComponent,
    },
    {
        path: 'edit-holding/:id',
        component: AddHoldingComponent,
    },
    {
        // Eager-loaded (offline rationale, same as add-holding): liabilities
        // are localStorage/anonymous, must work without network.
        path: 'add-liability',
        component: AddLiabilityComponent,
    },
    {
        // Add / edit a looping (Strategy) position — eager-loaded, same
        // offline rationale (localStorage/anonymous). Mockup savings/17.
        path: 'add-loop',
        component: AddLoopComponent,
    },
    {
        path: 'add-loop/:id',
        component: AddLoopComponent,
    },
    {
        // Loop (leverage strategy) detail — B-card (mockup savings/14).
        // Read-only; reached by tapping a Strategies row on the dashboard.
        path: 'loop/:id',
        loadComponent: () => import('./components/strategies/loop-detail/loop-detail.component').then(c => c.LoopDetailComponent),
    },
    {
        path: 'tags',
        loadComponent: () => import('./components/tags/tags.component').then(c => c.TagsComponent),
    },
    {
        path: 'tags/add',
        loadComponent: () => import('./components/tags/tag-form/tag-form.component').then(c => c.TagFormComponent),
    },
    {
        path: 'tags/edit/:id',
        loadComponent: () => import('./components/tags/tag-form/tag-form.component').then(c => c.TagFormComponent),
    },
    {
        path: 'accounts',
        loadComponent: () => import('./components/accounts/accounts-list/accounts-list.component').then(c => c.AccountsListComponent),
    },
    {
        path: 'accounts/add',
        loadComponent: () => import('./components/accounts/account-form/account-form.component').then(c => c.AccountFormComponent),
    },
    {
        path: 'accounts/edit/:id',
        loadComponent: () => import('./components/accounts/account-form/account-form.component').then(c => c.AccountFormComponent),
    },
];
