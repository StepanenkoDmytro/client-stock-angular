import { Component, ElementRef, HostListener, NgZone, OnDestroy, Renderer2 } from '@angular/core';
import { distinctUntilChanged, map, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-resizable',
  templateUrl: './resizable.component.html',
  styleUrls: ['./resizable.component.scss'],
})
export class ResizableComponent implements OnDestroy {

  // @HostListener('mouseup')
  // private handleMouseUp(): void {
  //   this.mouseUp$.next(true);
  // }

  // @HostListener('mousemove', ['$event'])
  // private handleMouseMove(event: MouseEvent): void {
  //   console.log(event)
  //   this.mouseMove$.next(event);
  // }

  private mouseUp$: Subject<boolean> = new Subject<boolean>();
  private mouseMove$: Subject<MouseEvent> = new Subject<MouseEvent>();

  // private abortSignal: AbortSignal;

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private zone: NgZone,
  ) {
    addEventListener('mouseup', () => {
      this.mouseUp$.next(true);
    }, { /*signal: this.abortSignal */ });

    addEventListener('mousemove', (event: MouseEvent) => {
      this.mouseMove$.next(event);
    }, { /*signal: this.abortSignal */ });
  }

  handleVerticalResize(event: MouseEvent, isTop: boolean = false) {
    event.preventDefault();
    event.stopPropagation();
    const initialYPosition: number = event.y;

    this.mouseMove$.pipe(
      takeUntil(this.mouseUp$),
      map((e) => e.y),
      distinctUntilChanged()
    ).subscribe((y: number) => {

      this.zone.runOutsideAngular(() => {
        const shift = isTop ? initialYPosition - y : y - initialYPosition;
        this.elementRef.nativeElement.height = this.elementRef.nativeElement.offsetHeight + shift;
        const height = this.elementRef.nativeElement.offsetHeight + shift;
        this.renderer.setStyle(this.elementRef.nativeElement, 'height', `${height}px`);
      })
    })
  }

  public ngOnDestroy(): void {
    // this.abortSignal.dispatchEvent();
    this.mouseUp$.next(true);
    this.mouseUp$.complete();
  }
}
