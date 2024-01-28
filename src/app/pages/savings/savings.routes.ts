import { Route } from "@angular/router";
import { SavingsComponent } from "./savings.component";
import { AddAssetsComponent } from "./components/add-assets-wrapper/add-assets-wrapper.component";
import { AssetComponent } from "./components/markets-assets/crypto-market/crypto-asset/crypto-asset.component";
import { CryptoMarketComponent } from "./components/markets-assets/crypto-market/crypto-market.component";


export const MARKETS: string[] = ['crypto', 'stock'];

export const SAVINGS_ROUTES: Route[] = [
    {
        path: '',
        component: SavingsComponent
    },
    {
        path: 'add',
        component: AddAssetsComponent
    },
    {
        path: 'crypto-asset',
        component: AssetComponent
    },
    {
        path: 'crypto',
        component: CryptoMarketComponent,
    }
];
