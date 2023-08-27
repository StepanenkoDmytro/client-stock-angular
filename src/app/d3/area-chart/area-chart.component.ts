import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ScaleLinear, ScaleTime } from 'd3';
import { BehaviorSubject, Observable, Subscription, fromEvent, map, switchMap, tap } from 'rxjs';
import { D3Service } from 'src/app/service/d3.service';

export interface DataModel {
  date: Date,
  value: number
}

@Component({
  selector: 'app-area-chart',
  templateUrl: './area-chart.component.html',
  styleUrls: ['./area-chart.component.scss']
})
export class AreaChartComponent implements OnInit, OnDestroy {

  @Input('data') private data: DataModel[] = [
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-04-28')!, value: 135.98 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-04-29')!, value: 147.49 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-04-30')!, value: 146.93 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-01')!, value: 139.89 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-02')!, value: 125.6 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-03')!, value: 108.13 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-04')!, value: 115 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-05')!, value: 118.8 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-06')!, value: 124.66 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-07')!, value: 113.44 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-08')!, value: 115.78 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-09')!, value: 113.46 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-10')!, value: 122 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-11')!, value: 118.68 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-12')!, value: 117.45 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-13')!, value: 118.7 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-14')!, value: 119.8 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-15')!, value: 115.81 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-16')!, value: 118.76 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-17')!, value: 125.3 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-18')!, value: 125.25 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-19')!, value: 124.5 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-20')!, value: 123.62 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-21')!, value: 123 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-22')!, value: 124 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-23')!, value: 126.93 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-24')!, value: 133.85 },
    { date: this.d3.d3.timeParse('%Y-%m-%d')('2013-05-25')!, value: 133.22 }
  ];

  private margin = { top: 10, right: 30, bottom: 30, left: 50 };
  private width = 460 - this.margin.left - this.margin.right;
  private height = 400 - this.margin.top - this.margin.bottom;
  private svg: any;
  private moveMouse$: any;
  private areaContainer: any;
  private verticalLineVisible = false;

  constructor(
    private d3: D3Service
  ) { }

  ngOnInit(): void {
    this.createSvg();
    this.loadData(this.data);
  }

  ngOnDestroy(): void {
    if (this.moveMouse$) {
      this.moveMouse$.unsubscribe;
      // console.log(this.moveMouse$);
    }
  }

  private createSvg(): void {
    this.svg = this.d3.d3.select("#my_dataviz")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
  }

  private loadData(data: DataModel[]): void {
    this.setupAxes(data);
    this.setupCircles(data);
    this.setupPathAndLine(data);

    const verticalLine = this.setupVerticalLine(data);

    const svgContainerElement = this.areaContainer.node();

    if (svgContainerElement instanceof Element) {

      const react = svgContainerElement.getBoundingClientRect();
      this.moveMouse$ = fromEvent<MouseEvent>(svgContainerElement, "mousemove")
        .pipe(
          map(e => (
            e.clientX - react.left 
          ))
        );
        
      this.moveMouse$.subscribe((pos: any) => {
        
        verticalLine
          .attr("stroke-width", 1)
          .attr("x1", pos)
          .attr("x2", pos);

        this.updateCircles(data, pos);
      });
    }
  }

  private setupAxes(data: DataModel[]): void {
    const x = this.setupXScale(data);
    const y = this.setupYScale(data);

    this.svg.append("g")
      .attr("transform", "translate(0," + (this.height + 5) + ")")
      .call(this.d3.d3.axisBottom(x).ticks(5).tickSizeOuter(0));

    this.svg.append("g")
      .attr("transform", "translate(-5,0)")
      .call(this.d3.d3.axisLeft(y).tickSizeOuter(0));
  }

  private setupCircles(data: DataModel[]): void {
    const x = this.setupXScale(data);
    const y = this.setupYScale(data);

    this.svg.selectAll("myCircles")
      .data(data)
      .enter()
      .append("circle")
      .attr("fill", "#69b3a2")
      .attr("cx", (d: DataModel) => x(d.date))
      .attr("cy", (d: DataModel) => y(d.value))
      .attr("r", 3);
  }

  private setupPathAndLine(data: DataModel[]): void {
    const x = this.setupXScale(data);
    const y = this.setupYScale(data);

    const area = this.d3.d3.area<DataModel>()
      .x((d: DataModel) => x(d.date))
      .y0(this.height)
      .y1((d: DataModel) => y(d.value));

    this.areaContainer = this.svg.append("path")
      .datum(data)
      .attr("fill", "#69b3a2")
      .attr("fill-opacity", .3)
      .attr("stroke", "none")
      .attr("d", area);

    const line = this.d3.d3.line<DataModel>()
      .x((d: DataModel) => x(d.date))
      .y((d: DataModel) => y(d.value));

    this.svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 2)
      .attr("d", line);
  }

  private setupVerticalLine(data: DataModel[]): any {
    return this.svg.append("line")
      .attr("class", "vertical-line")
      .attr("stroke", "blue")
      .attr("stroke-width", 0)
      .attr("y1", 0)
      .attr("y2", this.height);
  }

  private updateCircles(data: DataModel[], offsetX: number) {
    const x = this.setupXScale(data);
    const range = 5;
    this.svg.selectAll("circle")
      .attr("fill", (d: DataModel) => Math.abs(x(d.date) - offsetX) < range ? "blue" : "#69b3a2")
      .attr("stroke", (d: DataModel) => Math.abs(x(d.date) - offsetX) < range ? "white" : "none")
      .attr("stroke-width", (d: DataModel) => Math.abs(x(d.date) - offsetX) < range ? 6 : 0)
      .attr("stroke-opacity", (d: DataModel) => Math.abs(x(d.date) - offsetX) < range ? 0.3 : 0)
      .attr("r", (d: DataModel) => Math.abs(x(d.date) - offsetX) < range ? 6 : 3);
  };

  private setupXScale(data: DataModel[]): ScaleTime<number, number> {
    return this.d3.d3.scaleTime()
      .domain(this.d3.d3.extent(data, (d: DataModel) => d.date) as [Date, Date])
      .range([0, this.width]);
  }

  private setupYScale(data: DataModel[]): ScaleLinear<number, number> {
    return this.d3.d3.scaleLinear()
      .domain(this.d3.d3.extent(data, (d: DataModel) => d.value) as [number, number])
      .range([this.height, 0]);
  }
}
