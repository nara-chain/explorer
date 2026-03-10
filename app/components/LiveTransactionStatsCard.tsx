'use client';

import { TableCardBody } from '@components/common/TableCardBody';
import { StatsNotReady } from '@components/StatsNotReady';
import { ClusterStatsStatus, PERF_UPDATE_SEC, usePerformanceInfo } from '@providers/stats/solanaClusterStats';
import { PerformanceInfo } from '@providers/stats/solanaPerformanceInfo';
import { BarElement, CategoryScale, Chart, ChartData, ChartOptions, LinearScale, Tooltip } from 'chart.js';
import classNames from 'classnames';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import CountUp from 'react-countup';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip);

type Series = 'short' | 'medium' | 'long';
type SetSeries = (series: Series) => void;
const SERIES: Series[] = ['short', 'medium', 'long'];
const NARA_ACCENT = 'rgba(57, 255, 20, 0.72)';
const NARA_ACCENT_HOVER = 'rgba(57, 255, 20, 0.9)';
const NARA_MUTED = 'rgba(139, 139, 139, 0.6)';
const SERIES_INFO = {
    long: {
        interval: '6h',
        label: (index: number) => index * 12,
    },
    medium: {
        interval: '2h',
        label: (index: number) => index * 4,
    },
    short: {
        interval: '30m',
        label: (index: number) => index,
    },
};

export function LiveTransactionStatsCard() {
    const [series, setSeries] = React.useState<Series>('short');
    return (
        <div className="card flex-grow-1 d-flex flex-column nara-panel-card">
            <div className="card-header">
                <h4 className="card-header-title">Live Transaction Stats</h4>
            </div>
            <TpsCardBody series={series} setSeries={setSeries} />
        </div>
    );
}

function TpsCardBody({ series, setSeries }: { series: Series; setSeries: SetSeries }) {
    const performanceInfo = usePerformanceInfo();

    if (performanceInfo.status !== ClusterStatsStatus.Ready) {
        return <StatsNotReady error={performanceInfo.status === ClusterStatsStatus.Error} />;
    }

    return <TpsBarChart performanceInfo={performanceInfo} series={series} setSeries={setSeries} />;
}

const TPS_CHART_OPTIONS = (historyMaxTps: number): ChartOptions<'bar'> => {
    return {
        animation: false,
        interaction: {
            intersect: false,
            mode: 'index',
        },
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                enabled: false, // Disable the on-canvas tooltip
                external(context) {
                    // Tooltip Element
                    let tooltipEl = document.getElementById('chartjs-tooltip');

                    // Create element on first render
                    if (!tooltipEl) {
                        tooltipEl = document.createElement('div');
                        tooltipEl.id = 'chartjs-tooltip';
                        tooltipEl.innerHTML = '<div class="content"></div>';
                        document.body.appendChild(tooltipEl);
                    }

                    // Hide if no tooltip
                    const tooltipModel = context.tooltip;
                    if (tooltipModel.opacity === 0) {
                        tooltipEl.style.opacity = '0';
                        return;
                    }

                    // Set caret Position
                    tooltipEl.classList.remove('above', 'below', 'no-transform');
                    if (tooltipModel.yAlign) {
                        tooltipEl.classList.add(tooltipModel.yAlign);
                    } else {
                        tooltipEl.classList.add('no-transform');
                    }

                    // Set Text
                    if (tooltipModel.body) {
                        const { label, raw } = tooltipModel.dataPoints[0];
                        const tooltipContent = tooltipEl.querySelector('div');
                        if (tooltipContent) {
                            let innerHtml = `<div class="value">${raw} TPS</div>`;
                            innerHtml += `<div class="label">${label}</div>`;
                            tooltipContent.innerHTML = innerHtml;
                        }
                    }

                    const position = context.chart.canvas.getBoundingClientRect();

                    // Display, position, and set styles for font
                    tooltipEl.style.opacity = '1';
                    tooltipEl.style.position = 'absolute';
                    tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
                    tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
                    tooltipEl.style.pointerEvents = 'none';
                },
                intersect: false,
            },
        },
        resizeDelay: 0,
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    display: false,
                },
                border: {
                    display: false,
                },
            },
            y: {
                border: {
                    display: false,
                },
                grid: {
                    color: 'rgba(57, 255, 20, 0.06)',
                    lineWidth: 1,
                },
                min: 0,
                suggestedMax: historyMaxTps,
                ticks: {
                    count: 6,
                    display: true,
                    font: {
                        family: "'JetBrains Mono', monospace",
                        size: 9,
                    },
                    color: 'rgba(139, 139, 139, 0.5)',
                    precision: 0,
                    padding: 8,
                    callback: (value: number | string) => {
                        const n = Number(value);
                        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
                        return Math.round(n).toString();
                    },
                },
            },
        },
    };
};

