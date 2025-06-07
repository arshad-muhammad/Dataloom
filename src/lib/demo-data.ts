interface SalesDataRow {
  id: number;
  date: string;
  product: string;
  category: string;
  quantity: number;
  price: number;
  customer: string;
  region: string;
}

interface SalesInsights {
  totalSales: number;
  averageOrderValue: number;
  salesByRegion: Record<string, number>;
  topProducts: [string, number][];
}

export interface DemoDataset {
  id: string;
  name: string;
  description: string;
  rows: number;
  columns: number;
  data: SalesDataRow[];
}

const SAMPLE_SALES_DATA: DemoDataset = {
  id: 'sales-2024',
  name: 'Sales Data 2024',
  description: 'Sample sales data including revenue, products, and customer information',
  rows: 1000,
  columns: 8,
  data: Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    product: ['Laptop', 'Smartphone', 'Tablet', 'Headphones', 'Monitor'][Math.floor(Math.random() * 5)],
    category: ['Electronics', 'Accessories', 'Peripherals'][Math.floor(Math.random() * 3)],
    quantity: Math.floor(Math.random() * 10) + 1,
    price: Math.floor(Math.random() * 1000) + 100,
    customer: `Customer ${Math.floor(Math.random() * 100) + 1}`,
    region: ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)],
  })),
};

export class DemoDataService {
  private static instance: DemoDataService;
  private currentDataset: DemoDataset | null = null;

  private constructor() {}

  public static getInstance(): DemoDataService {
    if (!DemoDataService.instance) {
      DemoDataService.instance = new DemoDataService();
    }
    return DemoDataService.instance;
  }

  public async loadDemoData(): Promise<DemoDataset> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.currentDataset = SAMPLE_SALES_DATA;
    
    // Store in localStorage for persistence
    localStorage.setItem('demoData', JSON.stringify(this.currentDataset));
    
    return this.currentDataset;
  }

  public getCurrentDataset(): DemoDataset | null {
    if (!this.currentDataset) {
      // Try to load from localStorage
      const stored = localStorage.getItem('demoData');
      if (stored) {
        this.currentDataset = JSON.parse(stored);
      }
    }
    return this.currentDataset;
  }

  public clearDemoData(): void {
    this.currentDataset = null;
    localStorage.removeItem('demoData');
  }

  public async getDemoInsights(): Promise<SalesInsights> {
    const dataset = this.getCurrentDataset();
    if (!dataset) throw new Error('No demo data loaded');

    // Calculate some basic insights
    const totalSales = dataset.data.reduce((sum, row) => sum + (row.price * row.quantity), 0);
    const averageOrderValue = totalSales / dataset.data.length;
    const salesByRegion = dataset.data.reduce((acc, row) => {
      acc[row.region] = (acc[row.region] || 0) + (row.price * row.quantity);
      return acc;
    }, {} as Record<string, number>);
    const topProducts = Object.entries(
      dataset.data.reduce((acc, row) => {
        acc[row.product] = (acc[row.product] || 0) + (row.price * row.quantity);
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]);

    return {
      totalSales,
      averageOrderValue,
      salesByRegion,
      topProducts,
    };
  }
} 