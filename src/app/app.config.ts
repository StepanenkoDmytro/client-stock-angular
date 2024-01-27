import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient } from '@angular/common/http';
import { provideState, provideStore } from '@ngrx/store';
import { userReducer } from './store/user.reducer';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { assetReducer } from './pages/savings/store/asset.reducer';
import { spendingsReducer } from './pages/spending/store/spendings.reducer';


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
    provideState({ name: 'user', reducer: userReducer }),
    provideState({ name: 'spending', reducer: spendingsReducer }),
    provideState({ name: 'assets', reducer: assetReducer }),
    provideStoreDevtools({
      maxAge: 25, 
      logOnly: !isDevMode(),
    }),
  ],
};
