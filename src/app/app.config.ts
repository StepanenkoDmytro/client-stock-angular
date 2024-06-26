import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { provideState, provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { userReducer } from './store/user.reducer';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { assetReducer } from './pages/savings/store/asset.reducer';
import { spendingsReducer } from './pages/spending/store/spendings.reducer';
import { JwtInterceptor } from './pages/auth/jwt.interceptor';
import { SpendingsEffects } from './pages/spending/store/spendings.effects';
import { SyncDataEffects } from './store/sync-data.effects';
import { UserEffects } from './store/user.effects';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000',
    }),
    provideStore(),
    provideState({ name: 'user-info', reducer: userReducer }),
    provideState({ name: 'spending', reducer: spendingsReducer }),
    provideState({ name: 'assets', reducer: assetReducer }),
    provideEffects([UserEffects, SpendingsEffects, SyncDataEffects]),
    provideStoreDevtools({
      maxAge: 25, 
      logOnly: !isDevMode(),
    }),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
};
