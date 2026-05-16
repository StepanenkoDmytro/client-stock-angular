import { TestBed } from '@angular/core/testing';
import { AssetClass } from '../../../domain/asset-class.domain';
import { IInstrument } from '../../../domain/instrument.domain';
import { InstrumentService } from './instrument.service';

const STORAGE_KEY = 'custom-instruments';

function makeInstrument(
  symbol: string,
  assetClass: AssetClass,
  opts: Partial<IInstrument> = {},
): IInstrument {
  const base: IInstrument = {
    id: opts.id ?? `${symbol}-${assetClass}`,
    assetClass,
    symbol,
    name: opts.name ?? symbol,
    currency: opts.currency ?? 'USD',
    metadata:
      opts.metadata ??
      (assetClass === AssetClass.CRYPTO
        ? { kind: AssetClass.CRYPTO, coinId: symbol.toLowerCase() }
        : {
            kind: AssetClass.STOCK,
            exchange: 'NYSE',
            currency: opts.currency ?? 'USD',
          }),
    createdBy: opts.createdBy ?? 'system',
    createdAt: opts.createdAt ?? '2026-05-15T00:00:00.000Z',
  };
  return base;
}

describe('InstrumentService', () => {
  let service: InstrumentService;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [InstrumentService] });
    service = TestBed.inject(InstrumentService);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  describe('init / bootstrap', () => {
    it('starts empty when no localStorage snapshot', () => {
      service.init();
      expect(service.getAll()).toEqual([]);
    });

    it('loads user-created instruments from localStorage', () => {
      const custom = makeInstrument('AAPL', AssetClass.STOCK, {
        id: 'persisted-1',
        createdBy: 'user',
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([custom]));

      service.init();

      expect(service.getAll().length).toBe(1);
      expect(service.getById('persisted-1')?.createdBy).toBe('user');
    });

    it('falls back to empty on corrupted snapshot', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json');
      service.init();
      expect(service.getAll()).toEqual([]);
    });

    it('init is idempotent', () => {
      service.init();
      service.init();
      expect(service.getAll()).toEqual([]);
    });
  });

  describe('addMarketInstruments', () => {
    it('inserts new market instruments into the cache', () => {
      const list = [
        makeInstrument('AAPL', AssetClass.STOCK),
        makeInstrument('BTC', AssetClass.CRYPTO),
      ];
      service.addMarketInstruments(list);
      expect(service.getAll().length).toBe(2);
    });

    it('does NOT persist market instruments to localStorage', () => {
      service.addMarketInstruments([
        makeInstrument('AAPL', AssetClass.STOCK),
      ]);
      const raw = localStorage.getItem(STORAGE_KEY);
      // Either no key at all, or an empty array — both indicate no persistence.
      if (raw) {
        expect(JSON.parse(raw)).toEqual([]);
      } else {
        expect(raw).toBeNull();
      }
    });

    it('skips market instrument that conflicts with existing (symbol, assetClass)', () => {
      const userInst = makeInstrument('AAPL', AssetClass.STOCK, {
        id: 'user-aapl',
        createdBy: 'user',
      });
      service.getOrCreate({
        symbol: userInst.symbol,
        assetClass: userInst.assetClass,
        name: userInst.name,
        currency: userInst.currency,
        metadata: userInst.metadata,
      });
      const before = service.getAll().length;

      service.addMarketInstruments([
        makeInstrument('AAPL', AssetClass.STOCK, { id: 'market-aapl' }),
      ]);

      expect(service.getAll().length).toBe(before);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      service.addMarketInstruments([
        makeInstrument('AAPL', AssetClass.STOCK, { name: 'Apple Inc.' }),
        makeInstrument('MSFT', AssetClass.STOCK, { name: 'Microsoft Corp.' }),
        makeInstrument('BTC', AssetClass.CRYPTO, { name: 'Bitcoin' }),
        makeInstrument('ETH', AssetClass.CRYPTO, { name: 'Ethereum' }),
      ]);
    });

    it('empty query returns all instruments', () => {
      expect(service.search('').length).toBe(4);
    });

    it('filters by symbol substring case-insensitively', () => {
      const result = service.search('aap');
      expect(result.map((i) => i.symbol)).toEqual(['AAPL']);
    });

    it('filters by name substring case-insensitively', () => {
      const result = service.search('bitc');
      expect(result.map((i) => i.symbol)).toEqual(['BTC']);
    });

    it('filters by assetClass', () => {
      const result = service.search('', AssetClass.CRYPTO);
      expect(result.map((i) => i.symbol).sort()).toEqual(['BTC', 'ETH']);
    });

    it('combines query and assetClass', () => {
      const result = service.search('e', AssetClass.CRYPTO);
      expect(result.map((i) => i.symbol)).toEqual(['ETH']);
    });

    it('returns alphabetically sorted by symbol', () => {
      const result = service.search('');
      expect(result.map((i) => i.symbol)).toEqual([
        'AAPL',
        'BTC',
        'ETH',
        'MSFT',
      ]);
    });
  });

  describe('getOrCreate', () => {
    it('returns existing instrument when (symbol, assetClass) matches', () => {
      service.addMarketInstruments([
        makeInstrument('AAPL', AssetClass.STOCK, { id: 'existing' }),
      ]);

      const result = service.getOrCreate({
        symbol: 'AAPL',
        assetClass: AssetClass.STOCK,
        name: 'Apple',
        currency: 'USD',
        metadata: { kind: AssetClass.STOCK, exchange: 'NYSE', currency: 'USD' },
      });

      expect(result.id).toBe('existing');
    });

    it('creates a new user-instrument when none matches', () => {
      const result = service.getOrCreate({
        symbol: 'MY-RE-1',
        assetClass: AssetClass.REAL_ESTATE,
        name: 'Apartment Kyiv',
        currency: 'UAH',
        metadata: { kind: AssetClass.REAL_ESTATE, currency: 'UAH' },
      });

      expect(result.createdBy).toBe('user');
      expect(result.symbol).toBe('MY-RE-1');
      expect(service.getById(result.id)).toBeDefined();
    });

    it('persists newly created user-instrument to localStorage', () => {
      service.getOrCreate({
        symbol: 'MY-CASH',
        assetClass: AssetClass.CASH,
        name: 'USD Cash',
        currency: 'USD',
        metadata: { kind: AssetClass.CASH, currency: 'USD' },
      });

      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!) as IInstrument[];
      expect(parsed.length).toBe(1);
      expect(parsed[0].symbol).toBe('MY-CASH');
      expect(parsed[0].createdBy).toBe('user');
    });

    it('does NOT mistake same symbol in different assetClass as a match', () => {
      service.addMarketInstruments([
        makeInstrument('AAPL', AssetClass.STOCK, { id: 'stock-aapl' }),
      ]);

      const created = service.getOrCreate({
        symbol: 'AAPL',
        assetClass: AssetClass.TOKENIZED_STOCK,
        name: 'Apple Token',
        currency: 'USD',
        metadata: {
          kind: AssetClass.TOKENIZED_STOCK,
          underlyingSymbol: 'AAPL',
          tokenSymbol: 'AAPL.X',
          exchange: 'Bybit',
          blockchain: 'eth',
        },
      });

      expect(created.id).not.toBe('stock-aapl');
      expect(service.getAll().length).toBe(2);
    });
  });

  describe('getById', () => {
    it('returns the instrument when present', () => {
      service.addMarketInstruments([
        makeInstrument('AAPL', AssetClass.STOCK, { id: 'aapl-1' }),
      ]);
      expect(service.getById('aapl-1')?.symbol).toBe('AAPL');
    });

    it('returns undefined when missing', () => {
      expect(service.getById('nope')).toBeUndefined();
    });
  });
});
