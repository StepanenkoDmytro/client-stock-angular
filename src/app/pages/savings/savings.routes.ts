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
];
