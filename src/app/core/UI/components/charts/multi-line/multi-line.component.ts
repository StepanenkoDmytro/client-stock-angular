import { AfterContentInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { BehaviorSubject } from 'rxjs';

export interface DataValue { date: Date; price: number; }

export interface DataCompareValue { date: number; price: number; }

export interface IMultiLineCompareData { name: string; values: DataCompareValue[]; }

export interface IMultiLineData { name: string; values: DataValue[]; }

export const EmptyMultiLineData: IMultiLineData[] = [{ name: 'none', values: [] }];

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

  public multiLineID: string = 'multi-line';

  @ViewChild('chartContainer', { static: true }) 
  private chartContainer!: ElementRef;

  private resizechartContainer: ResizeObserver | null = null;
  private _data: BehaviorSubject<IMultiLineData[]> = new BehaviorSubject(EmptyMultiLineData);

  private width = 300;
  private height = 220;
  private margin = 40;

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
    const height = isSingleData ? this.height : this.height + 30;
    const svg = d3.select(`#${this.multiLineID}`).append("svg")
      .attr("width", (this.width + this.margin) + "px")
      .attr("height", (height + this.margin) + "px")
      .append('g')
      .attr("transform", `translate(${this.margin}, ${this.margin})`);
      
    if(data.length === 1) {
      const objectScales: any = this.createScales(data, isSingleData);
    
      this.drawAxes(svg, objectScales, isSingleData);
      this.drawLinesAndCircles(svg, data, objectScales, isSingleData);
    }
    
    if(data.length > 1) {
      const rangeInfo = this.getRangeInfo(data);
      const transformedCompareData: IMultiLineCompareData[] = this.transformToCompareData(data, rangeInfo.firstDay);
      const objectScales: any = this.createScales(data, isSingleData, rangeInfo.maxDays);
      const color = d3.scaleOrdinal(d3.schemeCategory10);
    
      this.drawAxes(svg, objectScales, isSingleData);
      this.drawLinesAndCircles(svg, transformedCompareData, objectScales, isSingleData);
      this.drawColorDescriptionText(svg, transformedCompareData, color, height);
    }
  }

  private drawAxes(svg: any, objectScales: any, isSingleData: boolean): void {
    let xAxis;
    if (isSingleData) {
      const ticks = objectScales.xScale.ticks(d3.timeDay.every(7));
      xAxis = d3.axisBottom(objectScales.xScale)
          .tickValues(ticks) 
          .tickFormat((d: any) => d3.timeFormat("%d")(d as Date));
    } else {
      const [start, end] = objectScales.xScale.domain();
      const tickValues = d3.range(start, end, 7);
      
      xAxis = d3.axisBottom(objectScales.xScale)
        .tickValues(tickValues)
        .tickFormat((d: any) => {
          if(d as number < 10) {
            return '0' + d;
          }
          return d.toString();
        });
    }
    
    const yAxis = d3.axisRight(objectScales.yScale).ticks(5);
    
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${this.height - this.margin - 2.5})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "14px");

    svg.selectAll(".x.axis .tick line")
      .attr("stroke", "#ccc") 
      .attr("stroke-width", 1.5);

    svg.selectAll(".x.axis").select(".domain").remove(); 
    
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .select(".domain") 
      .remove();

    svg.selectAll(".y.axis .tick line") 
      .remove();

    svg.selectAll(".y.axis .tick text")
      .attr("x", this.width - this.margin + 5) 
      .attr("text-anchor", "start")
      .style("font-size", "14px");;

    const yTicks = objectScales.yScale.ticks(5); 
    
    svg.append("g")
      .selectAll("line")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", this.width - this.margin) 
      .attr("y1", (d: any) => objectScales.yScale(d)) 
      .attr("y2", (d: any) => objectScales.yScale(d))
      .attr("stroke", "#ccc") 
      .attr("stroke-width", 1);
  }

  private drawLinesAndCircles(svg: any, data: any[], scales: any, isSingleData: boolean): void {
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const lineGenerator = d3.line<DataValue>()
          .x(d => scales.xScale(d.date))
          .y(d => scales.yScale(d.price));

    const lineCompareDataGenerator = d3.line<DataCompareValue>()
          .x(d => scales.xScale(d.date))
          .y(d => scales.yScale(d.price));
  
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
        .attr("d", (d: any) => {
          if(isSingleData) {
            return lineGenerator(d.values);
          } else {
            return lineCompareDataGenerator(d.values);
          }
        })
        .attr("stroke", (d: any, i: any) => color(i.toString()));
      
      lines.selectAll("circle-group")
        .data(data)
        .enter()
        .append("g")
        .style("fill", (d: any, i: any) => color(i.toString()))
        .selectAll("circle")
        .data((d: any) => d.values)
        .enter()
        .append("circle")
        .attr("cx", (d: any) => scales.xScale(d.date))
        .attr("cy", (d: any) => scales.yScale(d.price))
        .attr("r", 3)
        .style('opacity', 0.85);
  }

  private drawColorDescriptionText(svg: any, data: IMultiLineCompareData[],color: any, height: number) {
    const textPadding = 10; 
    let currentX = this.margin;

    data.forEach((d, i) => {
      const textElement = svg.append("text")
        .attr("x", currentX) 
        .attr("y", height)
        .attr("fill", color(i.toString()))
        .attr("font-size", '14px')
        .text(`-${d.name}`);

      currentX += textElement.node().getBBox().width + textPadding;
    });
  }

  private createScales(data: IMultiLineData[], isSingleData: boolean, maxDays?: number) {
    if (isSingleData) {
      const firstDate = d3.timeMonth.floor(d3.min(data[0].values, d => d.date) as Date);
      const lastDate = d3.timeMonth.offset(firstDate, 1);
      const endDate = d3.timeDay.offset(lastDate, -1);

      return {
          xScale: d3.scaleTime().domain([firstDate, endDate]).range([0, this.width - this.margin]),
          yScale: this.createYScale(data),
      };
    } else {
      return {
        xScale: d3.scaleLinear().domain([1, maxDays + 2]).range([0, this.width - this.margin]),
        yScale: this.createYScale(data),
      };
    }
  }

  private createYScale(data: IMultiLineData[]) {
    const maxPrice = d3.max(data.flatMap(country => country.values), d => d.price) ?? 100;

    const ticks = d3.scaleLinear().domain([0, maxPrice]).ticks();
    const step = ticks[1] - ticks[0];
    const extendedMax = Math.ceil(maxPrice / step) * step + step;

    return d3.scaleLinear()
        .domain([0, extendedMax])
        .range([this.height - this.margin, 0]);
}


  private transformToCompareData(data: IMultiLineData[], firstDay: Date): IMultiLineCompareData[] {
    return data.map(({ name, values }) => {
      const firstDataValue = values[0].date.getTime();
      const updatedValues = values.map(({ date, price }) => {
        const offsetDays = (date.getTime() - firstDay.getTime() - (firstDataValue - firstDay.getTime())) / (1000 * 60 * 60 * 24) + 1;
        return { date: offsetDays, price };
      });
      return { name, values: updatedValues };
    });
  }

  private getRangeInfo(data: IMultiLineData[]) {
    let maxDays = 0;
    let firstDay: Date | null = null;
  
    data.forEach(dataset => {
      const datasetFirstDay = dataset.values[0].date;
      const datasetLastDay = dataset.values[dataset.values.length - 1].date;
      const datasetDays = Math.floor((datasetLastDay.getTime() - datasetFirstDay.getTime()) / (1000 * 60 * 60 * 24));
  
      if (firstDay === null || datasetFirstDay < firstDay) {
        firstDay = datasetFirstDay;
      }
      if (datasetDays > maxDays) {
        maxDays = datasetDays;
      }
    });
  
    return { maxDays, firstDay };
  }
}
