import React from 'react';

const BmiSnapshot = ({ bmiData, vitals }) => {
    if (!bmiData || !vitals) return null;

    return (
        <div className="card bmi-snapshot">
            <div className="card-header">
                <h3>Health Snapshot</h3>
                <i className="fa-solid fa-weight-scale icon-primary"></i>
            </div>
            <div className="card-body bmi-content">
                <div className="bmi-value-container">
                    <span className="bmi-value">{bmiData.value}</span>
                    <span className="bmi-label">BMI</span>
                </div>
                <div className="bmi-status">
                    <div className={`status-indicator ${bmiData.status === 'Normal Weight' ? 'optimal' : ''}`}>
                        {bmiData.status}
                    </div>
                    {/* Format date mockly for demo */}
                    <p className="last-updated">Last updated: 2 days ago</p>
                </div>
                <div className="health-metrics">
                    <div className="metric">
                        <i className="fa-solid fa-droplet"></i> Blood Pressure: {vitals.bloodPressure}
                    </div>
                    <div className="metric">
                        <i className="fa-solid fa-heart"></i> Heart Rate: {vitals.heartRate} bpm
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BmiSnapshot;
