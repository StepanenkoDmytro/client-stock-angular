import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../../service/auth.service';
import { UserPreferencesService } from './user-preferences.service';

/**
 * Focused spec for the PR4 frontend-only `savings-prefs.discoveryRowHidden`
 * preference. The rest of {@link UserPreferencesService} (REST round-trip
 * for `baseCurrency`) stays uncovered here — those interactions are
 * exercised by existing user-preferences specs elsewhere.
 */
describe('UserPreferencesService — discoveryRowHidden', () => {
  function makeService(): UserPreferencesService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        UserPreferencesService,
        provideHttpClient(),
        provideHttpClientTesting(),
        // Cut the AuthService → UserService → Store DI chain — discovery
        // row preference doesn't touch auth at all, so we only need the
        // shape the service inspects (`authToken`).
        { provide: AuthService, useValue: { authToken: null } },
      ],
    });
    return TestBed.inject(UserPreferencesService);
  }

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to false when no preference has been written', () => {
    const service = makeService();
    expect(service.discoveryRowHidden()).toBe(false);
  });

  it('hydrates from localStorage on construction so the preference survives reloads', () => {
    localStorage.setItem('savings-prefs', JSON.stringify({ discoveryRowHidden: true }));
    const service = makeService();
    expect(service.discoveryRowHidden()).toBe(true);
  });

  it('setDiscoveryRowHidden(true) flips the signal and persists', () => {
    const service = makeService();
    expect(service.discoveryRowHidden()).toBe(false);
    service.setDiscoveryRowHidden(true);
    expect(service.discoveryRowHidden()).toBe(true);
    const stored = JSON.parse(localStorage.getItem('savings-prefs') ?? '{}');
    expect(stored.discoveryRowHidden).toBe(true);
  });

  it('setDiscoveryRowHidden(false) reverts both signal + localStorage (clear, in case product brings it back)', () => {
    localStorage.setItem('savings-prefs', JSON.stringify({ discoveryRowHidden: true }));
    const service = makeService();
    service.setDiscoveryRowHidden(false);
    expect(service.discoveryRowHidden()).toBe(false);
    const stored = JSON.parse(localStorage.getItem('savings-prefs') ?? '{}');
    expect(stored.discoveryRowHidden).toBe(false);
  });

  it('ignores corrupted JSON in localStorage and defaults to false', () => {
    localStorage.setItem('savings-prefs', '{not-json}');
    const service = makeService();
    expect(service.discoveryRowHidden()).toBe(false);
  });
});
