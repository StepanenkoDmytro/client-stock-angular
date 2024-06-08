import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private readonly FAILED_RQUESTS_SPENDINGS_KEY = 'failed-requests-spendings';
  private readonly FAILED_RQUESTS_CATEGORIES_KEY = 'failed-requests-categories';

  constructor() { }

  public getFailedSpendings(): string[] {
    const result = JSON.parse(localStorage.getItem(this.FAILED_RQUESTS_SPENDINGS_KEY) || '[]');
    localStorage.setItem(this.FAILED_RQUESTS_SPENDINGS_KEY, JSON.stringify([]));
    return result;
  }

  public offlineDeleteSpending(spendingId: string): void {
    const failedRquests: string[] = JSON.parse(localStorage.getItem(this.FAILED_RQUESTS_SPENDINGS_KEY) || '[]');
    failedRquests.push(spendingId);

    localStorage.setItem(this.FAILED_RQUESTS_SPENDINGS_KEY, JSON.stringify(failedRquests));
  }

  public offlineDeleteCategory(): void {
    
  }
}
