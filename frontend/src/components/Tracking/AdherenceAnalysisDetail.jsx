import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AppContent } from '../../context/AppContext.jsx';

const readSavedSessionToken = () => {
    try {
        return window.localStorage.getItem('med_app_auth_token') || '';
    } catch {
        return '';
    }
};

const AdherenceAnalysisDetail = ({ patientId, title = 'Behavioral Adherence Analytics' }) => {
    const { backendUrl } = useContext(AppContent);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!backendUrl || !patientId) return;
            setLoading(true);
            try {
                const token = readSavedSessionToken();
                const response = await axios.get(`${backendUrl}/api/tracking/detailed-adherence/${patientId}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });
                if (response.data?.success) {
                    setData(response.data);
                }
            } catch (error) {
                console.error('Failed to load adherence analysis', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [backendUrl, patientId]);

    const trend = data?.trendVelocity;
    const criticalMedication = data?.criticalMedication;

    return (
        <section className="card" style={{ gridColumn: '1 / -1', padding: 'var(--space-xl)' }}>
            <div className="card-header" style={{ marginBottom: 'var(--space-lg)' }}>
                <h2><i className="fa-solid fa-wave-square icon-primary" style={{ marginRight: '1rem', display: 'inline-flex' }}></i> {title}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Trend velocity, failure hotspots, and proactive clinical guidance.</p>
            </div>

            {loading ? (
                <div style={{ color: 'var(--primary-green)' }}>Loading deep-dive analytics...</div>
            ) : data ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--space-md)' }}>
                    <div style={{ gridColumn: 'span 4', background: 'var(--soft-mint)', borderRadius: 'var(--border-radius-md)', padding: 'var(--space-md)' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>Trend Velocity</h4>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: trend?.delta >= 0 ? 'var(--primary-green)' : 'var(--alert)' }}>
                            {trend?.delta >= 0 ? '+' : ''}{trend?.delta || 0}% {trend?.label || 'Improved'}
                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>Current 7 days: {trend?.currentRate || 0}% vs previous 7 days: {trend?.previousRate || 0}%</p>
                    </div>

                    <div style={{ gridColumn: 'span 4', background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-md)', padding: 'var(--space-md)' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>Behavioral Fingerprint</h4>
                        <p style={{ lineHeight: 1.6 }}>{data.behavioralFingerprint}</p>
                    </div>

                    <div style={{ gridColumn: 'span 4', background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-md)', padding: 'var(--space-md)' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>Critical Failure Tracking</h4>
                        <p style={{ lineHeight: 1.6 }}>
                            {criticalMedication?.medicationName ? `${criticalMedication.medicationName} missed ${criticalMedication.missedCount} time(s).` : 'No medication is repeatedly missed yet.'}
                        </p>
                    </div>

                    <div style={{ gridColumn: 'span 6', background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-md)', padding: 'var(--space-md)' }}>
                        <h4 style={{ marginBottom: '0.75rem' }}>Risk Hotspots</h4>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {(data.riskHotspots || []).map((hotspot) => (
                                <div key={hotspot.label} style={{ display: 'grid', gap: '0.35rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span>{hotspot.label}</span>
                                        <span>{hotspot.failureRate}% failure</span>
                                    </div>
                                    <div style={{ height: '8px', background: '#e8f5ee', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min(hotspot.failureRate, 100)}%`, height: '100%', background: hotspot.failureRate >= 40 ? 'var(--alert)' : hotspot.failureRate >= 20 ? 'var(--warning)' : 'var(--primary-green)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ gridColumn: 'span 6', background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-md)', padding: 'var(--space-md)' }}>
                        <h4 style={{ marginBottom: '0.75rem' }}>Proactive Clinical Advice</h4>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.8 }}>
                            {(data.clinicalAdvice || []).map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    </div>
                </div>
            ) : (
                <div style={{ color: 'var(--text-muted)' }}>Detailed analytics are unavailable right now.</div>
            )}
        </section>
    );
};

export default AdherenceAnalysisDetail;