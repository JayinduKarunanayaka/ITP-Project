import React from 'react';
import { Link } from 'react-router-dom';

const ReportExport = () => {
    return (
        <div className="card report-export">
            <div className="card-header">
                <h3>Export Reports</h3>
                <i className="fa-solid fa-cloud-arrow-down icon-primary"></i>
            </div>
            <div className="card-body actions-container">
                <p>Download your adherence reports securely to your local device.</p>
                <div className="action-buttons">
                    <Link to="/download" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                        <i className="fa-solid fa-file-pdf"></i> Download PDF
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ReportExport;
