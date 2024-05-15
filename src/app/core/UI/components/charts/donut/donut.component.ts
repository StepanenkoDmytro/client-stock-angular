import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SimpleDataModel } from '../../../../../domain/d3.domain';
import * as d3 from 'd3';


@Component({
  selector: 'pgz-donut',
  templateUrl: './donut.component.html',
  styleUrl: './donut.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
})
export class DonutComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  public set data(value: SimpleDataModel[] | null) {
    this._data$.next(value);
  }
  public donutID: string = 'donut';

  @Input()
  public color: string = '#CBCACA';
  public d3 = d3;

  private _data$ = new BehaviorSubject<SimpleDataModel[] | null>(null);
  private dataSubject: SimpleDataModel[] = [];

  private margin = { top: 0, right: 0, bottom: 0, left: 0 };
  private width = 450;
  private height = 450;
  private svg: any;
  private colors: any;
  private radius = Math.min(this.width, this.height) / 2 - this.margin.left;

  private sub: Subscription | null = null;

  public ngOnInit(): void {
    const randomNum = Math.floor(Math.random() * 100);

    this.donutID = `${this.donutID}${randomNum}`;
    this.sub = this._data$.subscribe(data => {
      if (data) {
        this.updateD3(data);
      }
    });
  }

  public ngAfterViewInit(): void {
    if (this._data$.value) {
      this.updateD3(this._data$.value);
    }
  }

  private updateD3(data: SimpleDataModel[]): void {
    this.dataSubject = data;

    this.d3.select(`#${this.donutID}`).selectChildren('*').remove();
    this.createSvg();
    this.createColors();
    this.drawChart();
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

  private createColors(): void {
    const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

    this.colors = this.d3
      .scaleOrdinal<string>()
      .range(colors);
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
      .innerRadius(this.radius * 0.75)
      .outerRadius(this.radius * 1);

      this.svg
      .selectAll('allSlices')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', (d: any) => arc(d))
      .attr('fill', (d: any, i: any) => this.colors(i.toString()));
    

    const text = this.svg
      .append('text')
      .attr('alignment-baseline', 'middle')
      .attr('class', 'chart-label')
      .attr('fill', 'var(--black-color)')
      .attr('text-anchor', 'middle');

      //Залишив, якщо захочу зробити варіант з текстом
    // text
    //   .append('tspan')
    //   .attr('x', 0)
    //   .attr('y', -10)
    //   .attr('font-size', '26px')
    //   .attr('font-weight', '400')
    //   .text(`${this.portfolioData[0].name}`);
    const totalBalance = this.getTotalBalanceValue();

    text
      .append('tspan')
      .attr('x', 0)
      .attr('y', 35)
      .attr('font-size', '30px')
      .attr('font-weight', '400')
      .text(`${totalBalance}$`);
  }

  private getTotalBalanceValue(): number {
    return this.dataSubject
                  .map(data => data.value)
                  .reduce((accumulator, value) => accumulator + value, 0);
  }
}
