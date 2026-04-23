import React, { useState } from 'react';

const AdherenceReports = () => {
    const [expandedMonth, setExpandedMonth] = useState(null);

    const reports = [
        { month: 'October 2023', adherence: 88, dosesTaken: 55, missed: 3, late: 4, trend: 'up', daysInMonth: 31 },
        { month: 'September 2023', adherence: 82, dosesTaken: 49, missed: 7, late: 4, trend: 'up', daysInMonth: 30 },
        { month: 'August 2023', adherence: 75, dosesTaken: 46, missed: 10, late: 6, trend: 'down', daysInMonth: 31 },
        { month: 'July 2023', adherence: 85, dosesTaken: 52, missed: 5, late: 5, trend: 'neutral', daysInMonth: 31 }
    ];

    const generateDailyData = (report) => {
        const days = [];
        for (let i = 1; i <= report.daysInMonth; i++) {
            // First medicine (Lisinopril)
            let med1Status = 'Taken';
            let med1Color = 'var(--primary-green)';
            const rand1 = Math.random() * 100;
            if (rand1 > report.adherence + 5) { med1Status = 'Missed'; med1Color = 'var(--alert)'; }
            else if (rand1 > report.adherence) { med1Status = 'Late'; med1Color = 'var(--warning)'; }

            // Second medicine (Metformin)
            let med2Status = 'Taken';
            let med2Color = 'var(--primary-green)';
            const rand2 = Math.random() * 100;
            if (rand2 > report.adherence + 5) { med2Status = 'Missed'; med2Color = 'var(--alert)'; }
            else if (rand2 > report.adherence) { med2Status = 'Late'; med2Color = 'var(--warning)'; }

            let overallStatus = 'Taken';
            if (med1Status === 'Missed' || med2Status === 'Missed') overallStatus = 'Missed';
            else if (med1Status === 'Late' || med2Status === 'Late') overallStatus = 'Late';

            days.push({
                day: i,
                overallStatus,
                medications: [
                    { name: 'Lisinopril (10mg)', status: med1Status, color: med1Color },
                    { name: 'Metformin (500mg)', status: med2Status, color: med2Color }
                ]
            });
        }
        return days;
    };

    const toggleMonth = (month) => {
        setExpandedMonth(expandedMonth === month ? null : month);
    };

    return (
        <div className="card" style={{ gridColumn: 'span 12', padding: 'var(--space-xl)' }}>
            <div className="card-header" style={{ marginBottom: 'var(--space-lg)' }}>
                <h2><i className="fa-solid fa-file-medical-alt icon-primary" style={{ marginRight: '1rem', display: 'inline-flex' }}></i> Adherence History</h2>
                <p style={{ color: 'var(--text-muted)' }}>Historical view of your medication adherence over time. Click a month to view daily insights.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {reports.map((report, index) => (
                    <div key={index} style={{
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--border-radius-md)',
                        background: 'var(--white)',
                        overflow: 'hidden',
                        transition: 'box-shadow 0.2s'
                    }}>
                        {/* Month Header (Clickable) */}
                        <div
                            onClick={() => toggleMonth(report.month)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 'var(--space-md)',
                                cursor: 'pointer',
                                background: expandedMonth === report.month ? 'var(--soft-mint)' : 'transparent',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => { if (expandedMonth !== report.month) e.currentTarget.style.background = '#f9f9f9'; }}
                            onMouseLeave={(e) => { if (expandedMonth !== report.month) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <div>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {report.month}
                                    <i className={`fa-solid fa-chevron-${expandedMonth === report.month ? 'up' : 'down'}`} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}></i>
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    {report.dosesTaken} Taken • {report.late} Late • {report.missed} Missed
                                </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: report.adherence >= 85 ? 'var(--primary-green)' : (report.adherence >= 65 ? 'var(--warning)' : 'var(--alert)') }}>
                                        {report.adherence}%
                                    </span>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Adherence</div>
                                </div>

                                <i className={`fa-solid ${report.trend === 'up' ? 'fa-arrow-trend-up' : (report.trend === 'down' ? 'fa-arrow-trend-down' : 'fa-minus')}`}
                                    style={{ fontSize: '1.5rem', color: report.trend === 'up' ? 'var(--primary-green)' : (report.trend === 'down' ? 'var(--alert)' : 'var(--text-muted)') }}>
                                </i>
                            </div>
                        </div>

                        {/* Expanded Daily Content */}
                        {expandedMonth === report.month && (
                            <div style={{ padding: 'var(--space-lg)', borderTop: '1px solid var(--border-light)', background: '#fafbfc', maxHeight: '500px', overflowY: 'auto' }}>
                                <h4 style={{ marginBottom: '15px', color: 'var(--text-dark)' }}>Daily Breakdown - {report.month}</h4>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: '15px'
                                }}>
                                    {generateDailyData(report).map(d => (
                                        <div key={d.day} style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            padding: '12px',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: '8px',
                                            background: 'var(--white)',
                                            boxShadow: 'var(--shadow-soft)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Day {d.day}</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: d.overallStatus === 'Taken' ? 'var(--primary-green)' : (d.overallStatus === 'Late' ? 'var(--warning)' : 'var(--alert)') }}>
                                                    {d.overallStatus}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {d.medications.map((med, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: med.color }}></div>
                                                        <span style={{ flex: 1 }}>{med.name}</span>
                                                        <span style={{ fontSize: '0.75rem', color: med.color }}>{med.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdherenceReports;
