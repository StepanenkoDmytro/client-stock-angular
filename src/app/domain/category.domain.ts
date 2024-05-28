export interface ICategory {
  id: string;
  title: string;
  icon: string;
}

export interface ICategoryApi {
  id: string;
  title: string;
  icon: string;
  parent: string,
  saved: boolean,
}

function generateUniqueId(): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timestampPart = Date.now().toString(36);
  return randomPart + timestampPart;
}

export class Category implements ICategory {

  private static defaultList: Category[] = [
    new Category( 'Income', 'paid', [
      new Category('Salary', 'money')
    ]),
    new Category('Spending', 'payments', [
      new Category('Other', 'payments'),
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
  public parent: string | null = null;
  public children: Category[] = [];

  constructor(
    public title: string = '',
    public icon: string = 'payments',
    children: Category[] = [],
    public isSaved: boolean = false,
    id?: string | null,
    parent?: string | null,
  ) {

    if(id) {
      this.id = id;
    } else {
      this.id = generateUniqueId();
    }
    this.parent = parent;
    this.children = children;
  }

  public get isRoot(): boolean {
    return !this.parent;
  }

  public setParent(parentId: string | null): void {
    this.parent = parentId;
  }

  public findCategory(title: string): Category | undefined {
    if (this.title === title) {
      return this;
    }
    
    for (const child of this.children) {
      const found = child.findCategory(title);
      if (found) {
          return found;
      }
    }
    return undefined;
  }

  public setChildren(children :Category[]): void {
    this.children = children;
  } 

  public static findCategoryInDefaultList(title: string): Category | undefined {
    for (const category of this.defaultList) {
        const found = category.findCategory(title);
        if (found) {
          return found;
        }
    }
    return undefined;
  }

  public static getCategoryDefaultList(): Category[] {
    this.defaultList.forEach(category => {
      // console.log('getCategoryDefaultList' ,category);
      category.children.map(children => children.setParent(category.id));
    });
    
    return this.defaultList;
  }

  public static mapToCategoryApi(category: Category): ICategoryApi {
    return {
      id: category.id,
      title: category.title,
      icon: category.icon,
      parent: category.parent,
      saved: category.isSaved,
    }
}

  public static mapFromCategoryApi(category: any): Category {
    const serverCategory: Category = new Category(
      category.title,
      category.icon,
      [],
      category.saved,
      category.id,
      category.parent
      );

    return serverCategory;
  }
}
