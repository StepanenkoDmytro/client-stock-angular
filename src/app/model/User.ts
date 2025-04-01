export interface IUser {
    name?: string;
    email: string;
    isConfirmaEmail?: boolean;
    portfolioID: number;
    mode?: UserMode;
}

export enum UserMode {
    Stage = "stage",
    Dev = "dev"
}
  
