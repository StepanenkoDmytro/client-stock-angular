import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  CRYPTO_EXCHANGE_CODE,
  MarketStatus,
} from '../../../../domain/market-status.domain';
import { MarketStatusService } from '../../service/market-status.service';
import { MarketStatusBadgeComponent } from './market-status-badge.component';

class FakeMarketStatusService {
  private readonly _statuses = signal<Map<string, MarketStatus>>(new Map());
  readonly _tick = signal<number>(Date.parse('2026-05-19T12:00:00Z'));
  readonly tick = this._tick.asReadonly();

  set(code: string, status: MarketStatus): void {
    const m = new Map(this._statuses());
    m.set(code, status);
    this._statuses.set(m);
  }

  setNow(ms: number): void {
    this._tick.set(ms);
  }

  getStatus(code: string): MarketStatus | undefined {
    return this._statuses().get(code);
  }
}

describe('MarketStatusBadgeComponent', () => {
  let fixture: ComponentFixture<MarketStatusBadgeComponent>;
  let component: MarketStatusBadgeComponent;
  let svc: FakeMarketStatusService;

  beforeEach(async () => {
    svc = new FakeMarketStatusService();
    await TestBed.configureTestingModule({
      imports: [MarketStatusBadgeComponent],
      providers: [{ provide: MarketStatusService, useValue: svc }],
    }).compileComponents();
    fixture = TestBed.createComponent(MarketStatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('renders nothing (tone=hidden, label="") when exchangeCode unknown', () => {
    component.exchangeCode = 'UNKNOWN';
    fixture.detectChanges();
    expect(component.tone()).toBe('hidden');
    expect(component.label()).toBe('');
  });

  it('shows "Market open" + tone=open when status.isOpen=true', () => {
    svc.set('NASDAQ', {
      code: 'NASDAQ', isOpen: true, session: 'REGULAR', nextChangeAt: null,
    });
    component.exchangeCode = 'NASDAQ';
    fixture.detectChanges();
    expect(component.tone()).toBe('open');
    expect(component.label()).toBe('Market open');
  });

  it('renders "24/7" for CRYPTO when open', () => {
    svc.set(CRYPTO_EXCHANGE_CODE, {
      code: CRYPTO_EXCHANGE_CODE,
      isOpen: true,
      session: 'REGULAR',
      nextChangeAt: null,
    });
    component.exchangeCode = CRYPTO_EXCHANGE_CODE;
    fixture.detectChanges();
    expect(component.label()).toBe('24/7');
  });

  it('shows minutes-until-open when < 60 min away', () => {
    const now = Date.parse('2026-05-19T12:00:00Z');
    const inFifteenMin = (now + 15 * 60_000) / 1000;
    svc.set('NASDAQ', {
      code: 'NASDAQ', isOpen: false, session: 'CLOSED', nextChangeAt: inFifteenMin,
    });
    svc.setNow(now);
    component.exchangeCode = 'NASDAQ';
    fixture.detectChanges();
    expect(component.tone()).toBe('closed');
    expect(component.label()).toBe('Closed · opens in 15min');
  });

  it('shows hours+minutes when < 24h away', () => {
    const now = Date.parse('2026-05-19T12:00:00Z');
    const inTwoHFifteen = (now + (2 * 60 + 15) * 60_000) / 1000;
    svc.set('NASDAQ', {
      code: 'NASDAQ', isOpen: false, session: 'CLOSED', nextChangeAt: inTwoHFifteen,
    });
    svc.setNow(now);
    component.exchangeCode = 'NASDAQ';
    fixture.detectChanges();
    expect(component.label()).toBe('Closed · opens in 2h 15min');
  });

  it('shows hours only (no "0min") when exact hour boundary', () => {
    const now = Date.parse('2026-05-19T12:00:00Z');
    const inThreeH = (now + 3 * 60 * 60_000) / 1000;
    svc.set('NASDAQ', {
      code: 'NASDAQ', isOpen: false, session: 'CLOSED', nextChangeAt: inThreeH,
    });
    svc.setNow(now);
    component.exchangeCode = 'NASDAQ';
    fixture.detectChanges();
    expect(component.label()).toBe('Closed · opens in 3h');
  });

  it('shows weekday+time when ≥ 24h away', () => {
    const now = Date.parse('2026-05-15T20:00:00Z'); // Friday 8pm UTC
    const monMorning = Date.parse('2026-05-18T13:30:00Z'); // Mon 13:30 UTC
    const epochSec = monMorning / 1000;
    svc.set('NYSE', {
      code: 'NYSE', isOpen: false, session: 'WEEKEND', nextChangeAt: epochSec,
    });
    svc.setNow(now);
    component.exchangeCode = 'NYSE';
    fixture.detectChanges();
    expect(component.label()).toMatch(/^Closed · opens Mon \d\d:\d\d$/);
  });

  it('renders "soon" when nextChangeAt is null but isOpen=false', () => {
    svc.set('NASDAQ', {
      code: 'NASDAQ', isOpen: false, session: 'CLOSED', nextChangeAt: null,
    });
    component.exchangeCode = 'NASDAQ';
    fixture.detectChanges();
    expect(component.label()).toBe('Closed · opens soon');
  });

  it('re-renders label when tick advances (countdown decreases)', () => {
    const t0 = Date.parse('2026-05-19T12:00:00Z');
    const opensAt = (t0 + 30 * 60_000) / 1000;
    svc.set('NASDAQ', {
      code: 'NASDAQ', isOpen: false, session: 'CLOSED', nextChangeAt: opensAt,
    });
    svc.setNow(t0);
    component.exchangeCode = 'NASDAQ';
    fixture.detectChanges();
    expect(component.label()).toBe('Closed · opens in 30min');

    svc.setNow(t0 + 20 * 60_000);
    fixture.detectChanges();
    expect(component.label()).toBe('Closed · opens in 10min');
  });

  it('accepts ISO-8601 string for nextChangeAt', () => {
    const now = Date.parse('2026-05-19T12:00:00Z');
    svc.set('NASDAQ', {
      code: 'NASDAQ',
      isOpen: false,
      session: 'CLOSED',
      nextChangeAt: '2026-05-19T12:45:00Z',
    });
    svc.setNow(now);
    component.exchangeCode = 'NASDAQ';
    fixture.detectChanges();
    expect(component.label()).toBe('Closed · opens in 45min');
  });
});
