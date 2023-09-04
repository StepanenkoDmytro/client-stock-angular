import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { tap } from 'rxjs';
import { ElementTable } from '../stock-market/stock-details/stock-details.component';


export interface IProfit {
  day: string,
  month: string,
  receivedDividend: string,
  forecastDividend: string
}

@Component({
  selector: 'app-stock-portfolio',
  templateUrl: './stock-portfolio.component.html',
  styleUrls: ['./stock-portfolio.component.scss']
})
export class StockPortfolioComponent implements OnInit {
  public toppings!: FormGroup;
  public indexDisplayCtrl: FormControl = new FormControl(false);
  public calculatorDisplayCtrl: FormControl = new FormControl(false);
  public profitDisplayCtrl: FormControl = new FormControl(false);
  public isPrimaryVisible = false;
  public displayedColumns: string[] = ['property', 'value'];
  public dataSourceProfit!: MatTableDataSource<ElementTable>;
  public dataSourceCalculator!: MatTableDataSource<ElementTable>;

  public width!: number;
  public height!: number;

  resize!: ResizeObserver;


  @ViewChild('chartContainer', { static: true })
  chartContainer!: ElementRef;

  constructor(private formBuilder: FormBuilder,
    private cdRef: ChangeDetectorRef) { }

  ngOnInit(): void {

    const calculatorProperties: ElementTable[] = [
      { property: 'USD', value: '100$' },
      { property: 'EUR', value: '87€' },
      { property: 'UAH', value: '100₴' },
    ];

    const profitsproProperties: ElementTable[] = [
      { property: 'Day', value: '10' },
      { property: 'Month', value: '100' },
      { property: 'Received Dividend', value: '100' },
      { property: 'Forecast Dividend', value: '50' },
    ];
    this.dataSourceCalculator = new MatTableDataSource(calculatorProperties);
    this.dataSourceProfit = new MatTableDataSource(profitsproProperties);

    this.toppings = this.formBuilder.group({
      indexDisplayCtrl: this.indexDisplayCtrl,
      calculatorDisplayCtrl: this.calculatorDisplayCtrl,
      profitDisplayCtrl: this.profitDisplayCtrl,
    });

    this.width = this.chartContainer.nativeElement.clientWidth;
    this.height = this.chartContainer.nativeElement.clientHeight;

    this.toppings.valueChanges
    .pipe(
      tap(() => {
        this.width = 0;
        this.height = 0;
        console.log('in tap');
        this.cdRef.detectChanges();
      })
    )
    .subscribe(() => {
      this.isPrimaryVisible = [
        // this.indexDisplayCtrl,
        this.calculatorDisplayCtrl, this.profitDisplayCtrl
      ].every(control => control.value === true);
      this.width = this.chartContainer.nativeElement.clientWidth;
      this.height =this.chartContainer.nativeElement.clientHeight;

      this.cdRef.detectChanges();
    });
  }
}
