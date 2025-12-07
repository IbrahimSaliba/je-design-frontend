import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectionStrategy
} from "@angular/core";
import { egretAnimations } from "app/shared/animations/egret-animations";
import { getRgbColorFromCssVariable } from "app/shared/helpers/utils";
import { ThemeService } from "app/shared/services/theme.service";

@Component({
    selector: "app-analytics",
    templateUrl: "./analytics.component.html",
    styleUrls: ["./analytics.component.scss"],
    animations: egretAnimations,
    standalone: false
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  trafficVsSaleOptions: any;
  trafficVsSale: any;
  trafficData: any;
  saleData: any;

  sessionOptions: any;
  sessions: any;
  sessionsData: any;

  trafficGrowthChart: any;
  bounceRateGrowthChart: any;

  dailyTrafficChartBar: any;
  trafficSourcesChart: any;
  countryTrafficStats: any[];

  constructor(
    private themeService: ThemeService
  ) {}

  ngAfterViewInit() {}
  ngOnInit() {
    // Subscribe to theme changes
    this.themeService.activeTheme$().subscribe(activeTheme => {
      this.initTrafficVsSaleChart(activeTheme);
      this.initSessionsChart(activeTheme);
      this.initTrafficSourcesChart(activeTheme);
      this.initDailyTrafficChartBar(activeTheme);
      this.initTrafficGrowthChart(activeTheme);
    });

    // Initial setup with current theme
    const currentTheme = this.themeService.getActiveTheme();
    this.initTrafficVsSaleChart(currentTheme);
    this.initSessionsChart(currentTheme);
    this.initTrafficSourcesChart(currentTheme);
    this.initDailyTrafficChartBar(currentTheme);
    this.initTrafficGrowthChart(currentTheme);

    this.countryTrafficStats = [
      {
        country: "US",
        visitor: 14040,
        pageView: 10000,
        download: 1000,
        bounceRate: 30,
        flag: "flag-icon-us"
      },
      {
        country: "India",
        visitor: 12500,
        pageView: 10000,
        download: 1000,
        bounceRate: 45,
        flag: "flag-icon-in"
      },
      {
        country: "UK",
        visitor: 11000,
        pageView: 10000,
        download: 1000,
        bounceRate: 50,
        flag: "flag-icon-gb"
      },
      {
        country: "Brazil",
        visitor: 4000,
        pageView: 10000,
        download: 1000,
        bounceRate: 30,
        flag: "flag-icon-br"
      },
      {
        country: "Spain",
        visitor: 4000,
        pageView: 10000,
        download: 1000,
        bounceRate: 45,
        flag: "flag-icon-es"
      },
      {
        country: "Mexico",
        visitor: 4000,
        pageView: 10000,
        download: 1000,
        bounceRate: 70,
        flag: "flag-icon-mx"
      },
      {
        country: "Russia",
        visitor: 4000,
        pageView: 10000,
        download: 1000,
        bounceRate: 40,
        flag: "flag-icon-ru"
      }
    ];

    
    this.bounceRateGrowthChart = {
      tooltip: {
        trigger: "axis",
        backgroundColor: getRgbColorFromCssVariable('bg-card'),
        borderColor: getRgbColorFromCssVariable('fg-divider'),  
        axisPointer: {
          animation: true
        }
      },
      grid: {
        left: "0",
        top: "0",
        right: "0",
        bottom: "0"
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: ["0", "1", "2", "3", "4"],
        axisLabel: {
          show: false
        },
        axisLine: {
          lineStyle: {
            show: false
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 200,
        interval: 50,
        axisLabel: {
          show: false
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      series: [
        {
          name: "Bounce Rate",
          type: "line",
          smooth: false,
          data: [0, 20, 90, 120, 190],
          symbolSize: 8,
          showSymbol: false,
          lineStyle: {
            opacity: 0,
            width: 0
          },
          itemStyle: {
            borderColor: "rgba(233, 31, 99, 0.4)"
          },
          areaStyle: {
            normal: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(244, 67, 54, 1)"
                  },
                  {
                    offset: 1,
                    color: "rgba(244, 67, 54, .4)"
                  }
                ]
              }
            }
          }
        }
      ]
    };
  }

  initTrafficVsSaleChart(theme) {
    // console.log(theme);
    this.trafficVsSaleOptions = {
      tooltip: {
        show: true,
        trigger: "axis",
        backgroundColor: getRgbColorFromCssVariable('bg-card'),
        borderColor: getRgbColorFromCssVariable('fg-divider'),
        axisPointer: {
          type: "line",
          animation: true
        }
      },
      grid: {
        top: "10%",
        left: "80px",
        right: "30px",
        bottom: "60"
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: [
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13",
          "14",
          "15"
        ],
        axisLabel: {
          show: true,
          margin: 20,
          color: getRgbColorFromCssVariable('fg-hint')
        },
        axisTick: {
          show: false
        },

        axisLine: {
          show: false,
          lineStyle: {
            show: false
          }
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: "value",
        axisLine: {
          show: false
        },
        axisLabel: {
          show: true,
          margin: 30,
          color: getRgbColorFromCssVariable('fg-hint')
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            color: getRgbColorFromCssVariable('fg-divider', .7)
          }
        }
      },
      series: [
        {
          name: "Traffic",
          label: { show: false, color: getRgbColorFromCssVariable('color-primary') },
          type: "bar",
          barGap: 0,
          color: getRgbColorFromCssVariable('fg-divider'),
          smooth: true
        },
        {
          name: "Sales",
          label: { show: false, color: getRgbColorFromCssVariable('fg-hint') },
          type: "bar",
          color: getRgbColorFromCssVariable('fg-hint'),
          smooth: true
        }
      ]
    };
    
    this.trafficData = [
      1400,
      1350,
      950,
      1150,
      950,
      1260,
      930,
      1450,
      1150,
      1400,
      1350,
      950,
      1150,
      950,
      1260
    ];
    this.saleData = [
      500,
      700,
      350,
      840,
      750,
      800,
      700,
      500,
      700,
      650,
      104,
      750,
      800,
      700,
      500
    ];
    this.trafficVsSale = {
      series: [
        {
          data: this.trafficData
        },
        {
          data: this.saleData
        }
      ]
    };
  }

  initSessionsChart(theme) {
    this.sessionOptions = {
      tooltip: {
        show: true,
        trigger: "axis",
        backgroundColor: getRgbColorFromCssVariable('bg-card'),
        borderColor: getRgbColorFromCssVariable('fg-divider'),
        axisPointer: {
          type: "line",
          animation: true
        }
      },
      grid: {
        top: "10%",
        left: "60",
        right: "15",
        bottom: "60"
      },
      xAxis: {
        type: "category",
        data: [
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13",
          "14",
          "15",
          "16",
          "17",
          "18",
          "19",
          "20",
          "21",
          "22",
          "23",
          "24",
          "25",
          "26",
          "27",
          "28",
          "29",
          "30"
        ],
        axisLine: {
          show: false
        },
        axisLabel: {
          show: true,
          margin: 30,
          color: getRgbColorFromCssVariable('fg-hint')
        },
        axisTick: {
          show: false
        }
      },
      yAxis: {
        type: "value",
        axisLine: {
          show: false
        },
        axisLabel: {
          show: true,
          margin: 20,
          color: getRgbColorFromCssVariable('fg-hint')
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            color: getRgbColorFromCssVariable('fg-divider', .7)
          }
        }
      },
      series: [
        {
          data: [],
          type: "line",
          name: "User",
          smooth: true,
          color: getRgbColorFromCssVariable('color-primary'),
          lineStyle: {
            opacity: 1,
            width: 3
          },
          itemStyle: {
            opacity: 0
          },
          emphasis: {
            itemStyle: {
              color: getRgbColorFromCssVariable('color-primary'),
              borderColor: getRgbColorFromCssVariable('color-primary', .4),
              opacity: 1,
              borderWidth: 8
            },
            label: {
              show: false,
              backgroundColor: getRgbColorFromCssVariable('bg-card')
            }
          }
        }
      ]
    };
    this.sessionsData = [
      30,
      135,
      95,
      115,
      95,
      126,
      93,
      145,
      115,
      140,
      135,
      95,
      115,
      20,
      40,
      125,
      145,
      115,
      140,
      135,
      95,
      115,
      95,
      126,
      93,
      145,
      115,
      140,
      135,
      95
    ];

    this.sessions = {
      series: [
        {
          data: this.sessionsData
        }
      ]
    };
  }

  initTrafficSourcesChart(theme) {
    this.trafficSourcesChart = {
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true
      },
      color: [
        getRgbColorFromCssVariable('color-primary', .6),
        getRgbColorFromCssVariable('color-primary', .7),
        getRgbColorFromCssVariable('color-primary', .8)
      ],
      tooltip: {
        show: true,
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
        backgroundColor: getRgbColorFromCssVariable('bg-card'),
        borderColor: getRgbColorFromCssVariable('fg-divider'),
      },
      xAxis: [
        {
          axisLine: {
            show: false
          },
          splitLine: {
            show: false
          }
        }
      ],
      yAxis: [
        {
          axisLine: {
            show: false
          },
          splitLine: {
            show: false
          }
        }
      ],

      series: [
        {
          name: "Sessions",
          type: "pie",
          radius: ["55%", "85%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: false,
          hoverOffset: 5,
          stillShowZeroSum: false,
          label: {
            normal: {
              show: false,
              position: "center",
              textStyle: {
                fontSize: "13",
                fontWeight: "normal"
              },
              formatter: "{a}"
            },
            emphasis: {
              show: false,
              textStyle: {
                fontSize: "15",
                fontWeight: "normal",
                color: "rgba(15, 21, 77, 1)"
              },
              formatter: "{b} \n{c} ({d}%)"
            }
          },
          labelLine: {
            normal: {
              show: false
            }
          },
          data: [
            {
              value: 335,
              name: "Direct"
            },
            {
              value: 310,
              name: "Search Eng."
            },
            { value: 148, name: "Social" }
          ],
          itemStyle: {
            emphasis: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)"
            }
          }
        }
      ]
    };
  }

  initDailyTrafficChartBar(theme) {
    this.dailyTrafficChartBar = {
      legend: {
        show: false
      },
      grid: {
        left: "8px",
        right: "8px",
        bottom: "0",
        top: "0",
        containLabel: true
      },
      tooltip: {
        show: true,
        backgroundColor: getRgbColorFromCssVariable('bg-card'),
        borderColor: getRgbColorFromCssVariable('fg-divider'),
      },
      xAxis: [
        {
          type: "category",
          // data: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          data: ["1", "2", "3", "4", "5", "6", "7"],
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
            color: getRgbColorFromCssVariable('fg-hint')
          }
        }
      ],
      yAxis: [
        {
          type: "value",
          axisLabel: {
            show: false,
            formatter: "${value}"
          },
          min: 0,
          max: 100000,
          interval: 25000,
          axisTick: {
            show: false
          },
          axisLine: {
            show: false
          },
          splitLine: {
            show: false,
            interval: "auto"
          }
        }
      ],

      series: [
        {
          name: "Online",
          data: [35000, 69000, 22500, 60000, 50000, 50000, 30000],
          label: { show: true, color: getRgbColorFromCssVariable('color-primary'), position: "top" },
          type: "bar",
          barWidth: "12",
          color: getRgbColorFromCssVariable('color-primary'),
          smooth: true,
          itemStyle: {
            barBorderRadius: 10
          }
        }
      ]
    };
  }

  initTrafficGrowthChart(theme) {
    this.trafficGrowthChart = {
      tooltip: {
        trigger: "axis",
        backgroundColor: getRgbColorFromCssVariable('bg-card'),
        borderColor: getRgbColorFromCssVariable('fg-divider'),
        axisPointer: {
          animation: true
        }
      },
      grid: {
        left: "0",
        top: "0",
        right: "0",
        bottom: "0"
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: ["0", "1", "2", "3", "4"],
        axisLabel: {
          show: false
        },
        axisLine: {
          lineStyle: {
            show: false
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 200,
        interval: 50,
        axisLabel: {
          show: false
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      series: [
        {
          name: "Visit",
          type: "line",
          smooth: false,
          data: [0, 40, 140, 90, 160],
          symbolSize: 8,
          showSymbol: false,
          lineStyle: {
            opacity: 0,
            width: 0
          },
          itemStyle: {
            borderColor: "rgba(233, 31, 99, 0.4)"
          },
          areaStyle: {
            normal: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: getRgbColorFromCssVariable('color-primary')
                  },
                  {
                    offset: 1,
                    color: getRgbColorFromCssVariable('color-primary', .6)
                  }
                ]
              }
            }
          }
        }
      ]
    };
  }

}