type TpsBarChartProps = {
    performanceInfo: PerformanceInfo;
    series: Series;
    setSeries: SetSeries;
};
function TpsBarChart({ performanceInfo, series, setSeries }: TpsBarChartProps) {
    const { perfHistory, avgTps, historyMaxTps } = performanceInfo;
    const averageTps = Math.round(avgTps != null ? avgTps : 0.0).toLocaleString('en-US');
    const transactionCount = <AnimatedTransactionCount info={performanceInfo} />;
    const seriesData = perfHistory[series];
    const chartOptions = React.useMemo<ChartOptions<'bar'>>(() => TPS_CHART_OPTIONS(historyMaxTps), [historyMaxTps]);

    const seriesLength = seriesData.length;
    const chartData: ChartData<'bar'> = {
        datasets: [
            {
                backgroundColor: NARA_ACCENT,
                borderWidth: 0,
                borderRadius: 1,
                data: seriesData.map(val => val || 0),
                hoverBackgroundColor: NARA_ACCENT_HOVER,
                barPercentage: 0.8,
                categoryPercentage: 0.9,
            },
        ],
        labels: seriesData.map((val, i) => {
            return `${SERIES_INFO[series].label(seriesLength - i)}min ago`;
        }),
    };

    return (
        <div className="d-flex flex-column flex-grow-1">
            <TableCardBody>
                <tr>
                    <td className="w-100">Transaction count</td>
                    <td className="text-lg-end font-monospace">{transactionCount} </td>
                </tr>
                <tr>
                    <td className="w-100">Transactions per second (TPS)</td>
                    <td className="text-lg-end font-monospace">{averageTps} </td>
                </tr>
            </TableCardBody>

            <hr className="my-0" />

            <div className="card-body py-3 d-flex flex-column flex-grow-1">
                <div className="d-flex justify-content-between align-items-center w-100">
                    <span style={{ fontSize: '0.5625rem', fontWeight: 400, letterSpacing: '0.15em', textTransform: 'uppercase' as const, opacity: 0.5, color: '#39ff14' }}>TPS history</span>

                    <div style={{ display: 'flex', gap: '4px' }}>
                        {SERIES.map(key => (
                            <button
                                key={key}
                                onClick={() => setSeries(key)}
                                className={classNames('btn btn-sm', {
                                    active: series === key,
                                })}
                                style={{
                                    fontSize: '0.5625rem',
                                    fontWeight: 400,
                                    letterSpacing: '0.08em',
                                    padding: '2px 8px',
                                    lineHeight: 1.6,
                                    border: series === key ? '1px solid rgba(57, 255, 20, 0.4)' : '1px solid rgba(57, 255, 20, 0.12)',
                                    background: series === key ? 'rgba(57, 255, 20, 0.1)' : 'transparent',
                                    color: series === key ? '#39ff14' : '#8b8b8b',
                                    borderRadius: 0,
                                }}
                            >
                                {SERIES_INFO[key].interval}
                            </button>
                        ))}
                    </div>
                </div>

                <div id="perf-history" className="mt-3 flex-grow-1" style={{ minHeight: '200px' }}>
                    <Bar data={chartData} options={chartOptions} style={{ height: '100%' }} />
                </div>
            </div>
        </div>
    );
}

function AnimatedTransactionCount({ info }: { info: PerformanceInfo }) {
    const txCountRef = React.useRef(0);
    const countUpRef = React.useRef({ lastUpdate: 0, period: 0, start: 0 });
    const countUp = countUpRef.current;

    const { transactionCount, avgTps } = info;
    const txCount = Number(transactionCount);

    // Track last tx count to reset count up options
    if (txCount !== txCountRef.current) {
        if (countUp.lastUpdate > 0) {
            // Since we overshoot below, calculate the elapsed value
            // and start from there.
            const elapsed = Date.now() - countUp.lastUpdate;
            const elapsedPeriods = elapsed / (PERF_UPDATE_SEC * 1000);
            countUp.start = Math.floor(countUp.start + elapsedPeriods * countUp.period);

            // if counter gets ahead of actual count, just hold for a bit
            // until txCount catches up (this will sometimes happen when a tab is
            // sent to the background and/or connection drops)
            countUp.period = Math.max(txCount - countUp.start, 1);
        } else {
            // Since this is the first tx count value, estimate the previous
            // tx count in order to have a starting point for our animation
            countUp.period = PERF_UPDATE_SEC * (avgTps != null ? avgTps : 0.0);
            countUp.start = txCount - countUp.period;
        }
        countUp.lastUpdate = Date.now();
        txCountRef.current = txCount;
    }

    // Overshoot the target tx count in case the next update is delayed
    const COUNT_PERIODS = 3;
    const countUpEnd = countUp.start + COUNT_PERIODS * countUp.period;
    return (
        <CountUp
            start={countUp.start}
            end={countUpEnd}
            duration={PERF_UPDATE_SEC * COUNT_PERIODS}
            delay={0}
            useEasing={false}
            preserveValue={true}
            separator=","
        />
    );
}
