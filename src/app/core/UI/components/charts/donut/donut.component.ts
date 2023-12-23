import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ID3Value, SimpleDataModel } from '../../../../../domain/d3.domain';
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
  public set portfolio(value: ID3Value | null) {
    this._portfolio$.next(value);
  }
  public donutID: string = 'donut';

  @Input()
  public color: string = '#CBCACA';
  public d3 = d3;

  private _portfolio$ = new BehaviorSubject<ID3Value | null>(null);
  private data: SimpleDataModel[] = [];
  private totalBalance: number = 0;
  private riskness: string = '';

  private margin = { top: 0, right: 0, bottom: 0, left: 0 };
  private width = 450;
  private height = 450;
  private svg: any;
  private colors: any;
  private radius = Math.min(this.width, this.height) / 2 - this.margin.left;

  private mouseMove$: any;
  private sub: Subscription | null = null;

  public ngOnInit(): void {
    const randomNum = Math.floor(Math.random() * 100);
    this.donutID = `${this.donutID}${randomNum}`;
    this.sub = this._portfolio$.subscribe(portfolio => {
      if (portfolio) {
        this.updateD3(portfolio);
      }
    });
  }

  public ngAfterViewInit(): void {
    if (this._portfolio$.value) {
      this.updateD3(this._portfolio$.value);
    }
  }

  private updateD3(portfolio: ID3Value): void {
    this.data = [this.mapStocksToSimpleDataModel(portfolio)];

    this.d3.select(`#${this.donutID}`).selectChildren('*').remove();
    this.createSvg();
    this.createColors(this.color);
    this.drawChart();
  }

  public ngOnDestroy(): void {
    if (this.mouseMove$) {
      this.mouseMove$.unsubscribe;
    }

    this.sub?.unsubscribe();
  }

  private mapStocksToSimpleDataModel(
    stocks: ID3Value | undefined
  ): SimpleDataModel {
    return {
      name: stocks? stocks.title : '',
      value: stocks ? stocks.money.toString() : '',
    };
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

  private createColors(data: any): void {
    this.colors = this.d3
      .scaleOrdinal<string>()
      .range(data);
  }

  private drawChart(): void {
    const pie = this.d3
      .pie<SimpleDataModel>()
      .sort(null)
      .value((d: SimpleDataModel) => parseInt(d.value));

    const data_ready = pie(this.data);

    const arc = this.d3
      .arc()
      .innerRadius(this.radius * 0.75)
      .outerRadius(this.radius * 1);

    this.svg
      .selectAll('allSlices')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', this.color);

    const text = this.svg
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
      .text(`${this.data[0].name}`);

    text
      .append('tspan')
      .attr('x', 0)
      .attr('y', 35)
      .attr('font-size', '30px')
      .attr('font-weight', '400')
      .text(`${this.data[0].value}$`);
  }
}
