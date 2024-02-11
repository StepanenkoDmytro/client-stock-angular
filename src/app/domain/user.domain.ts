export interface IUserApiResponse {
    token: string,
    user: IUserApi
  }
  
export interface IUserApi {
  email: string,
  id: number,
  portfolio: IPortfolioApi[],
}

export interface IPortfolioApi {
  id: number,
  spendings: any[]
}
