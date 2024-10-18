import { Route } from "@angular/router";
import { AuthContainerComponent } from "./components/auth-container/auth-container.component";
import { ForgetPasswordComponent } from "./components/forget-password/forget-password.component";
import { LoginComponent } from "./components/login/login.component";
import { RegistrationComponent } from "./components/registration/registration.component";
import { InputRecoveryCodeComponent } from "./components/forget-password/components/input-recovery-code/input-recovery-code.component";
import { ChangePasswordComponent } from "./components/forget-password/components/change-password/change-password.component";

export const AUTH_ROUTES: Route[] = [
    {
      path: '',
      component: AuthContainerComponent,
      children: [
        { path: '', pathMatch: 'full', redirectTo: 'login' },
        { path: 'login', component: LoginComponent },
        { path: 'registration', component: RegistrationComponent },
        { path: 'forget-password', component: ForgetPasswordComponent },
        { path: 'input-recovery-code', component: InputRecoveryCodeComponent },
        { path: 'change-password', component: ChangePasswordComponent },
      ]
    }
  ];