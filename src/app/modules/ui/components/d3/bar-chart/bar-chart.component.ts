/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import * as d3 from 'd3';
import { BehaviorSubject, Subscription } from 'rxjs';
import { IExpend } from 'src/app/domain/mock.domain';
import { D3Service } from 'src/app/service/d3.service';

const customColors = [
  '#c32f0ddd',
  '#0493c3',
  '#832174',
  // ... add more colors as needed
];

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
})
export class BarChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  public set data(value: IExpend | null) {
  const mock: any[] = [
    { name: 'January', value: 10 },
    { name: 'February', value: 20 },
    { name: 'March', value: 20 },
    { name: 'April', value: 20 },
    { name: 'May', value: 20 },
    { name: 'June', value: 20 },
    { name: 'July', value: 20 },
    { name: 'August', value: 20 },
    { name: 'September', value: 20 },
    { name: 'October', value: 20 },
    { name: 'November', value: 20 },
    { name: 'December', value: 20 },
  ];
  
    this._data$.next(mock);
  }
  public barChartID: string = 'bar-chart';

  private _data$ = new BehaviorSubject<any>(null);
  private svg: any;
  private colors: any;
  private width = 300;
  private height = 200;
  private margin = { top: 20, right: 20, bottom: 30, left: 40 };

  private mouseMove$: any;
  private sub: Subscription | null = null;

  constructor(private d3: D3Service) {}

  ngOnInit(): void {
    const randomNum = Math.floor(Math.random() * 100);
    this.barChartID = `${this.barChartID}${randomNum}`;
    this.sub = this._data$.subscribe(portfolio => {
      if (portfolio) {
        this.updateD3(portfolio);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this._data$.value) {
      this.updateD3(this._data$.value);
    }
  }

  private updateD3(data: IExpend): void {
    // Ensure data is an array
    const dataArray = Array.isArray(data) ? data : [data];
  
    this.d3.d3.select(`#${this.barChartID}`).selectChildren('*').remove();
    this.createSvg();
    this.createColors(dataArray); // Pass the array to createColors
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
    // Add any necessary interactivity here using D3
  }

  private createSvg(): void {
    this.svg = this.d3.d3
      .select(`div#${this.barChartID}`)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      );
  }

  private createColors(data: any[]): void {
    // Assuming each bar corresponds to a category, use a color scale
    this.colors = this.d3.d3
      .scaleOrdinal<string>()
      .domain(data.map((d: any) => d.name)) // assuming each bar has a unique name
      .range(customColors);
  }
  

  private drawChart(data: any[]): void {
    const x = this.d3.d3
      .scaleBand()
      .range([0, this.width - this.margin.left - this.margin.right])
      .domain((data as Array<{ name: string; value: number }>).map(d => d.name))
      .padding(0.1);

    const y = this.d3.d3
      .scaleLinear()
      .range([this.height - this.margin.top - this.margin.bottom, 0])
      .domain([
        0,
        d3.max(data as Array<{ name: string; value: number }>, d => d.value),
      ]);

    // Rest of your code

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
      .attr('fill', (d: any, i: number) => this.colors(i.toString()));

    // Add axes if needed
    this.svg
      .append('g')
      .attr(
        'transform',
        'translate(0,' +
          (this.height - this.margin.top - this.margin.bottom) +
          ')'
      )
      .call(this.d3.d3.axisBottom(x));

    this.svg.append('g').call(this.d3.d3.axisLeft(y));
  }
}
