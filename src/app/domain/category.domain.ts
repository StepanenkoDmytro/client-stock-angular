

export interface ICategory {
  id: string;
  title: string;
  icon: string;
  description?: string;
}

function generateUniqueId(): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timestampPart = Date.now().toString(36);
  return randomPart + timestampPart;
}

export class Category implements ICategory {

  public static defaultList: Category[] = [
    new Category( 'Income', 'paid', '', [
      new Category('Salary', 'money')
    ]),
    new Category('Spending', 'payments', '', [
      new Category('Other', 'category', '', [
        new Category('Test')
      ]),
      new Category('Clothes', 'custom_clothes'),
      new Category('Drink', 'custom_drink'),
      new Category('Gift', 'custom_gift'),
      new Category('Car', 'custom_car'),
      new Category('Health', 'custom_health'),
      new Category('Food', 'custom_food'),
      new Category('House', 'custom_house'),
      new Category('Pet', 'custom_pet'),
    ]),
  ];
  public static default: Category = Category.defaultList[1];

  public readonly id: string;
  private parent: Category | null = null;

  constructor(
    public title: string = '',
    public icon: string = '',
    public description: string = '',
    public children: Category[] = [],
  ) {
    this.id = generateUniqueId();
  }

  public get isRoot(): boolean {
    return !this.parent;
  }
}
