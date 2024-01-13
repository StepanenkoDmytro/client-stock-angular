import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ID3Value } from '../../../../../domain/d3.domain';
import { IBarData, MOCK_BAR_DATA } from '../../../../../domain/statistic.domain';


@Component({
  selector: 'pgz-bar',
  standalone: true,
  imports: [],
  templateUrl: './bar.component.html',
  styleUrl: './bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarComponent implements OnInit, AfterViewInit, OnDestroy {
  public d3 = d3;
  public barChartID: string = 'bar-chart';

  private _data$ = new BehaviorSubject<any>(null);

  @Input() 
  set values(values: IBarData[]) {
    const data = values || MOCK_BAR_DATA;
    this._data$.next(data);
  }

  private svg: any;
  private colors: any;
  private customColors = ['#c32f0ddd'];
  private width = 300;
  private height = 200;
  private margin = { top: 20, right: 0, bottom: 30, left: 20 };

  private mouseMove$: any;
  private sub: Subscription | null = null;
  private resizechartContainer: ResizeObserver | null = null;

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef;

  ngOnInit(): void {
    const randomNum = Math.floor(Math.random() * 100);
    this.barChartID = `${this.barChartID}${randomNum}`;

    this.sub = this._data$.subscribe(data => {
      if (data) {
        this.updateD3(data);
      }
    });
  }

  ngAfterViewInit(): void {
    this.resizechartContainer = new ResizeObserver(entries => {
      if (entries[0].target.clientWidth > 200) {
        this.width =
          entries[0].target.clientWidth - this.margin.left - this.margin.right;
      }
      this.updateD3(this._data$.value);
    });
    
    this.resizechartContainer.observe(this.chartContainer.nativeElement);
  }

  private updateD3(data: ID3Value): void {
    const dataArray = Array.isArray(data) ? data : [data];

    this.d3.select(`#${this.barChartID}`).selectChildren('*').remove();
    this.createSvg();
    this.createColors(dataArray);
    this.drawChart(dataArray);
    this.clientAction();
  }

  public ngOnDestroy(): void {
    if (this.mouseMove$) {
      this.mouseMove$.unsubscribe();
    }

    this.sub?.unsubscribe();
  }

  private clientAction(): void {
    //TODO ?
  }

  private createSvg(): void {
    this.svg = this.d3
      .select(`div#${this.barChartID}`)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('width', '100%')
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      );
  }

  private createColors(data: any[]): void {
    this.colors = this.d3
      .scaleOrdinal<string>()
      .domain(data.map((d: any) => d.name))
      .range(this.customColors);
  }

  private drawChart(data: any[]): void {
    const x = this.d3
      .scaleBand()
      .range([0, this.width - this.margin.left - this.margin.right])
      .domain((data as Array<{ name: string; value: number }>).map(d => d.name))
      .padding(0.1);

    const y = this.d3
      .scaleLinear()
      .range([this.height - this.margin.top - this.margin.bottom, 0])
      .domain([
        0,
        d3.max(data as Array<{ name: string; value: number }>, d => d.value),
      ]);

    const maxValue = d3.max(
      data as Array<{ name: string; value: number }>,
      d => d.value
    );

    const evenNumbers = Array.from(
      { length: Math.floor(maxValue / 2) + 1 },
      (_, index) => index * 2
    );

    this.svg
      .append('g')
      .selectAll('line')
      .data(evenNumbers)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', this.width - this.margin.left)
      .attr('y1', (d: any) => {
        return y(d);
      })
      .attr('y2', (d: any) => y(d))
      .style('stroke', '#331d1d57')
      .style('stroke-width', '0.3px');

    this.svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d: any) => x(d.name))
      .attr('y', (d: any) => y(d.value))
      .attr('width', x.bandwidth())
      .attr(
        'height',
        (d: any) =>
          this.height - this.margin.top - this.margin.bottom - y(d.value)
      )
      .attr('fill', 'var(--accept-color)');

    this.svg
      .append('g')
      .attr(
        'transform',
        'translate(0,' +
          (this.height - this.margin.top - this.margin.bottom) +
          ')'
      )
      .call(this.d3.axisBottom(x))
      .selectAll('text')
      .style('color', (d: any) => {
        return d.includes('null') ? 'rgb(0,0,0,0)' : 'black';
      });

    this.svg.append('g').call(this.d3.axisLeft(y));
  }
}
