import moment from "moment";

export interface ISpending {
    id?: number
    icon: string;
    title: string;
    cost: number;
    date: Date;
}

export interface ICategorizedSpendings {
    today: ISpending[];
    lastWeek: ISpending[];
    month: ISpending[];
}

export interface ICategorySpending {
  title: string,
  icon: string,
}

export const CATEGORY_SPENDING: ICategorySpending[] = [
  {
    title: 'Car',
    icon: 'assets/expend/car.svg'
  },
  {
    title: 'Clothes',
    icon: 'assets/expend/clothes.svg'
  },
  {
    title: 'Drink',
    icon: 'assets/expend/drink.svg'
  },
  {
    title: 'Food',
    icon: 'assets/expend/food.svg'
  },
  {
    title: 'Gift',
    icon: 'assets/expend/gift.svg'
  },
  {
    title: 'Health',
    icon: 'assets/expend/health.svg'
  },
  {
    title: 'House',
    icon: 'assets/expend/house.svg'
  },
  {
    title: 'Pet',
    icon: 'assets/expend/pet.svg'
  }
];

export const SPENDING_MOCK: ISpending[] = [
    {
      id: 1,
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().toDate(),
    },
    {
      id: 2,
      icon: 'assets/expend/clothes.svg',
      title: 'T-shirt',
      cost: 50,
      date: moment().toDate(),
    },
    {
      id: 3,
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().subtract(6, 'days').toDate(),
    },
    {
      id: 4,
      icon: 'assets/expend/clothes.svg',
      title: 'T-shirt',
      cost: 50,
      date: moment().subtract(5, 'days').toDate(),
    },
    {
      id: 5,
      icon: 'assets/expend/pet.svg',
      title: 'Pet',
      cost: 10,
      date: moment().subtract(1, 'month').toDate(),
    },
  ];
