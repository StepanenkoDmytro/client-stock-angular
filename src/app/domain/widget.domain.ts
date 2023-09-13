export interface ICommodityTable {
  commodity: string,
  price: number,
  change: number,
  percentageChange: string
}

export interface DataModel {
  date: Date,
  value: number
}

export interface SimpleDataModel {
  name: string;
  value: string;
  color?: string;
}
