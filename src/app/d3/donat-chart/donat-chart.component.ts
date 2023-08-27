import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, map } from 'rxjs';
import { D3Service } from 'src/app/service/d3.service';

export interface SimpleDataModel {
  name: string;
  value: string;
  color?: string;
}

const customColors = [
  '#c32f0ddd', '#0493c3', '#832174', '#02a02f', '#d7a502',
  '#c1014e', '#0071d4', '#c87800', '#01b48a', '#782814',
  '#206273', '#b8784e', '#66FF33', '#48653c', '#00BBFF',
  '#FF3399', '#33FF66', '#FFCC00', '#00FF99', '#a74300'
];

@Component({
  selector: 'app-donat-chart',
  templateUrl: './donat-chart.component.html',
  styleUrls: ['./donat-chart.component.scss']
})
export class DonatChartComponent implements OnInit, OnDestroy {
  @Input('data') private data: SimpleDataModel[] = [
    { name: 'Tesla Inc', value: '20%' },
    { name: 'Banc of America', value: '40%' },
    { name: 'Ford Motor Company', value: '10%' },
    { name: 'Apple Inc', value: '20%' },
    { name: 'Coca Cola Co', value: '10%' },
  ];

  private margin = { top: 0, right: 0, bottom: 0, left: 0 };
  private width = 450;
  private height = 450;
  private svg: any;
  private colors: any;
  private radius = Math.min(this.width, this.height) / 2 - this.margin.left;

  private mouseMove$: any;

  constructor(private d3: D3Service) { }

  ngOnInit(): void {
    this.createSvg();
    this.createColors(this.data);
    this.drawChart();
    this.clientAction();
  }

  ngOnDestroy(): void {
    if (this.mouseMove$) {
      this.mouseMove$.unsubscribe;
    }
  }

  private clientAction(): void {
    const tooltip = this.d3.d3.select('#tooltip');

    const svgContainerElement = this.svg.node();
    if (svgContainerElement instanceof Element) {

      this.mouseMove$ = fromEvent<MouseEvent>(svgContainerElement, 'mousemove');
      // .pipe(
      //   map(event => ({
      //     curData: event.target.__data__.data,
      //     index: event.target.__data__.index + 1,

      //     offsetX: event.offsetX,
      //     offsetY: event.offsetY,
      //   }))
      // );

      this.mouseMove$.subscribe((event: any) => {

        if (event.target.__data__) {
          const curData = event.target.__data__.data;
          const index = event.target.__data__.index + 1;

          const offsetX = event.offsetX;
          const offsetY = event.offsetY;


          this.svg.selectAll('path')
            .style('opacity', 0.5)
            .on('mouseout', () => {
              this.svg.selectAll('path')
                .style('opacity', 0.7);

              tooltip
                .style('display', 'none');

              this.svg.select(`path:nth-child(${index})`)
                .attr('stroke', 'var(--black-color)')
                .style('stroke-width', '10');
            });

          this.svg.select(`path:nth-child(${index})`)
            .style('opacity', 1)
            .attr('stroke', 'var(--stroke-color)')
            .style('stroke-width', '10');

          tooltip
            .style('display', 'block')
            .html(`${curData.name}: ${curData.value}`)
            .style('left', `${offsetX}px`)
            .style('top', `${offsetY}px`);
        }
      });
    }
  }

  private createSvg(): void {
    this.svg = this.d3.d3
      .select('div#donut')
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
      .domain(data.map((d: any) => d.name))
      .range(customColors);
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

    var outerArc = this.d3.d3
      .arc()
      .innerRadius(this.radius * 0.9)
      .outerRadius(this.radius * 0.9);

    // const tooltip = this.d3.d3.select('#tooltip');
    // const donutContainer = this.d3.d3.select('#donut');


    this.svg
      .selectAll('allSlices')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d: any, i: number) => this.colors(i.toString()))
      .attr('stroke', 'var(--black-color)')
      .style('stroke-width', '10')
      .style('opacity', 0.7);

    const text = this.svg.append('text')
      .attr('alignment-baseline', 'middle')
      .attr('class', 'chart-label')
      .attr('fill', 'var(--light-color)')
      .attr('text-anchor', 'middle');

    text.append('tspan')
      .attr('x', 0)
      .attr('y', -20)
      .attr('font-size', '17px')
      .attr('font-weight', '400')
      .text('Total balance: 1000$');

    text.append('tspan')
      .attr('x', 0)
      .attr('y', 40)
      .attr('font-size', '14px')
      .attr('fill', 'var(--light-color-100)')
      .style('opacity', 0.7)
      .text('The riskiness of portfolio:');

    text.append('tspan')
      .attr('x', 0)
      .attr('y', 70)
      .attr('font-size', '18px')
      .attr('font-weight', '400')
      .attr('fill', 'var(--decline-color)')
      .text('Aggresive');
  }
}
