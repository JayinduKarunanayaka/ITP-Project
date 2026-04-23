import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Global defaults for styling matching CSS
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.color = '#6B7C7C';

const primaryGreen = '#1FA97A';
const warningColor = '#F4B740';
const alertColor = '#E05A5A';

const IntakeVisualization = ({ 
    pieDataValues = [85, 12, 3], 
    barDataValues = {
        onTime: [100, 100, 50, 100, 100, 100, 50],
        missed: [0, 0, 50, 0, 0, 0, 50],
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    activeRange = 'weekly',
    onRangeChange = () => {}
}) => {
    // 1. Pie Chart Data
    const pieData = {
        labels: ['Taken (On Time)', 'Taken (Late)', 'Missed'],
        datasets: [{
            data: pieDataValues,
            backgroundColor: [primaryGreen, warningColor, alertColor],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' }
            },
            tooltip: {
                backgroundColor: 'rgba(47, 58, 58, 0.9)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => ` ${context.label}: ${context.raw}%`
                }
            }
        }
    };

    // 2. Bar Chart Data
    const isMonthly = activeRange === 'monthly';
    const barData = {
        labels: barDataValues.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'On Time',
                data: barDataValues.onTime,
                backgroundColor: primaryGreen,
                borderRadius: isMonthly ? 2 : 4,
                barPercentage: isMonthly ? 0.9 : 0.6,
                categoryPercentage: isMonthly ? 1.0 : 0.8
            },
            {
                label: 'Missed',
                data: barDataValues.missed,
                backgroundColor: alertColor,
                borderRadius: isMonthly ? 2 : 4,
                barPercentage: isMonthly ? 0.9 : 0.6,
                categoryPercentage: isMonthly ? 1.0 : 0.8
            }
        ]
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { 
                stacked: true, 
                grid: { display: false },
                ticks: {
                    autoSkip: true,
                    maxRotation: isMonthly ? 45 : 0,
                    minRotation: 0,
                    font: { size: isMonthly ? 10 : 12 }
                }
            },
            y: {
                stacked: true,
                beginAtZero: true,
                ticks: { 
                    stepSize: 1, 
                    callback: (value) => Math.floor(value) === value ? value : '' 
                },
                grid: { color: 'rgba(226, 232, 230, 0.5)', borderDash: [5, 5] },
                border: { display: false }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(47, 58, 58, 0.9)',
                padding: 12,
                cornerRadius: 8,
                mode: 'index',
                intersect: false
            }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    };

    return (
        <div className="card intake-visualization">
            <div className="card-header">
                <h3>Medication Intake Patterns</h3>
                <div className="chart-controls">
                    <button className={activeRange === 'weekly' ? "active" : ""} onClick={() => onRangeChange('weekly')}>Weekly</button>
                    <button className={activeRange === 'monthly' ? "active" : ""} onClick={() => onRangeChange('monthly')}>Monthly</button>
                </div>
            </div>
            <div className="card-body charts-container">
                <div className="chart-wrapper pie-chart-wrapper">
                    <Doughnut data={pieData} options={pieOptions} />
                </div>
                <div className="chart-wrapper bar-chart-wrapper">
                    <Bar data={barData} options={barOptions} />
                </div>
            </div>
        </div>
    );
};

export default IntakeVisualization;
