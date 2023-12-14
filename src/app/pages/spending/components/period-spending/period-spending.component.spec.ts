import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PeriodSpendingComponent } from './period-spending.component';

describe('PeriodSpendingComponent', () => {
  let component: PeriodSpendingComponent;
  let fixture: ComponentFixture<PeriodSpendingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodSpendingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PeriodSpendingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
