(function (global) {
    var app = global.SuperAdminDashboard = global.SuperAdminDashboard || {};
    var chartInstances = {
        revenue: null,
        occupancy: null
    };

    function xAxisTickOptions() {
        var isCompact = global.matchMedia && global.matchMedia('(max-width: 720px)').matches;
        return {
            color: '#707796',
            autoSkip: true,
            autoSkipPadding: isCompact ? 14 : 18,
            maxRotation: 0,
            minRotation: 0,
            maxTicksLimit: isCompact ? 6 : 12
        };
    }

    function buildChart(ctx, config) {
        if (!ctx) {
            return null;
        }
        if (config.type === 'line' && chartInstances.revenue && chartInstances.revenue.canvas === ctx) {
            chartInstances.revenue.destroy();
        }
        return new Chart(ctx, config);
    }

    function renderRevenueChart(canvas, labels, values) {
        if (!canvas) {
            return;
        }
        if (chartInstances.revenue) {
            chartInstances.revenue.destroy();
        }
        chartInstances.revenue = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Revenue',
                        data: values,
                        backgroundColor: [
                            'rgba(94, 66, 166, 0.88)',
                            'rgba(96, 80, 184, 0.84)',
                            'rgba(80, 82, 181, 0.82)',
                            'rgba(111, 108, 216, 0.84)',
                            'rgba(138, 120, 218, 0.84)',
                            'rgba(183, 78, 145, 0.82)',
                            'rgba(211, 123, 171, 0.78)',
                            'rgba(235, 197, 136, 0.82)',
                            'rgba(94, 66, 166, 0.88)',
                            'rgba(96, 80, 184, 0.84)',
                            'rgba(80, 82, 181, 0.82)',
                            'rgba(183, 78, 145, 0.82)'
                        ],
                        borderRadius: 8,
                        borderSkipped: false,
                        hoverBackgroundColor: '#312450'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        grid: {
                            color: 'rgba(49, 36, 80, 0.08)'
                        },
                        ticks: {
                            color: '#707796'
                        }
                    },
                    x: {
                        ticks: xAxisTickOptions(),
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#ffffff',
                        titleColor: '#1f2341',
                        bodyColor: '#5f6683',
                        borderColor: 'rgba(94, 66, 166, 0.14)',
                        borderWidth: 1,
                        displayColors: false,
                        padding: 12
                    }
                },
                layout: {
                    padding: {
                        top: 8,
                        right: 6,
                        bottom: 0,
                        left: 6
                    }
                }
            }
        });
    }

    function renderOccupancyChart(canvas, labels, values) {
        if (!canvas) {
            return;
        }
        if (chartInstances.occupancy) {
            chartInstances.occupancy.destroy();
        }
        chartInstances.occupancy = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Occupancy',
                        data: values,
                        borderColor: '#6a57c7',
                        backgroundColor: 'rgba(106, 87, 199, 0.12)',
                        fill: true,
                        tension: 0.38,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#b74e91',
                        pointBorderWidth: 2,
                        pointHoverRadius: 5,
                        pointRadius: 3.5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 100,
                        ticks: {
                            color: '#707796'
                        },
                        grid: {
                            color: 'rgba(49, 36, 80, 0.08)'
                        }
                    },
                    x: {
                        ticks: xAxisTickOptions(),
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#ffffff',
                        titleColor: '#1f2341',
                        bodyColor: '#5f6683',
                        borderColor: 'rgba(94, 66, 166, 0.14)',
                        borderWidth: 1,
                        displayColors: false,
                        padding: 12
                    }
                },
                layout: {
                    padding: {
                        top: 8,
                        right: 6,
                        bottom: 0,
                        left: 6
                    }
                }
            }
        });
    }

    function renderCharts(payload) {
        if (!payload) {
            return;
        }
        var revenueCanvas = document.getElementById('revenue-chart');
        var occupancyCanvas = document.getElementById('occupancy-chart');
        var labels = payload.labels || [];
        var revenueValues = payload.revenue || [];
        var occupancyValues = payload.occupancy || [];

        renderRevenueChart(revenueCanvas, labels, revenueValues);
        renderOccupancyChart(occupancyCanvas, labels, occupancyValues);
    }

    app.Charts = {
        renderCharts: renderCharts
    };
})(window);
