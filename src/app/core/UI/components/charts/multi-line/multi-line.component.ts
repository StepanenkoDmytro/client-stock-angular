import { AfterContentInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { Subscription } from 'rxjs/internal/Subscription';

export interface DataValue {
  date: Date;
  price: number;
}

export interface IMultiLineData {
  name: string;
  values: DataValue[];
}

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
  public data: IMultiLineData[];
  @ViewChild('chartContainer', { static: true }) 
  private chartContainer!: ElementRef;

  private sub: Subscription | null = null;
  private resizechartContainer: ResizeObserver | null = null;


  width = 300;
  height = 300;
  margin = 50;

  constructor() { }

  public ngOnInit(): void {
    this.createChart();
  }

  public ngAfterContentInit(): void {
      this.resizechartContainer = new ResizeObserver(entries => {
      if (entries[0].target.clientWidth > 200) {
        this.width = entries[0].target.clientWidth - 20;
      }
      this.updateD3();
    });
    
    this.resizechartContainer.observe(this.chartContainer.nativeElement);
  }

  private updateD3(): void {

    d3.select(`#chartTest`).selectChildren('*').remove();
    this.createChart();
  }

  private createChart(): void {

    this.data.forEach(lineData => lineData.values.sort((a,b) => a.date.getTime() - b.date.getTime()));
    
        /* Scale */
    const xScale = d3.scaleTime()
    .domain(d3.extent(this.data[0].values, d => d.date) as [Date, Date])
    .range([0, this.width - this.margin]);

    const yScale = d3.scaleLinear()
    .domain([0, d3.max(this.data.flatMap(country => country.values), d => d.price) as number]) 
    .range([this.height - this.margin, 0]);

    
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    /* Add SVG */
    const svg = d3.select(this.chartContainer.nativeElement).append("svg")
      .attr("width", (this.width + this.margin)+"px")
      .attr("height", (this.height + this.margin)+"px")
      .append('g')
      .attr("transform", `translate(${this.margin}, ${this.margin})`);
    
    
    /* Add line into SVG */
    const line = d3.line<DataValue>()
      .x(d => xScale(d.date)!)
      .y(d => yScale(d.price)!);
    
    const lines = svg.append('g');


    lines.append("g")
      .attr("fill", "none")
      .attr("stroke-width", 1)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .selectAll("path")
      .data(this.data)
      .join("path")
      .style("mix-blend-mode", "multiply")
      .attr("d", d => line(d.values))
      .attr("stroke", (d, i) => color(i.toString()));

    
    
    /* Add circles in the line */
    lines.selectAll("circle-group")
      .data(this.data)
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


    /* Add Axis into SVG */
    const xAxis = d3.axisBottom(xScale).ticks(5);
    const yAxis = d3.axisLeft(yScale).ticks(5);
    
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${this.height - this.margin})`)
      .call(xAxis);
    
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      // .append('text')
      // .attr("y", 15)
      // .attr("transform", "rotate(-90)")
      // .attr("fill", "#000")
      // .text("Total values")
      ;
  }
}
