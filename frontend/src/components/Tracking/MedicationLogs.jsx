import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContent } from '../../context/AppContext.jsx';

const MedicationLogs = ({ patientId, onLogAdded }) => {
    const { backendUrl, userData } = useContext(AppContent);
    const targetUserId = patientId || userData?._id;

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        medicationName: '',
        scheduledTime: '',
        status: 'Taken',
        note: '',
        type: 'target'
    });
    const [editingLogId, setEditingLogId] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [targetUserId]);

    const fetchLogs = async () => {
        if (!targetUserId) return;
        try {
            const response = await axios.get(`${backendUrl}/api/tracking/history/${targetUserId}`, { withCredentials: true });
            setLogs(response.data.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch logs from server');
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const dateObj = new Date(dateString);
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleStatusChange = (e) => {
        const val = e.target.value;
        let pType = 'target';
        if (val === 'Late' || val === 'Pending') pType = 'warning';
        if (val === 'Missed' || val === 'Skipped') pType = 'alert';

        setFormData({ ...formData, status: val, type: pType });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            const now = new Date();
            const [hours, minutes] = formData.scheduledTime.split(':');
            const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes));

            const submissionData = {
                ...formData,
                scheduledTime: scheduledDate.toISOString(),
                patientId: patientId, 
                medicationId: '678fb7e0349896798e987654'
            };

            if (editingLogId) {
                // Update existing log
                const response = await axios.put(`${backendUrl}/api/tracking/${editingLogId}`, submissionData, { withCredentials: true });
                if (response.data.success) {
                    setLogs(logs.map(log => log._id === editingLogId ? response.data.data : log));
                    setEditingLogId(null);
                    setShowForm(false);
                    setFormData({ medicationName: '', scheduledTime: '', status: 'Taken', note: '', type: 'target' });
                    if (onLogAdded) onLogAdded();
                }
            } else {
                // Create new log
                const response = await axios.post(`${backendUrl}/api/tracking/record`, submissionData, { withCredentials: true });
                if (response.data.success) {
                    setLogs([response.data.data, ...logs]);
                    setShowForm(false);
                    setFormData({ medicationName: '', scheduledTime: '', status: 'Taken', note: '', type: 'target' });
                    if (onLogAdded) onLogAdded();
                }
            }
        } catch (err) {
            alert('Failed to save log');
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (logId) => {
        if (!window.confirm('Are you sure you want to delete this medication log? This action cannot be undone.')) return;
        
        setIsProcessing(true);
        try {
            const response = await axios.delete(`${backendUrl}/api/tracking/${logId}`, { withCredentials: true });
            if (response.data.success) {
                setLogs(logs.filter(log => log._id !== logId));
                if (onLogAdded) onLogAdded();
            }
        } catch (err) {
            alert('Failed to delete log');
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const startEditing = (log) => {
        const dateObj = new Date(log.scheduledTime);
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');
        
        setFormData({
            medicationName: log.medicationName,
            scheduledTime: `${hours}:${minutes}`,
            status: log.status,
            note: log.note || '',
            type: log.status === 'Taken' ? 'target' : (['Late', 'Pending'].includes(log.status) ? 'warning' : 'alert')
        });
        setEditingLogId(log._id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStatusStyle = (type) => {
        switch (type) {
            case 'target': return { background: 'var(--soft-mint)', color: 'var(--primary-green)' };
            case 'warning': return { background: 'rgba(244, 183, 64, 0.2)', color: 'var(--warning)' };
            case 'alert': return { background: 'rgba(224, 90, 90, 0.2)', color: 'var(--alert)' };
            default: return { background: '#f0f0f0', color: '#666' };
        }
    };

    return (
        <div className="card medication-logbook" style={{ padding: 'var(--space-xl)' }}>
            {loading && <div style={{ marginBottom: '1rem', color: 'var(--primary-green)' }}>Loading logs from database...</div>}
            {error && <div style={{ marginBottom: '1rem', color: 'var(--alert)' }}>{error}</div>}
            <div className="card-header" style={{ marginBottom: 'var(--space-lg)' }}>
                <h2><i className="fa-solid fa-list-check icon-primary" style={{ marginRight: '1rem', display: 'inline-flex' }}></i> Medication Logbook</h2>
                <div className="chart-controls">
                    <button className={!showForm ? "active" : ""} onClick={() => { setShowForm(false); setEditingLogId(null); }}>History</button>
                    <button className={showForm && !editingLogId ? "active" : ""} onClick={() => { setShowForm(true); setEditingLogId(null); setFormData({ medicationName: '', scheduledTime: '', status: 'Taken', note: '', type: 'target' }); }}>+ Add Log</button>
                    {editingLogId && <button className="active" style={{ background: 'var(--warning)', borderColor: 'var(--warning)' }}>Editing Mode</button>}
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{
                    background: 'var(--soft-mint)',
                    padding: 'var(--space-lg)',
                    borderRadius: 'var(--border-radius-md)',
                    marginBottom: 'var(--space-xl)',
                    display: 'grid',
                    gap: '1rem',
                    gridTemplateColumns: '1fr 1fr 1fr auto'
                }}>
                    <input
                        type="text"
                        name="medicationName"
                        value={formData.medicationName}
                        onChange={handleInputChange}
                        placeholder="Medication Name (e.g. Lisinopril 10mg)"
                        required
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)' }}
                    />
                    <input
                        type="text"
                        name="note"
                        value={formData.note}
                        onChange={handleInputChange}
                        placeholder="Note (e.g. Skipped due to nausea)"
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="time"
                            name="scheduledTime"
                            value={formData.scheduledTime}
                            onChange={handleInputChange}
                            required
                            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)' }}
                        />
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleStatusChange}
                            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid var(--border-light)' }}
                        >
                            <option value="Taken">Taken</option>
                            <option value="Late">Late</option>
                            <option value="Missed">Missed</option>
                            <option value="Skipped">Skipped</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ padding: '10px 20px', height: '100%', flex: 1, opacity: isProcessing ? 0.7 : 1 }}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (editingLogId ? 'Update Log' : 'Save Log')}
                        </button>
                        {editingLogId && (
                            <button 
                                type="button" 
                                className="btn" 
                                onClick={() => { setEditingLogId(null); setShowForm(false); }}
                                style={{ padding: '10px', background: 'white', border: '1px solid var(--border-light)' }}
                                disabled={isProcessing}
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        )}
                    </div>
                </form>
            )}

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '12px 16px' }}>Date</th>
                             <th style={{ padding: '12px 16px' }}>Time</th>
                             <th style={{ padding: '12px 16px' }}>Medication</th>
                             <th style={{ padding: '12px 16px' }}>Status</th>
                             <th style={{ padding: '12px 16px' }}>Notes / Reason</th>
                             <th style={{ padding: '12px 16px' }}>Action</th>
                         </tr>
                     </thead>
                     <tbody>
                         {logs.map((log) => (
                             <tr key={log._id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s', ':hover': { background: 'var(--soft-mint)' } }}>
                                 <td style={{ padding: '16px', fontWeight: '500' }}>{formatDate(log.scheduledTime || log.timestamp || log.createdAt)}</td>
                                 <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(log.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                 <td style={{ padding: '16px' }}>{log.medicationName}</td>
                                 <td style={{ padding: '16px' }}>
                                     <span style={{
                                         padding: '4px 12px',
                                         borderRadius: '12px',
                                         fontSize: '0.85rem',
                                         fontWeight: '600',
                                         ...getStatusStyle(log.status === 'Missed' || log.status === 'Skipped' ? 'alert' : log.status === 'Late' || log.status === 'Pending' ? 'warning' : 'target')
                                     }}>
                                         {log.status}
                                     </span>
                                 </td>
                                 <td style={{ padding: '16px', fontStyle: 'italic', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                     {log.note || '-'}
                                 </td>
                                 <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button 
                                            onClick={() => startEditing(log)}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary-green)', cursor: 'pointer', fontSize: '1rem', opacity: isProcessing ? 0.5 : 1 }}
                                            title="Edit Log"
                                            disabled={isProcessing}
                                        >
                                            <i className="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(log._id)}
                                            style={{ background: 'none', border: 'none', color: 'var(--alert)', cursor: 'pointer', fontSize: '1rem', opacity: isProcessing ? 0.5 : 1 }}
                                            title="Delete Log"
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-trash-can"></i>}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MedicationLogs;
