import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { AppContent } from '../../context/appContext.jsx'
import '../App.css'
import './MedList.css'

export default function MedList({ patientId }) {
  const { backendUrl } = useContext(AppContent)
  const [meds, setMeds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scheduledTimes, setScheduledTimes] = useState({})

  const fetchMeds = async () => {
    setLoading(true)
    setError(null)
    try {
      const url = patientId
          ? `${backendUrl}/api/medications?patientId=${patientId}`
          : `${backendUrl}/api/medications`;
      const res = await axios.get(url, { withCredentials: true })
      const filteredMeds = (res.data.meds || []).filter(med => med.status !== 'inventory_only');
      setMeds(filteredMeds)
    } catch (err) {
      console.error('Error fetching meds:', err)
      setError(err?.response?.data?.message || err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleTimeChange = (medId, time) => {
    setScheduledTimes(prev => ({ ...prev, [medId]: time }));
  };

  const handleAllocate = async (medId) => {
    const timeToAllocate = scheduledTimes[medId];
    if (!timeToAllocate) return;

    try {
      await axios.put(`${backendUrl}/api/medications/${medId}`, { time: timeToAllocate }, { withCredentials: true })
      fetchMeds()
      setScheduledTimes(prev => {
        const newTimes = { ...prev }
        delete newTimes[medId]
        return newTimes
      })
      window.dispatchEvent(new Event('medsUpdated')) // keep broadcasting a custom event just in case
    } catch (err) {
      console.error('Error allocating time:', err)
      setError('Failed to update scheduled time')
    }
  }

  useEffect(() => {
    // For caretaker flows we always have patientId (query by that id).
    // For patient portal (no patientId), we still want to fetch meds for the
    // current logged-in user, so call fetchMeds() with no query param.
    fetchMeds();

    const onMedsUpdated = () => fetchMeds();
    window.addEventListener('medsUpdated', onMedsUpdated);
    return () => window.removeEventListener('medsUpdated', onMedsUpdated);
  }, [patientId]);

  const pendingMeds = meds.filter(med => !med.time)
  const allocatedMeds = meds.filter(med => med.time)

  if (loading) return <div className="loading">Loading medications…</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="scheduler-container">
      <div className="scheduler-wrapper">
        <h2 className="scheduler-title">Pending Time Allocations</h2>

        {!pendingMeds.length ? (
          <p className="no-data-text">No pending medications to schedule.</p>
        ) : (
          <div className="cards-list">
            {pendingMeds.map((med) => (
              <div key={med._id} className="medication-card">
                <div className="card-details">
                  <h3 className="med-name">{med.name || 'Unknown Medication'}</h3>
                  {med.indication && <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>{med.indication}</p>}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    {med.dosage && <span style={{ fontSize: '0.875rem', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>Dosage: {med.dosage}</span>}
                    {med.type && <span style={{ fontSize: '0.875rem', color: med.type === 'regular' ? '#065f46' : '#9a3412', backgroundColor: med.type === 'regular' ? '#d1fae5' : '#ffedd5', padding: '2px 8px', borderRadius: '4px' }}>Type: {med.type}</span>}
                    {med.dateStarted && <span style={{ fontSize: '0.875rem', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>Started: {new Date(med.dateStarted).toLocaleDateString()}</span>}
                  </div>
                  <p className="patient-id">Patient ID: {med.patientId || med.userId || patientId}</p>
                </div>

                <div className="allocation-action">
                  <div className="time-input-wrapper">
                    <span className="clock-icon">🕒</span>
                    <input
                      type="time"
                      className="time-input"
                      value={scheduledTimes[med._id] !== undefined ? scheduledTimes[med._id] : (med.time || '')}
                      onChange={(e) => handleTimeChange(med._id, e.target.value)}
                    />
                  </div>

                  <button
                    className="allocate-btn"
                    onClick={() => handleAllocate(med._id)}
                    disabled={scheduledTimes[med._id] === undefined}
                  >
                    Allocate Time
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {allocatedMeds.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2 className="scheduler-title" style={{ textAlign: 'center', color: '#065f46', marginBottom: '1.5rem', fontWeight: 'bold' }}>Allocated Times</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
              {allocatedMeds.map((med) => (
                <div key={med._id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  width: '100%',
                  maxWidth: '700px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827', fontSize: '1.25rem', fontWeight: 'bold' }}>{med.name}</h3>
                      {med.dosage && <span style={{ fontSize: '0.875rem', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '6px' }}>Dosage: {med.dosage}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', backgroundColor: '#ecfdf5', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allocated Time</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>⏰</span>
                        <span style={{ fontWeight: '800', color: '#047857', fontSize: '1.5rem' }}>{med.time}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '1rem', marginTop: 'auto' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                       <div style={{ position: 'relative' }}>
                         <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🕒</span>
                         <input
                           type="time"
                           style={{
                             padding: '0.5rem 2rem 0.5rem 0.8rem',
                             border: '1px solid #d1fae5',
                             borderRadius: '8px',
                             fontSize: '0.9rem',
                             color: '#047857',
                             outline: 'none',
                             backgroundColor: '#ecfdf5',
                             fontWeight: '500'
                           }}
                           value={scheduledTimes[med._id] !== undefined ? scheduledTimes[med._id] : med.time}
                           onChange={(e) => handleTimeChange(med._id, e.target.value)}
                         />
                       </div>
                       <button
                         onClick={() => handleAllocate(med._id)}
                         disabled={scheduledTimes[med._id] === undefined || scheduledTimes[med._id] === med.time}
                         style={{
                           padding: '0.5rem 1.2rem',
                           backgroundColor: scheduledTimes[med._id] !== undefined && scheduledTimes[med._id] !== med.time ? '#10b981' : '#e5e7eb',
                           color: scheduledTimes[med._id] !== undefined && scheduledTimes[med._id] !== med.time ? 'white' : '#6b7280',
                           border: 'none',
                           borderRadius: '8px',
                           fontSize: '0.9rem',
                           fontWeight: 'bold',
                           cursor: scheduledTimes[med._id] !== undefined && scheduledTimes[med._id] !== med.time ? 'pointer' : 'not-allowed',
                           transition: 'all 0.2s',
                           boxShadow: scheduledTimes[med._id] !== undefined && scheduledTimes[med._id] !== med.time ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none'
                         }}
                       >
                         Update
                       </button>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
