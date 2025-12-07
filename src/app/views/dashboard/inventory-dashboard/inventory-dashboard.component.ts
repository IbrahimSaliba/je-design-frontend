import { Component, OnInit, OnDestroy } from "@angular/core";
import { egretAnimations } from "app/shared/animations/egret-animations";
import { getRgbColorFromCssVariable } from "app/shared/helpers/utils";
import { ThemeService } from "app/shared/services/theme.service";
import { CrudService } from "../../cruds/crud.service";
import { Subscription } from "rxjs";

@Component({
    selector: "app-inventory-dashboard",
    templateUrl: "./inventory-dashboard.component.html",
    styleUrls: ["./inventory-dashboard.component.scss"],
    animations: egretAnimations,
    standalone: false
})
export class InventoryDashboardComponent implements OnInit, OnDestroy {
  totalItems: number = 0;
  lowStockItems: number = 0;
  outOfStockItems: number = 0;
  totalValue: number = 0;
  totalContainers: number = 0;
  activeSuppliers: number = 0;
  totalClients: number = 0;
  movementsThisMonth: number = 0;
  stockInThisMonth: number = 0;
  stockOutThisMonth: number = 0;

  stockLevelsChart: any = {};
  topProductsChart: any = {};
  stockMovementChart: any = {};

  lowStockItemsList: any[] = [];
  recentTransactions: any[] = [];
  topItemsByValue: any[] = [];

  private themeSubscription?: Subscription;
  private currentTheme: any;
  private itemList: any[] = [];

  constructor(
    private themeService: ThemeService,
    private crudService: CrudService
  ) {}

