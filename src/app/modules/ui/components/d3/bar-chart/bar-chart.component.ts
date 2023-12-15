/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';
import { BehaviorSubject, Subscription } from 'rxjs';
import { IExpend } from 'src/app/domain/mock.domain';
import { D3Service } from 'src/app/service/d3.service';

const customColors = ['#c32f0ddd'];

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
})
export class BarChartComponent implements OnInit, AfterViewInit, OnDestroy {
  public barChartID: string = 'bar-chart';

  private _data$ = new BehaviorSubject<any>(null);
  private svg: any;
  private colors: any;
  private width = 300;
  private height = 200;
  private margin = { top: 20, right: 0, bottom: 30, left: 20 };

  private mouseMove$: any;
  private sub: Subscription | null = null;
  private resizechartContainer: ResizeObserver | null = null;

  @ViewChild('chartContainer', { static: true })
  private chartContainer!: ElementRef;

  constructor(private d3: D3Service) {}

  ngOnInit(): void {
    const randomNum = Math.floor(Math.random() * 100);
    this.barChartID = `${this.barChartID}${randomNum}`;

    this.sub = this._data$.subscribe(portfolio => {
      if (portfolio) {
        this.updateD3(portfolio);
      }
    });

    const month: any[] = [
      { name: 'Jan', value: 10 },
      { name: 'null', value: 18 },
      { name: 'Mar', value: 11 },
      { name: 'null1', value: 7 },
      { name: 'May', value: 15 },
      { name: 'null2', value: 9 },
      { name: 'July', value: 13 },
      { name: 'null3', value: 2 },
      { name: 'Sep', value: 5 },
      { name: 'null4', value: 17 },
      { name: 'Nov', value: 8 },
      { name: 'null5', value: 12 },
    ];

    this._data$.next(month);
  }

  ngAfterViewInit(): void {
    this.resizechartContainer = new ResizeObserver(entries => {
      if (entries[0].target.clientWidth > 200) {
        this.width =
          entries[0].target.clientWidth - this.margin.left - this.margin.right;
      }

      if (this._data$.value) {
        this.updateD3(this._data$.value);
      }
    });

    this.resizechartContainer.observe(this.chartContainer.nativeElement);
  }

  private updateD3(data: IExpend): void {
    const dataArray = Array.isArray(data) ? data : [data];

    this.d3.d3.select(`#${this.barChartID}`).selectChildren('*').remove();
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
    this.svg = this.d3.d3
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
    this.colors = this.d3.d3
      .scaleOrdinal<string>()
      .domain(data.map((d: any) => d.name))
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
      .attr('fill', 'var(--accept-color)')
      .attr('opacity', '0.9');

    this.svg
      .append('g')
      .attr(
        'transform',
        'translate(0,' +
          (this.height - this.margin.top - this.margin.bottom) +
          ')'
      )
      .call(this.d3.d3.axisBottom(x))
      .selectAll('text')
      .style('color', (d: any) => {
        return d.includes('null') ? 'rgb(0,0,0,0)' : 'black';
      });

    this.svg.append('g').call(this.d3.d3.axisLeft(y));
  }
}
