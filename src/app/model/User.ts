export interface IUser {
    id: number;
    email: string;
    portfolioID: number;
    name?: string;
    isConfirmaEmail?: boolean;
    mode?: UserMode;
}

export enum UserMode {
    Stage = "stage",
    Dev = "dev"
}
  
