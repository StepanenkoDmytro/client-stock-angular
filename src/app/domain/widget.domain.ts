export interface ICommodityTable {
  commodity: string,
  price: number,
  change: number,
  percentageChange: string
};

export interface DataModel {
  date: Date,
  value: number
};