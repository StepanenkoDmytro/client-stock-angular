export interface IStock {
    symbol: string,
    name: string,
    currency: string,
    country: string,
    sector: string,
    industry: string,
    market_capitalization: number,
    dividend_yield?: number,
    dividend_date?: Date,
    ex_dividend_date?: Date
  }