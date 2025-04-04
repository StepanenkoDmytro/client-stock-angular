import { colorPalette } from "./d3.domain";

export interface ICategory {
  id: string;
  title: string;
  icon: string;
}

export interface ICategoryApi {
  id: string;
  title: string;
  icon: string;
  color: string;
  limit: number;
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
    new Category('Spending', 'icon_hugeicons_briefcase-dolla', [
      new Category('Other', 'icon_group'),
      new Category('Clothes', 'icon_t-shirt'),
      new Category('Drink', 'icon_hugeicons_drink'),
      new Category('Gift', 'icon_hugeicons_gift'),
      new Category('Car', 'icon_hugeicons_car'),
      new Category('Health', 'icon_hand-heart'),
      new Category('Food', 'icon_hugeicons_hamburger2'),
      new Category('House', 'icon_hugeicons_house4'),
      new Category('Pet', 'icon_trace'),
    ]),
  ];
  public static default: Category = Category.defaultList[1];

  public readonly id: string;
  public parent: string | null = null;
  public children: Category[] = [];
  public color: string | null = null;
  public limit: number = 0;

  constructor(
    public title: string = '',
    public icon: string = 'icon_group',
    children: Category[] = [],
    public isSaved: boolean = false,
    id?: string | null,
    parent?: string | null,
    color?: string | null,
    limit?: number | null
  ) {

    if(id) {
      this.id = id;
    } else {
      this.id = generateUniqueId();
    }
    this.parent = parent;
    this.children = children;
    this.setColor(color);
    this.setLimit(limit);
  }

  public get isRoot(): boolean {
    return !this.parent;
  }

  public setParent(parentId: string | null): void {
    this.parent = parentId;
  }

  public setLimit(limit: number | null): void {
    if(limit) {
      this.limit = limit;
    }
  }

  public setColor(colorId: string | null): void {
    if(!colorId) {
      return;
    }
    
    this.color = colorId;
  }

  private static isColorOccupied(colorId: string, category: Category[]): boolean {
    const siblingColors = category.map(child => child.color).filter(c => c);
    
    return siblingColors.includes(colorId);
  }

  public setChildren(children :Category[]): void {
    this.children = children;
  } 

  public static getCategoryDefaultList(): Category[] {
    this.defaultList.forEach(category => {
      category.children.map((children) => {
        children.setParent(category.id);

        const availableColors = colorPalette.filter(color => !this.isColorOccupied(color, category.children));
        const randomIndex = Math.floor(Math.random() * colorPalette.length);
        children.setColor(availableColors.length > 0 ? availableColors[randomIndex % availableColors.length] : null);
      });
    });
    
    return this.defaultList;
  }

  public static mapToCategoryApi(category: Category): ICategoryApi {
    return {
      id: category.id,
      title: category.title,
      icon: category.icon,
      color: category.color,
      limit: category.limit,
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
      category.parent,
      category.color,
      category.limit
    );

    return serverCategory;
  }

  public static findCategoryById(id: string, categories: Category[]): Category | undefined {
    for (const category of categories) {
        if (category.id === id) {
            return category;
        }
        const foundInChildren = Category.findCategoryById(id, category.children);
        if (foundInChildren) {
            return foundInChildren;
        }
    }
    return undefined;
  }
}
