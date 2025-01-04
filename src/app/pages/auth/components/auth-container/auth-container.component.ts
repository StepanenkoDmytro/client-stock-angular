import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ArrowBackComponent } from '../../../../core/UI/components/arrow-back/arrow-back.component';
import { AppRoutes } from '../../../../app.routes';

@Component({
  selector: 'pgz-auth-container',
  standalone: true,
  imports: [ArrowBackComponent, RouterOutlet, RouterModule],
  templateUrl: './auth-container.component.html',
  styleUrl: './auth-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthContainerComponent implements OnInit, OnDestroy {
  public PROFILE_LINK = AppRoutes.PROFILE;
  public ngOnInit(): void {
    document.body.classList.add('hide-after');
  }

  public ngOnDestroy(): void {
    document.body.classList.remove('hide-after');
  }
}
