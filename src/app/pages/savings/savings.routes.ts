import { Route } from "@angular/router";
import { SavingsComponent } from "./savings.component";
import { CryptoAssetComponent } from "./components/markets-assets/crypto-market/crypto-asset/crypto-asset.component";
import { CryptoMarketComponent } from "./components/markets-assets/crypto-market/crypto-market.component";
import { StockMarketComponent } from "./components/markets-assets/stock-market/stock-market.component";
import { StockAssetComponent } from "./components/markets-assets/stock-market/stock-asset/stock-asset.component";


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
        path: 'add-holding',
        loadComponent: () =>
            import('./components/holdings/add-holding/add-holding-class-grid/add-holding-class-grid.component')
                .then(c => c.AddHoldingClassGridComponent),
    },
    {
        // PR5b form route. `:class` is a lowercase slug from ASSET_CLASS_SLUGS
        // (e.g. `stock`, `real-estate`, `tokenized-stock`). AddHoldingComponent
        // reads it and pre-fills the AssetClass control.
        path: 'add-holding/:class',
        loadComponent: () => import('./components/holdings/add-holding/add-holding.component').then(c => c.AddHoldingComponent),
    },
    {
        path: 'edit-holding/:id',
        loadComponent: () => import('./components/holdings/add-holding/add-holding.component').then(c => c.AddHoldingComponent),
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
