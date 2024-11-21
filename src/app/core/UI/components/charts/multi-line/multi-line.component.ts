import { AfterContentInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { BehaviorSubject } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';

export interface DataValue {
  date: Date;
  price: number;
}

export interface DataCompareValue {
  date: number;
  price: number;
}

export interface IMultiLineCompareData {
  name: string;
  values: DataCompareValue[];
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
    console.log(value);
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

  constructor() { }

  public ngOnInit(): void {
    const randomNum = Math.floor(Math.random() * 100);

    this.multiLineID = `${this.multiLineID}${randomNum}`;

    this._data.subscribe(data => {
      if(data && data.length > 0) {
        this.createChart();
      }
    })
  }

  public ngAfterContentInit(): void {
    this.resizechartContainer = new ResizeObserver(entries => {
      if (entries[0].target.clientWidth > 200) {
        this.width = entries[0].target.clientWidth - 30;
      }
      this.createChart();
    });
    
    this.resizechartContainer.observe(this.chartContainer.nativeElement);
  }

  private createChart(): void {
    d3.select(`#${this.multiLineID}`).selectAll("svg").remove();
    const data = this._data.value;
    
    if (!data || data.length === 0) {
      console.warn('Data is undefined or empty.');
      return;
    }

    data.forEach(country => {
      country.values.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    const isSingleData = data.length === 1;
    const svg = d3.select(`#${this.multiLineID}`).append("svg")
      .attr("width", (this.width + this.margin) + "px")
      .attr("height", (this.height + this.margin) + "px")
      .append('g')
      .attr("transform", `translate(${this.margin}, ${this.margin})`);
      
    if(data.length > 1) {
      let maxDays = 0;
      let firstDayOfRange: Date | null = null;
      let lastDayOfRange: Date | null = null;

      data.forEach((el: IMultiLineData) => {
        const min: Date = new Date(el.values[0].date);
        const max: Date = new Date(el.values[el.values.length - 1].date);
      
        const diffInMs = max.getTime() - min.getTime();
        const dayDiff = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
        if (dayDiff > maxDays) {
          maxDays = dayDiff;
          firstDayOfRange = min;
          lastDayOfRange = max;
        }
      });

      const result: IMultiLineCompareData[] = [];

      data.forEach((dataValue: IMultiLineData) => {
        const firstDataDataValue = dataValue.values[0].date; 
        let updatedValues;
        if(firstDataDataValue.getTime() === firstDayOfRange.getTime()) {
          updatedValues = dataValue.values.map(value => {
            const result = (value.date.getTime() - firstDayOfRange.getTime())/(1000 * 60 * 60 * 24) + 1;
            return {date: result, price: value.price};
          });
        } else {
          const diffByDatas = firstDataDataValue.getTime() - firstDayOfRange.getTime();
          updatedValues = dataValue.values.map(value => {
            const dateResult = (new Date(value.date).getTime() - firstDayOfRange.getTime() - diffByDatas) / (1000 * 60 * 60 * 24) + 1;
            console.log(dateResult);
            return { date: dateResult, price: value.price };
          });
        }
        result.push({name: dataValue.name, values: updatedValues});
      });

      const objectScales: any = this.createScales(data, isSingleData);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      const line: d3.Line<DataCompareValue> = d3.line<DataCompareValue>()
        .x(d => objectScales.xScale(d.date))
        .y(d => objectScales.yScale(d.price)!);
    
      /* Add Axis into SVG */
      const xAxis = d3.axisBottom(objectScales.xScale).ticks(5);
      const yAxis = d3.axisLeft(objectScales.yScale).ticks(5);
      
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
        .data(result)
        .join("path")
        .style("mix-blend-mode", "multiply")
        .attr("d", d => line(d.values))
        .attr("stroke", (d, i) => color(i.toString()));
      
      /* Add circles in the line */
      lines.selectAll("circle-group")
        .data(result)
        .enter()
        .append("g")
        .style("fill", (d, i) => color(i.toString()))
        .selectAll("circle")
        .data(d => d.values)
        .enter()
        .append("circle")
        .attr("cx", d => objectScales.xScale(d.date))
        .attr("cy", d => objectScales.yScale(d.price))
        .attr("r", 3)
        .style('opacity', 0.85);

      const textPadding = 10; 
      let currentX = this.margin;

      data.forEach((d, i) => {
        const textElement = svg.append("text")
          .attr("x", currentX) 
          .attr("y", this.height)
          .attr("fill", color(i.toString()))
          .attr("font-size", '12px')
          .text(`-${d.name}`);

        currentX += textElement.node().getBBox().width + textPadding;
      });
    }

    if(data.length === 1) {
      const objectScales: any = this.createScales(data, isSingleData);
        
      const line: d3.Line<DataValue> = d3.line<DataValue>()
        .x(d => objectScales.xScale(d.date)!)
        .y(d => objectScales.yScale(d.price)!);

      const color = d3.scaleOrdinal(d3.schemeCategory10);
    
      const yTicks = objectScales.yScale.ticks(5); 
      svg.append("g")
        .selectAll("line")
        .data(yTicks)
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", this.width - this.margin) 
        .attr("y1", d => objectScales.yScale(d)) 
        .attr("y2", d => objectScales.yScale(d))
        .attr("stroke", "#ccc") 
        .attr("stroke-width", 1);
    
    /* Add Axis into SVG */
      const xAxis = d3.axisBottom(objectScales.xScale).ticks(5);
      const yAxis = d3.axisRight(objectScales.yScale).ticks(5);
      
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0, ${this.height - this.margin})`)
        .call(xAxis);
      
      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .select(".domain") 
        .remove();

      svg.selectAll(".y.axis .tick line") 
        .remove();

      svg.selectAll(".y.axis .tick text")
        .attr("x", this.width - this.margin) 
        .attr("text-anchor", "start");
    
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
    
      lines.selectAll("circle-group")
        .data(data)
        .enter()
        .append("g")
        .style("fill", (d, i) => color(i.toString()))
        .selectAll("circle")
        .data(d => d.values)
        .enter()
        .append("circle")
        .attr("cx", d => objectScales.xScale(d.date.getTime()))
        .attr("cy", d => objectScales.yScale(d.price))
        .attr("r", 3)
        .style('opacity', 0.85);
    }
  }

  private createYScale(data: IMultiLineData[]) {
    return d3.scaleLinear()
          .domain([0, d3.max(data.flatMap(country => country.values), d => d.price) ?? 100])
          .range([this.height - this.margin, 0]);
  }

  private createScales(data: IMultiLineData[], isSingleData: boolean) {
    if (isSingleData) {
      
      const extent = d3.extent(data[0].values, d => d.date) as [Date, Date];
      return {
        xScale: d3.scaleTime().domain(extent).range([0, this.width - this.margin]),
        yScale: this.createYScale(data)
      };
    } else {
      const { maxDays, firstDay } = this.getRangeInfo(data);
      return {
        xScale: d3.scaleLinear().domain([1, maxDays + 2]).range([0, this.width - this.margin]),
        yScale: this.createYScale(data)
      };
    }
  }


  private getRangeInfo(data: IMultiLineData[]) {
    let maxDays = 0;
    let firstDay: Date | null = null;

    data.forEach(el => {
      const min = el.values[0].date;
      const max = el.values[el.values.length - 1].date;
      const dayDiff = Math.floor((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff > maxDays) {
        maxDays = dayDiff;
        firstDay = min;
      }
    });

    return { maxDays, firstDay };
  }
}
