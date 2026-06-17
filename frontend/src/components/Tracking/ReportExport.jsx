import React, { useState } from 'react';
import { downloadTrackingReport } from './reportGenerator';

const ReportExport = ({ backendUrl, userId, title = 'Download PDF', filename, variant = 'card' }) => {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!backendUrl || !userId || loading) return;
        setLoading(true);
        try {
            await downloadTrackingReport({ backendUrl, userId, filename });
        } finally {
            setLoading(false);
        }
    };

    if (variant === 'solid') {
        return (
            <div className="rounded-3xl bg-indigo-600 text-white p-6 shadow-xl border border-indigo-500">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-indigo-100 font-semibold">Clinical Export</p>
                        <h3 className="text-xl font-black mt-2">Download Medical Report</h3>
                        <p className="text-indigo-100 text-sm mt-3 leading-6">Generate a shareable PDF for healthcare review and continuity of care.</p>
                    </div>
                    <i className="fa-solid fa-file-pdf text-3xl text-indigo-100/90"></i>
                </div>
                <button
                    type="button"
                    onClick={handleDownload}
                    className="mt-6 w-full rounded-2xl bg-white text-indigo-700 font-bold py-3.5 shadow-lg hover:bg-indigo-50 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    disabled={loading}
                >
                    <i className={`fa-solid ${loading ? 'fa-circle-notch fa-spin' : 'fa-download'}`}></i>
                    {loading ? 'Preparing report...' : title}
                </button>
            </div>
        );
    }

    return (
        <div className="card report-export">
            <div className="card-header">
                <h3>Export Reports</h3>
                <i className="fa-solid fa-cloud-arrow-down icon-primary"></i>
            </div>
            <div className="card-body actions-container">
                <p>Download your adherence reports securely to your local device.</p>
                <div className="action-buttons">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ textDecoration: 'none', opacity: loading ? 0.7 : 1 }}
                    >
                        <i className={`fa-solid ${loading ? 'fa-circle-notch fa-spin' : 'fa-file-pdf'}`}></i> {loading ? 'Preparing...' : title}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportExport;
