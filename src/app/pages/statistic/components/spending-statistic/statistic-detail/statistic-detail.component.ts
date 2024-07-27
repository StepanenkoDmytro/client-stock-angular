import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'pgz-statistic-detail',
  standalone: true,
  imports: [],
  templateUrl: './statistic-detail.component.html',
  styleUrl: './statistic-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticDetailComponent implements OnInit {
  categoryId: string;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    console.log(this.categoryId, this.route.snapshot);
  }
}
