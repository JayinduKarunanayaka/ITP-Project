import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Analytics = () => {
    const lineData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
        datasets: [
            {
                label: 'Adherence Trend (%)',
                data: [65, 70, 75, 82, 85, 88],
                borderColor: '#1FA97A',
                backgroundColor: 'rgba(31, 169, 122, 0.2)',
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#1FA97A',
                pointRadius: 5,
                tension: 0.4
            }
        ]
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(47, 58, 58, 0.9)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => ` Adherence: ${context.raw}%`
                }
            }
        },
        scales: {
            y: { min: 40, max: 100, grid: { borderDash: [5, 5] } },
            x: { grid: { display: false } }
        }
    };

    return (
        <div className="card" style={{ gridColumn: 'span 12', padding: 'var(--space-xl)' }}>
            <div className="card-header" style={{ marginBottom: 'var(--space-lg)' }}>
                <h2><i className="fa-solid fa-chart-pie icon-primary" style={{ marginRight: '1rem', display: 'inline-flex' }}></i> Advanced Analytics</h2>
                <p style={{ color: 'var(--text-muted)' }}>AI-driven insights on your medication behavior.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-lg)' }}>

                {/* Trend Chart */}
                <div style={{ gridColumn: 'span 8', height: '350px', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-md)', padding: 'var(--space-md)' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Overall Adherence Trend</h4>
                    <Line data={lineData} options={lineOptions} />
                </div>

                {/* AI Insights Panel */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div style={{ background: 'var(--soft-mint)', padding: 'var(--space-md)', borderRadius: 'var(--border-radius-md)' }}>
                        <h4 style={{ color: 'var(--primary-green)', marginBottom: '0.5rem' }}><i className="fa-solid fa-wand-magic-sparkles"></i> Smart Insight</h4>
                        <p style={{ fontSize: '0.9rem' }}>Your adherence implies an <strong>improving habit</strong>. Continuing this trend will result in 90%+ adherence next month.</p>
                    </div>

                    <div style={{ background: 'rgba(244, 183, 64, 0.15)', padding: 'var(--space-md)', borderRadius: 'var(--border-radius-md)' }}>
                        <h4 style={{ color: 'var(--warning)', marginBottom: '0.5rem' }}><i className="fa-solid fa-clock-rotate-left"></i> Timing Risk</h4>
                        <p style={{ fontSize: '0.9rem' }}>You frequently take Evening doses 45+ minutes late. Moving your 8:00 PM alarm to 7:30 PM might help.</p>
                    </div>

                    <div style={{ border: '1px solid var(--border-light)', padding: 'var(--space-md)', borderRadius: 'var(--border-radius-md)' }}>
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Risk Level</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>Low</span>
                            <i className="fa-solid fa-shield-heart" style={{ fontSize: '1.5rem', color: 'var(--success)' }}></i>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Analytics;
