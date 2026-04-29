import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

export default function PatientCards({ patientIds }) {
    // patientIds: array of patient IDs that have been loaded so far
    const [cards, setCards] = useState([]);

    const fetchAllPatients = useCallback(async () => {
        if (!patientIds || patientIds.length === 0) return;
        try {
            // Fetch medications for every loaded patient in parallel
            const results = await Promise.all(
                patientIds.map(pid => API.get(`/patient/${pid}`).then(r => ({ pid, meds: r.data })).catch(() => ({ pid, meds: [] })))
            );
            const newCards = results.map(({ pid, meds }) => ({
                patientId: pid,
                name: meds.length > 0 ? (meds[0].patientName || 'Unknown') : 'Unknown',
                meds
            }));
            setCards(newCards);
        } catch (err) {
            console.error('PatientCards: failed to fetch patients', err);
        }
    }, [patientIds]);

    useEffect(() => {
        fetchAllPatients();

        // Re-fetch when a new medication is added anywhere
        const onMedsUpdated = () => fetchAllPatients();
        window.addEventListener('medsUpdated', onMedsUpdated);
        return () => window.removeEventListener('medsUpdated', onMedsUpdated);
    }, [fetchAllPatients]);

    const cardStyle = {
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 12,
        margin: 8,
        width: 260,
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        background: '#fff'
    };

    const containerStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12
    };

    if (cards.length === 0) return null;

    return (
        <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#065f46', marginBottom: '16px' }}>Scheduled Medications</h3>
            <div style={containerStyle}>
                {cards.map(card => (
                    <div key={card.patientId} style={cardStyle}>
                        <div style={{ fontWeight: 700, marginBottom: 6, color: '#065f46' }}>Patient ID: {card.patientId}</div>
                        <div style={{ fontSize: 13, marginBottom: 6 }}>
                            {card.meds.length === 0 ? (
                                <p style={{ color: '#999' }}>No medications scheduled</p>
                            ) : (
                                <ul style={{ marginTop: 6, paddingLeft: '20px' }}>
                                    {card.meds.map((m, i) => (
                                        <li key={m._id || i} style={{ marginBottom: '4px', color: '#374151' }}>
                                            <strong>{m.medicationName}</strong> @ {m.time}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
