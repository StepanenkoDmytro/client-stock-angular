export interface IUser {
    email: string;
    portfolioID: number;
    mode?: UserMode;
}

export enum UserMode {
    Stage = "stage",
    Dev = "dev"
}
  
