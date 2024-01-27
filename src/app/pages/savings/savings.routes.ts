import { Route } from "@angular/router";
import { SavingsComponent } from "./savings.component";
import { AddAssetsComponent } from "./components/add-assets-wrapper/add-assets-wrapper.component";
import { AssetComponent } from "./components/markets-assets/crypto-market/asset/asset.component";

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
        path: 'asset',
        component: AssetComponent
    }
];
