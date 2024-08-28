import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { BehaviorSubject } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';

export interface DataValue {
  date: Date;
  price: number;
}

export interface IMultiLineData {
  name: string;
  values: DataValue[];
}

export const EmptyMultiLineData: IMultiLineData[] = [{
  name: 'none',
  values: []
}];

@Component({
  selector: 'pgz-multi-line',
  standalone: true,
  imports: [],
  templateUrl: './multi-line.component.html',
  styleUrl: './multi-line.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiLineComponent implements OnInit, AfterContentInit {
  @Input()
  public set data(value: IMultiLineData[]) {
    if(value && value[0]) {
      this._data.next(value);
    }
    
  }

  @ViewChild('chartContainer', { static: true }) 
  private chartContainer!: ElementRef;

  private sub: Subscription | null = null;
  private resizechartContainer: ResizeObserver | null = null;
  private _data: BehaviorSubject<IMultiLineData[]> = new BehaviorSubject(EmptyMultiLineData);

  public multiLineID: string = 'multi-line';

  width = 300;
  height = 300;
  margin = 50;

  constructor(
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    const randomNum = Math.floor(Math.random() * 100);

    this.multiLineID = `${this.multiLineID}${randomNum}`;

    this._data.subscribe(data => {
      if(data && data.length > 0) {
        this.updateD3();
      }
    })
  }

  public ngAfterContentInit(): void {
      this.resizechartContainer = new ResizeObserver(entries => {
      if (entries[0].target.clientWidth > 200) {
        this.width = entries[0].target.clientWidth - 30;
      }
      this.updateD3();
    });
    
    this.resizechartContainer.observe(this.chartContainer.nativeElement);
  }

  private updateD3(): void {
    d3.select(`#${this.multiLineID}`).select("svg").remove();
    this.createChart();
  }

  // private createChart(): void {
  //   const data = this._data.value;

  //   if (!data || data.length === 0) {
  //       console.warn('Data is undefined or empty.');
  //       return;
  //   }

  //   const firstDataValues = data[0].values ? data[0].values : [{date: new Date(), price: 0}];

  //   const xScale = d3.scaleTime()
  //     .domain(d3.extent(firstDataValues, d => d.date) as [Date, Date])
  //     .range([0, this.width - this.margin]);

  //   const yScale = d3.scaleLinear()
  //     .domain([0, d3.max(data.flatMap(country => country.values), d => d.price) ?? 100])
  //     .range([this.height - this.margin, 0]);

  //   const color = d3.scaleOrdinal(d3.schemeCategory10);
    
  //   /* Add SVG */
  //   const svg = d3.select(`#${this.multiLineID}`).append("svg")
  //     .attr("width", (this.width + this.margin)+"px")
  //     .attr("height", (this.height + this.margin)+"px")
  //     .append('g')
  //     .attr("transform", `translate(${this.margin}, ${this.margin})`);
    
    
  //   /* Add line into SVG */
  //   const line = d3.line<DataValue>()
  //     .x(d => xScale(d.date)!)
  //     .y(d => yScale(d.price)!);
    
  //   const lines = svg.append('g');


  //   lines.append("g")
  //     .attr("fill", "none")
  //     .attr("stroke-width", 1)
  //     .attr("stroke-linejoin", "round")
  //     .attr("stroke-linecap", "round")
  //     .selectAll("path")
  //     .data(data)
  //     .join("path")
  //     .style("mix-blend-mode", "multiply")
  //     .attr("d", d => line(d.values))
  //     .attr("stroke", (d, i) => color(i.toString()));

    
    
  //   /* Add circles in the line */
  //   lines.selectAll("circle-group")
  //     .data(data)
  //     .enter()
  //     .append("g")
  //     .style("fill", (d, i) => color(i.toString()))
  //     .selectAll("circle")
  //     .data(d => d.values)
  //     .enter()
  //     .append("circle")
  //     .attr("cx", d => xScale(d.date))
  //     .attr("cy", d => yScale(d.price))
  //     .attr("r", 3)
  //     .style('opacity', 0.85);


  //   /* Add Axis into SVG */
  //   const xAxis = d3.axisBottom(xScale).ticks(5);
  //   const yAxis = d3.axisLeft(yScale).ticks(5);
    
  //   svg.append("g")
  //     .attr("class", "x axis")
  //     .attr("transform", `translate(0, ${this.height - this.margin})`)
  //     .call(xAxis);
    
  //   svg.append("g")
  //     .attr("class", "y axis")
  //     .call(yAxis)
  //     // .append('text')
  //     // .attr("y", 15)
  //     // .attr("transform", "rotate(-90)")
  //     // .attr("fill", "#000")
  //     // .text("Total values")
  //     ;
  // }
  private createChart(): void {
    const data = this._data.value;

    if (!data || data.length === 0) {
        console.warn('Data is undefined or empty.');
        return;
    }

    data.forEach(country => {
      country.values.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    let xScale: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>;
    let line: d3.Line<DataValue>;

    if(data.length > 1) {
      const maxDays = d3.max(data.flatMap(country => country.values), d => new Date(d.date).getDate()) ?? 30;

      xScale = d3.scaleLinear()
        .domain([1, maxDays]) // Дні місяця
        .range([0, this.width - this.margin]);

      line = d3.line<DataValue>()
        .x(d => xScale(d.date.getDate())!)
        .y(d => yScale(d.price)!);
    }

    if(data.length === 1) {
      const firstDataValues = data[0].values ? data[0].values : [{date: new Date(), price: 0}];

      xScale = d3.scaleTime()
        .domain(d3.extent(firstDataValues, d => new Date(d.date)) as [Date, Date])
        .range([0, this.width - this.margin]);

      line = d3.line<DataValue>()
        .x(d => xScale(d.date)!)
        .y(d => yScale(d.price)!);
    }

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data.flatMap(country => country.values), d => d.price) ?? 100])
      .range([this.height - this.margin, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    /* Add SVG */
    const svg = d3.select(`#${this.multiLineID}`).append("svg")
      .attr("width", (this.width + this.margin) + "px")
      .attr("height", (this.height + this.margin) + "px")
      .append('g')
      .attr("transform", `translate(${this.margin}, ${this.margin})`);
    
    /* Add Axis into SVG */
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);
    
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${this.height - this.margin})`)
      .call(xAxis);
    
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);
    
    /* Add line into SVG */
    

    const lines = svg.append('g');

    lines.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .selectAll("path")
      .data(data)
      .join("path")
      .style("mix-blend-mode", "multiply")
      .attr("d", d => line(d.values))
      .attr("stroke", (d, i) => color(i.toString()));
    
    /* Add circles in the line */
    lines.selectAll("circle-group")
      .data(data)
      .enter()
      .append("g")
      .style("fill", (d, i) => color(i.toString()))
      .selectAll("circle")
      .data(d => d.values)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.price))
      .attr("r", 3)
      .style('opacity', 0.85);
  }

}
