import React from 'react';

const TimingAccuracy = ({ data }) => {
    if (!data) return null;

    return (
        <div className="card timing-accuracy">
            <div className="card-header">
                <h3>Dose Timing Accuracy</h3>
                <i className="fa-regular fa-clock icon-primary"></i>
            </div>
            <div className="card-body">
                <div className="timing-stats">
                    <div className="timing-stat on-time">
                        <h4>On Time</h4>
                        <span className="count">{data.onTime}%</span>
                        <div className="progress-bar"><div className="fill" style={{ width: `${data.onTime}%` }}></div></div>
                    </div>
                    <div className="timing-stat late">
                        <h4>Late</h4>
                        <span className="count">{data.late}%</span>
                        <div className="progress-bar"><div className="fill warning" style={{ width: `${data.late}%` }}></div></div>
                    </div>
                    <div className="timing-stat missed">
                        <h4>Missed</h4>
                        <span className="count">{data.missed}%</span>
                        <div className="progress-bar"><div className="fill alert" style={{ width: `${data.missed}%` }}></div></div>
                    </div>
                </div>
                <div className="behavioral-insight">
                    <i className="fa-solid fa-lightbulb"></i>
                    <p><strong>Insight:</strong> Most missed doses occur during the evening. Consider setting an extra alarm.</p>
                </div>
            </div>
        </div>
    );
};

export default TimingAccuracy;
