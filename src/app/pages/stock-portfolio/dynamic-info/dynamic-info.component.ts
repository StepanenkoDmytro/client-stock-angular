import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DashboardStateService } from 'src/app/service/dashboard-state.service';


export interface ICommodityTable {
  commodity: string,
  price: number,
  change: number,
  percentageChange: string
}

@Component({
  selector: 'app-dynamic-info',
  templateUrl: './dynamic-info.component.html',
  styleUrls: ['./dynamic-info.component.scss']
})
export class DymanicInfoComponent implements OnInit, OnDestroy {

  public width!: number;
  public height!: number;

  private resizeObserver!: ResizeObserver;

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef;

  constructor(
    public stateService: DashboardStateService,
    private cdRef: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {

    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.width = entry.target.clientWidth;
        this.height = entry.target.clientHeight;

        this.cdRef.detectChanges();
      }
    });
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  public ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this.chartContainer.nativeElement);
    }
  }
}
