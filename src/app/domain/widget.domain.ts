export interface IWidgetState {
  id?: string,
  nameWidget: string,
  primary: string[],
  work: string[]
}

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
  name: string,
  value: string,
  color?: string,
}

export interface IBudgetExpense {
  id?: string,
  date: string,
  cost: number,
  category: string,
  note: string,
}
