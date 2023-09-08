import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ElementTable } from '../stock-market/stock-details/stock-details.component';
import { COMMODITY_MOCKS } from 'src/app/domain/mock.domain';


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
  // wallet = new FormControl('bla');
  public panelOpenState: boolean = false;

  public toppings!: FormGroup;
  public indexDisplayCtrl: FormControl = new FormControl(true);
  public commodityDisplayCtrl: FormControl = new FormControl(true);
  public profitDisplayCtrl: FormControl = new FormControl(true);
  public isPrimaryVisibleHeight = false;
  public isPrimaryVisibleWidth = false;
  public isVisibleRiskness = true;
  public isPrimaryInfoVisible = true;

  public isVisibleAccountAction = true;

  public displayedColumns: string[] = ['property', 'value'];
  public displayedColumnsCommodity: string[] = ['commodity', 'price', 'change', 'percentageChange'];

  public dataSourceProfit!: MatTableDataSource<ElementTable>;
  public dataSourceCommodity!: MatTableDataSource<ICommodityTable>;

  public width!: number;
  public height!: number;

  resizeObserver!: ResizeObserver;

  public isMaxHeight = false;
  public isMinHeight = false;


  @ViewChild('chartContainer', { static: true })
  chartContainer!: ElementRef;

  constructor(private formBuilder: FormBuilder,
    private cdRef: ChangeDetectorRef) { }

  ngOnInit(): void {

    this.dataSourceCommodity = new MatTableDataSource(COMMODITY_MOCKS);

    const profitsProperties: ElementTable[] = [
      { property: 'Day', value: '10' },
      { property: 'Month', value: '100' },
      { property: 'Received Dividend', value: '100' },
      { property: 'Forecast Dividend', value: '50' },
    ];
    this.dataSourceProfit = new MatTableDataSource(profitsProperties);


    this.toppings = this.formBuilder.group({
      indexDisplayCtrl: this.indexDisplayCtrl,
      commodityDisplayCtrl: this.commodityDisplayCtrl,
      profitDisplayCtrl: this.profitDisplayCtrl,
    });

    this.toppings.valueChanges
      .subscribe(() => {
        this.initNewView();
      });

    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.width = entry.target.clientWidth;
        this.height = entry.target.clientHeight;

        this.cdRef.detectChanges();
      }
    });
    this.resizeObserver.observe(this.chartContainer.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this.chartContainer.nativeElement);
    }
  }

  initNewView(): void {
    //TODO написати булеан змінні для всіх випадків
    this.isPrimaryVisibleHeight = [this.commodityDisplayCtrl, this.profitDisplayCtrl
    ].some(control => control.value === false);

    this.isPrimaryVisibleWidth = [this.commodityDisplayCtrl, this.profitDisplayCtrl
    ].every(control => control.value === false);

    this.isVisibleRiskness = ![this.indexDisplayCtrl.value, this.commodityDisplayCtrl.value, this.profitDisplayCtrl.value].some(control => control === false);
    
    this.isVisibleAccountAction = !this.isPrimaryVisibleHeight;

    this.isPrimaryInfoVisible = this.checkVisibleTotalPrimaryInfo();

    this.isMaxHeight = this.indexDisplayCtrl.value && this.isPrimaryVisibleHeight;
    this.isMinHeight = !this.indexDisplayCtrl.value && this.isPrimaryVisibleHeight;
  }

  checkVisibleTotalPrimaryInfo(): boolean {
    const index = this.indexDisplayCtrl.value;
    const commodity = this.commodityDisplayCtrl.value;
    const profit = this.profitDisplayCtrl.value;


    if(index && profit && commodity) {
      return true;
    } else if (!index && this.isPrimaryVisibleHeight) {
      return false;
    } else if (!index && this.isPrimaryVisibleWidth) {
      return false;
    } else if(index && commodity && profit) {
      return true;
    } else {
      return true;
    }
  }
}
