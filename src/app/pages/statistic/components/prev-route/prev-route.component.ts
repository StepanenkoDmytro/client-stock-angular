import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { BreadCrumb, StatisticStateService } from '../../service/statistic-state.service';

@Component({
  selector: 'pgz-prev-route',
  standalone: true,
  imports: [MatIconModule, RouterModule],
  templateUrl: './prev-route.component.html',
  styleUrl: './prev-route.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrevRouteComponent implements OnInit, OnDestroy {

  public breadCrumbs: BreadCrumb[] = [];

  constructor(
    private statisticStateService: StatisticStateService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) { }

  public ngOnInit(): void {
    this.statisticStateService.breadCrumbs.subscribe(categories => {
      console.log('update');
      if(categories.length > 0) {
        this.breadCrumbs = categories.map(category => {
          const breadCrumb: BreadCrumb = {
            label: category.title,
            path: category.id
          };

          return breadCrumb;
        });
        // this.breadCrumbs = newRoute
        this.cdr.detectChanges();
      }
    })
  }

  public navigate(crumb: BreadCrumb) {
    // const crumbIndex = this.breadCrumbs.indexOf(crumb);
    
    // this.breadCrumbs = this.breadCrumbs.splice(crumbIndex - 1, this.breadCrumbs.length);

    // console.log('after ', this.breadCrumbs);
    this.statisticStateService.updateBreadCrumbs(crumb.path);
    this.router.navigate(['/statistic/details', crumb.path]);
  }

  public ngOnDestroy(): void {
    this.statisticStateService.breadCrumbs.next([]);
  }
}
