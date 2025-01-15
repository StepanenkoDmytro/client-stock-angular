import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import * as d3 from 'd3';
import { SimpleDataModel } from '../../../../../domain/d3.domain';
import { IDonutData } from '../donut/donut.component';

const PALETTE = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']; 

export interface DataModel {
  date: Date,
  value: number
}

@Component({
  selector: 'pgz-pie-chart',
  standalone: true,
  imports: [],
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss', '../chart.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PieChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  public set data(value: IDonutData | null) {
    this.totalSum = value.totalSum;
    this._data$.next(value.data);
  }
  @Input()
  public showNames: boolean = false;

  get isEmptyState(): boolean {
    return this._data$.value.length === 0 || this._data$.value.length === 1;
  }

  public totalSum: number = 0;
  public donutID: string = 'donut';
  public donutNamesID: string = 'donut-names';

  public colorEmpty: string = '#CBCACA';
  public d3 = d3;

  private svg: any;
  private colors: any;

  private _data$ = new BehaviorSubject<SimpleDataModel[] | null>(null);
  private dataSubject: SimpleDataModel[] = [];

  private margin = { top: 0, right: 0, bottom: 0, left: 0 };
  private width = 20;
  private height = 20;
  private radius = Math.min(this.width, this.height) / 2 - this.margin.left;
  

  private sub: Subscription | null = null;

  public ngOnInit(): void {
    const randomNum = Math.floor(Math.random() * 100);

    this.donutID = `${this.donutID}${randomNum}`;
    this.donutNamesID = `${this.donutNamesID}${randomNum}`;

    this.sub = this._data$.subscribe(data => {
      if (data && data.length > 0) {
        this.updateD3(data, PALETTE);
      }
    });
  }

  public ngAfterViewInit(): void {
    const data = this._data$.value;
    if (data && data.length > 0) {
      this.updateD3(this._data$.value, PALETTE);
    } else {
      const dataForNull: SimpleDataModel[] = [{
        name: 'dataForNull',
        value: 0
      }];
      this.updateD3(dataForNull, [this.colorEmpty]);
    }
  }

  private updateD3(data: SimpleDataModel[], palette: string[]): void {
    this.dataSubject = data;

    this.d3.select(`#${this.donutID}`).selectChildren('*').remove();
    this.d3.select(`#${this.donutNamesID}`).selectChildren('*').remove();
    this.createSvg();
    // this.createColors(palette);
    this.drawChart();

    if(this.showNames) {
      this.createNamesList();
    }
  }

  public ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private createSvg(): void {
    this.svg = this.d3

      .select(`div#${this.donutID}`)
      .append('svg')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.width / 2 + ',' + this.height / 2 + ')'
      );
  }

  private createColors(palette: string[]): void {
    this.colors = this.d3
      .scaleOrdinal<string>()
      .range(palette);
  }

  private drawChart(): void {
    const maxValue = d3.max(this.dataSubject, (d: SimpleDataModel) => d.value);

    const scale = d3.scaleLinear().domain([0, maxValue]).range([0, 100]);

    const pie = this.d3
      .pie<SimpleDataModel>()
      .sort(null)
      .value((d: SimpleDataModel) => scale(d.value));

    const data_ready = pie(this.dataSubject);

    const arc = this.d3
      .arc()
      .innerRadius(0)
      .outerRadius(this.radius * 1);

      this.svg
      .selectAll('allSlices')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', (d: any) => arc(d))
      .attr('fill', (d: any, i: any) => d.data.color);
    
    // const text = this.svg
    //   .append('text')
    //   .attr('alignment-baseline', 'middle')
    //   .attr('class', 'chart-label')
    //   .attr('fill', 'var(--black-color)')
    //   .attr('text-anchor', 'middle');

      //Залишив, якщо захочу зробити варіант з текстом
    // text
    //   .append('tspan')
    //   .attr('x', 0)
    //   .attr('y', -10)
    //   .attr('font-size', '26px')
    //   .attr('font-weight', '400')
    //   .text(`${this.portfolioData[0].name}`);

    // text
    //   .append('tspan')
    //   .attr('x', 0)
    //   .attr('y', 35)
    //   .attr('font-size', '50px')
    //   .attr('font-weight', '400')
    //   .text(`${this.totalSum.toFixed(2)}$`);
  }

  private createNamesList(): void {
    const data = this.dataSubject;
    const listContainer = this.d3.select(`div#${this.donutNamesID}`);

    if(data[0].name === "dataForNull") {
      const text = listContainer
        .style('display', 'block')
        .style('text-align', 'center')
        .append('text')
        .attr('alignment-baseline', 'middle')
        .attr('class', 'chart-label')
        .attr('fill', 'var(--black-color)')
        .attr('text-anchor', 'middle');

      text
        .append('tspan')
        .attr('x', 0)
        .attr('y', -10)
        .attr('font-size', '26px')
        .attr('font-weight', '400')
        .text('Its empty for now');

      return;
    }

    const tbody = listContainer
      .style('display', 'flex')
      .append('table')
      .style('width', '85%').append('tbody');

    const rows = tbody
      .selectAll('tr')
      .data(data)
      .enter()
      .append('tr')
      .style('position', 'relative');

    rows
      .append('td')
      .text(' ')
      .classed('d3-name-marker', true)
      .style('background-color', (d: SimpleDataModel, i: number) => this.colors(i.toString()))

    rows
      .append('td')
      .html((d: SimpleDataModel) => `<div class="d3-name"><p>${d.name}</p> <p>${d.value}%</p></div>`);

  }
}
