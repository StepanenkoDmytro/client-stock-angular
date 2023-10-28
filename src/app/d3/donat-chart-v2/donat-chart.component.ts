import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription, fromEvent } from 'rxjs';
import { IExpend } from 'src/app/domain/mock.domain';
import { IPortfolio, IPortfolioStock } from 'src/app/domain/portfolio.domain';
import { SimpleDataModel } from 'src/app/domain/widget.domain';
import { D3Service } from 'src/app/service/d3.service';


const customColors = [
  '#c32f0ddd', '#0493c3', '#832174', '#02a02f', '#d7a502',
  '#c1014e', '#0071d4', '#c87800', '#01b48a', '#782814',
  '#206273', '#b8784e', '#66FF33', '#48653c', '#00BBFF',
  '#FF3399', '#33FF66', '#FFCC00', '#00FF99', '#a74300'
];

@Component({
  selector: 'app-donat-chart-v2',
  templateUrl: './donat-chart.component.html',
  styleUrls: ['./donat-chart.component.scss']
})
export class DonatChartComponentV2 implements OnInit, AfterViewInit, OnDestroy {

  @Input()
  public set portfolio(value: IExpend | null) {
    this._portfolio$.next(value);
  }
  public donutID: string = 'donut';

  @Input()
  public color: string = '#0493c3';

  private _portfolio$ = new BehaviorSubject<IExpend | null>(null)
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

  constructor(private d3: D3Service) { }
  ngOnInit(): void {
    const randomNum = Math.floor(Math.random() * 100);
    this.donutID = `${this.donutID}${randomNum}`;
    this.sub = this._portfolio$.subscribe((portfolio) => {
      if (portfolio) {
        this.updateD3(portfolio);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this._portfolio$.value) {
      this.updateD3(this._portfolio$.value);
    }
  }

  private updateD3(portfolio: IExpend): void {
    // this.totalBalance = portfolio.balance ?? 0;
    // this.riskness = portfolio.riskness ?? '';
    this.data = [this.mapStocksToSimpleDataModel(portfolio)];

    this.d3.d3.select(`#${this.donutID}`).selectChildren('*').remove();
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

  private mapStocksToSimpleDataModel(stocks: IExpend | undefined): SimpleDataModel {
    return {
      name: stocks.title,
      value: stocks.money.toString(),
    };
  }

  private createSvg(): void {
    this.svg = this.d3.d3

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


    this.colors = this.d3.d3.scaleOrdinal<string>()
      // .domain(data.map((d: any) => d.name))
      .range(data);
  }

  private drawChart(): void {

    var pie = this.d3.d3
      .pie<SimpleDataModel>()
      .sort(null)
      .value((d: SimpleDataModel) => parseInt(d.value));

    var data_ready = pie(this.data);

    var arc = this.d3.d3
      .arc()
      .innerRadius(this.radius * 0.5)
      .outerRadius(this.radius * 0.8);

    this.svg
      .selectAll('allSlices')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', this.color)
      .attr('stroke', 'var(--dark-color)')
      .style('stroke-width', '4')
      .style('opacity', 0.7);

    const text = this.svg.append('text')
      .attr('alignment-baseline', 'middle')
      .attr('class', 'chart-label')
      .attr('fill', 'var(--black-color)')
      .attr('text-anchor', 'middle');

    text.append('tspan')
      .attr('x', 0)
      .attr('y', -10)
      .attr('font-size', '26px')
      .attr('font-weight', '400')
      .text(`${this.data[0].name}`);
    
      text.append('tspan')
      .attr('x', 0)
      .attr('y', 35)
      .attr('font-size', '30px')
      .attr('font-weight', '400')
      .text(`${this.data[0].value}$`);
  }
}
