import { Route } from "@angular/router";
import { SavingsComponent } from "./savings.component";
import { AddAssetsComponent } from "./components/add-assets/add-assets.component";

export const SAVINGS_ROUTES: Route[] = [
    {
        path: '',
        component: SavingsComponent
    },
    {
        path: 'add',
        component: AddAssetsComponent
    }
];
