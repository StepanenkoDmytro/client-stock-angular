import { Route } from "@angular/router";
import { ProfileComponent } from "./profile.component";
import { MonthlyBudgetComponent } from "./components/monthly-budget/monthly-budget.component";
import { ProfileSettingsComponent } from "./components/profile-settings/profile-settings.component";
import { ExportImportComponent } from "./components/export-import/export-import.component";
import { ImportSpendingsComponent } from "./components/import-spendings/import-spendings.component";

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
    },
    {
        path: 'export-import',
        component: ExportImportComponent,
    },
    {
        path: 'import-spendings',
        component: ImportSpendingsComponent,
    },
]