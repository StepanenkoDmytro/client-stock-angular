import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRoutes } from '../../../../app.routes';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AddTriggerService } from '../../../../service/helpers/add-trigger.service';
import { AddBtnComponent } from '../add-btn/add-btn.component';
import { UserService } from '../../../../service/user.service';
import { UserMode } from '../../../../model/User';
import { IconComponent } from '../icon/icon.component';


export interface INavigationItem {
  path: AppRoutes;
  icon: string;
}

@Component({
  selector: 'pgz-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, AddBtnComponent],
})
export class NavigationComponent implements OnInit {
  public isFlipping: boolean = false;
  public UserMode = UserMode;
  public currentMode: UserMode = UserMode.Stage;
  public isActive: boolean = false;

  public SPENDING_NAV_ITEM: INavigationItem = {
    path: AppRoutes.SPENDING,
    icon: 'custom_wallet',
  };
  
  public SAVINGS_NAV_ITEM: INavigationItem = {
    path: AppRoutes.SAVINGS,
    icon: 'savings',
  };
  
  public GOALS_NAV_ITEM: INavigationItem = {
    path: AppRoutes.GOALS,
    icon: 'crisis_alert',
  };
  
  public SETTINGS_NAV_ITEM: INavigationItem = {
    path: AppRoutes.PROFILE,
    icon: 'custom_profile-settings',
  };

  constructor(
    private addTriggerService: AddTriggerService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.userService.getUser().subscribe((user) => {
      console.log('dsada');
      this.triggerFlipAnimation(); // Запускаємо анімацію
      setTimeout(() => {
        this.currentMode = user?.mode;
        this.cdr.detectChanges();
      }, 600); // Затримка для синхронізації зі стилем
    });
  }

  private triggerFlipAnimation(): void {
    if (this.isFlipping) return; // Якщо анімація вже запущена, не запускаємо повторно
  
    this.isFlipping = true; // Активуємо анімацію
    this.cdr.detectChanges(); // Сигналізуємо Angular про зміну стану
  
    // Після завершення анімації скидаємо стан
    setTimeout(() => {
      this.isFlipping = false;
      this.cdr.detectChanges(); // Оновлюємо DOM
    }, 600); // 600ms — тривалість анімації в CSS
  }
  

  public onButtonClick(): void {
    this.addTriggerService.triggerButtonClick();
  }
}
