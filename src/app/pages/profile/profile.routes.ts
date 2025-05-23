import { Route } from "@angular/router";
import { ProfileComponent } from "./profile.component";
import { MonthlyBudgetComponent } from "./components/monthly-budget/monthly-budget.component";
import { ProfileSettingsComponent } from "./components/profile-settings/profile-settings.component";

export const PROFILE_ROUTES: Route[] = [
    {
        path: '',
        component: ProfileComponent,
    },
    {
        path: 'monthly-budget',
        component: MonthlyBudgetComponent,
    },
    {
        path: 'profile-settings',
        component: ProfileSettingsComponent
    }
]