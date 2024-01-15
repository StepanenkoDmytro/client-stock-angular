import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DarkLightModeService {
  private theme: { [key: string]: string } = {
    light: 'light-theme',
    dark: 'dark-theme',
  };
  private activeThemeSubject = new BehaviorSubject<string | undefined>(undefined);
  activeTheme$ = this.activeThemeSubject.asObservable();

  constructor() { }


  get activeTheme(): string | undefined {
    return this.activeThemeSubject.getValue();
  }

  set(themeName: string): void {
    if (this.activeTheme === themeName || !this.themeNames.includes(themeName)) {
      return;
    }

    this.activeThemeSubject.next(themeName);
    document.documentElement.classList.remove(...Object.values(this.theme));
    document.documentElement.classList.add(this.theme[themeName]);

    localStorage.setItem('theme', themeName);
  }

  get themeNames(): string[] {
    return Object.keys(this.theme);
  }

  get mode(): string {
    return localStorage.getItem('theme');
  }
}