  ngOnInit(): void {
    this.themeSubscription = this.themeService.activeTheme$().subscribe(theme => {
      this.currentTheme = theme;
      this.updateCharts();
    });

    this.loadInventoryData();
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  private loadInventoryData(): void {
    this.crudService.getItems('items').subscribe(items => {
      const list = Array.isArray(items) ? items : [];
      this.itemList = list;
      this.totalItems = list.length;
      this.lowStockItems = list.filter(item => this.normalizeStatus(item.status) === 'LOW_STOCK').length;
      this.outOfStockItems = list.filter(item => this.normalizeStatus(item.status) === 'OUT_OF_STOCK' || this.toNumber(item.totalQuantity || item.total_quantity) <= 0).length;
      this.totalValue = list.reduce((sum, item) => {
        const price = this.toNumber(item.finalPrice || item.final_price);
        const quantity = this.toNumber(item.totalQuantity || item.total_quantity);
        return sum + price * quantity;
      }, 0);
      this.updateCharts();
    });

    this.crudService.getInventoryStatistics().subscribe(stats => {
      if (!stats) {
        this.updateCharts();
        return;
      }

      if (stats.totalStockValue !== undefined && stats.totalStockValue !== null) {
        this.totalValue = this.toNumber(stats.totalStockValue);
      }

      if (typeof stats.lowStockItems === 'number') {
        this.lowStockItems = stats.lowStockItems;
      }

      this.stockInThisMonth = this.toNumber(stats.stockInThisMonth);
      this.stockOutThisMonth = this.toNumber(stats.stockOutThisMonth);
      const combinedMovements = this.stockInThisMonth + this.stockOutThisMonth;
      const backendMovements = this.toNumber(stats.movementsThisMonth);
      this.movementsThisMonth = combinedMovements > 0 ? combinedMovements : backendMovements;
      this.topItemsByValue = Array.isArray(stats.topItemsByValue) ? stats.topItemsByValue : [];

      this.updateCharts();
    });

    this.crudService.getAllContainers().subscribe(containers => {
      this.totalContainers = Array.isArray(containers) ? containers.length : 0;
    });

    this.crudService.getAllSuppliers().subscribe(suppliers => {
      this.activeSuppliers = Array.isArray(suppliers) ? suppliers.length : 0;
    });

    this.crudService.getAllClients().subscribe(clients => {
      this.totalClients = Array.isArray(clients) ? clients.length : 0;
    });

    this.crudService.getLowStockReport().subscribe(report => {
      const list = Array.isArray(report) ? report : [];
      this.lowStockItemsList = list
        .map(item => ({
          name: item.itemName || item.itemCode,
          code: item.itemCode,
          currentStock: this.toNumber(item.currentStock),
          reorderPoint: this.toNumber(item.minStock),
          status: this.normalizeStatus(item.status)
        }))
        .slice(0, 5);
    });

    this.crudService.getInventoryMovements().subscribe(movements => {
      const list = Array.isArray(movements) ? movements : [];
      const sorted = list.sort((a, b) => {
        const dateA = new Date(a.movementDate || a.movement_date || 0).getTime();
        const dateB = new Date(b.movementDate || b.movement_date || 0).getTime();
        return dateB - dateA;
      });

      this.recentTransactions = sorted.slice(0, 5).map(movement => {
        const type = this.normalizeMovementType(movement.type);
        return {
          id: movement.id,
          type,
          typeLabel: type === 'IN' ? 'Stock In' : type === 'OUT' ? 'Stock Out' : 'Adjustment',
          item: movement.itemName || movement.item_name,
          quantity: this.toNumber(movement.quantity),
          date: this.formatDate(movement.movementDate || movement.movement_date)
        };
      });

      if (this.stockInThisMonth === 0 && this.stockOutThisMonth === 0) {
        this.recalculateMonthlyTotalsFromMovements(sorted);
      }
    });
  }

  private recalculateMonthlyTotalsFromMovements(movements: any[]): void {
    if (!Array.isArray(movements) || movements.length === 0) {
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let inTotal = 0;
    let outTotal = 0;

    movements.forEach(movement => {
      const movementDate = new Date(movement.movementDate || movement.movement_date || 0);
      if (movementDate >= startOfMonth) {
        const quantity = this.toNumber(movement.quantity);
        const type = this.normalizeMovementType(movement.type);
        if (type === 'IN') {
          inTotal += quantity;
        } else if (type === 'OUT') {
          outTotal += quantity;
        }
      }
    });

    if (inTotal > 0 || outTotal > 0) {
      this.stockInThisMonth = inTotal;
      this.stockOutThisMonth = outTotal;
      this.movementsThisMonth = inTotal + outTotal;
      this.updateCharts();
    }
  }

  private updateCharts(): void {
    if (!this.currentTheme) {
      return;
    }

    this.initStockLevelsChart(this.currentTheme);
    this.initTopProductsChart(this.currentTheme);
    this.initStockMovementChart(this.currentTheme);
  }

  initStockLevelsChart(theme: any) {
    this.stockLevelsChart = {
      tooltip: {
        show: true,
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
        backgroundColor: getRgbColorFromCssVariable('bg-card'),
        borderColor: getRgbColorFromCssVariable('fg-divider'),
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: {
          color: getRgbColorFromCssVariable('fg-hint')
        }
      },
      series: [
        {
          name: "Stock Levels",
          type: "pie",
          radius: ["40%", "70%"],
          center: ["60%", "50%"],
          avoidLabelOverlap: false,
          hoverOffset: 5,
          label: {
            show: true,
            position: "outside",
            formatter: "{b}: {c}",
            color: getRgbColorFromCssVariable('fg-hint')
          },
          labelLine: {
            show: true
          },
          data: [
            { value: Math.max(this.totalItems - this.lowStockItems - this.outOfStockItems, 0), name: "In Stock", itemStyle: { color: '#4CAF50' } },
            { value: this.lowStockItems, name: "Low Stock", itemStyle: { color: '#FF9800' } },
            { value: this.outOfStockItems, name: "Out of Stock", itemStyle: { color: '#F44336' } }
          ]
        }
      ]
    };
  }

  initTopProductsChart(theme: any) {
    const categories = this.topItemsByValue.map(item => item.itemName || item.itemCode);
    const seriesData = this.topItemsByValue.map(item => this.toNumber(item.stockValue));

    this.topProductsChart = {
      tooltip: {
        show: true,
        backgroundColor: getRgbColorFromCssVariable('bg-card'),
        borderColor: getRgbColorFromCssVariable('fg-divider'),
      },
      grid: {
        left: "8px",
        right: "8px",
        bottom: "0",
        top: "0",
        containLabel: true
      },
      xAxis: [
        {
          type: "category",
          data: categories,
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLine: {
            show: false
          },
          axisLabel: {
            color: getRgbColorFromCssVariable('fg-hint'),
            rotate: 45
          }
        }
      ],
      yAxis: [
        {
          type: "value",
          axisLabel: {
            show: true,
            color: getRgbColorFromCssVariable('fg-hint')
          },
          axisTick: {
            show: false
          },
          axisLine: {
            show: false
          },
          splitLine: {
            show: true,
            lineStyle: {
              type: "dashed",
              color: getRgbColorFromCssVariable('fg-divider', .7)
            }
          }
        }
      ],
      series: [
        {
          name: "Stock Value",
          data: seriesData,
          type: "bar",
          barWidth: "60%",
          color: getRgbColorFromCssVariable('color-primary'),
          itemStyle: {
            barBorderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
  }

  private initStockMovementChart(theme: any): void {
    this.stockMovementChart = {
      color: [
        getRgbColorFromCssVariable('color-primary'),
        '#EF4444'
      ],
      tooltip: {
        show: true,
        trigger: 'axis',
        backgroundColor: getRgbColorFromCssVariable('bg-card'),
        borderColor: getRgbColorFromCssVariable('fg-divider')
      },
      grid: {
        left: '8px',
        right: '8px',
        bottom: '0',
        top: '16%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['Stock In', 'Stock Out'],
        axisLabel: {
          color: getRgbColorFromCssVariable('fg-hint')
        },
        axisTick: {
          show: false
        },
        axisLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: getRgbColorFromCssVariable('fg-hint')
        },
        axisTick: {
          show: false
        },
        axisLine: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: getRgbColorFromCssVariable('fg-divider', 0.7)
          }
        }
      },
      series: [
        {
          name: 'Quantity',
          type: 'bar',
          barWidth: '50%',
          data: [
            this.stockInThisMonth,
            this.stockOutThisMonth
          ],
          itemStyle: {
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }

    if (typeof value === 'object') {
      if ('value' in value) {
        return this.toNumber(value.value);
      }
    }

    return 0;
  }

  private normalizeStatus(status: string): string {
    return (status || '').toString().toUpperCase();
  }

  private normalizeMovementType(type: string): string {
    const normalized = (type || '').toString().toUpperCase();
    if (normalized === 'IN' || normalized === 'OUT') {
      return normalized;
    }
    return 'ADJUSTMENT';
  }

  private formatDate(value: string): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  }
}
