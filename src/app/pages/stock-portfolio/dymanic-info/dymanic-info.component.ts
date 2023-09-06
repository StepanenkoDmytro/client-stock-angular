import { AfterContentChecked, AfterContentInit, AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, DoCheck, ElementRef, OnChanges, OnDestroy, OnInit, Renderer2, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { tap } from 'rxjs';
import { ElementTable } from '../stock-market/stock-details/stock-details.component';
import { COMMODITY_MOCKS } from 'src/app/domain/mock.domain';


export interface ICommodityTable {
  commodity: string,
  price: number,
  change: number,
  percentageChange: string
}

@Component({
  selector: 'app-dymanic-info',
  templateUrl: './dymanic-info.component.html',
  styleUrls: ['./dymanic-info.component.scss']
})
export class DymanicInfoComponent implements OnInit, OnDestroy {
  public toppings!: FormGroup;
  public indexDisplayCtrl: FormControl = new FormControl(false);
  public calculatorDisplayCtrl: FormControl = new FormControl(false);
  public profitDisplayCtrl: FormControl = new FormControl(false);
  public isPrimaryVisibleHeight = false;
  public isPrimaryVisibleWidth = false;

  public displayedColumns: string[] = ['property', 'value'];
  public displayedColumnsCommodity: string[] = ['commodity', 'price', 'change', 'percentageChange'];

  public dataSourceProfit!: MatTableDataSource<ElementTable>;
  public dataSourceCommodity!: MatTableDataSource<ICommodityTable>;

  public width!: number;
  public height!: number;

  resizeObserver!: ResizeObserver;


  @ViewChild('chartContainer', { static: true })
  chartContainer!: ElementRef;

  constructor(private formBuilder: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private renderer: Renderer2) { }

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
      calculatorDisplayCtrl: this.calculatorDisplayCtrl,
      profitDisplayCtrl: this.profitDisplayCtrl,
    });

    this.toppings.valueChanges
      .subscribe(() => {
        this.isPrimaryVisibleHeight = [this.calculatorDisplayCtrl, this.profitDisplayCtrl
        ].some(control => control.value === true);

        this.isPrimaryVisibleWidth = [this.calculatorDisplayCtrl, this.profitDisplayCtrl
        ].every(control => control.value === true);
      });

    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        console.log(entry);
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
}
