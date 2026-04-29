import React, { useState } from 'react'
import API from '../api/axios'
import '../App.css'

export default function AddMedForm({ patientId }) {
  const [medicationName, setMedicationName] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!patientId) {
      setError('No patient selected')
      return
    }
    if (!medicationName || !time) {
      setError('Medication name and time are required')
      return
    }

    setLoading(true)
    try {
      const payload = {
        patientId,
        medicationName,
        time
      }
      await API.post('/addMedication', payload)
      setSuccess('Medication time scheduled')
      setMedicationName('')
      setTime('')

      // notify other parts of the app to refresh (MedList listens for this)
      window.dispatchEvent(new Event('medsUpdated'))
    } catch (err) {
      console.error('Failed to add medication', err)
      // If server returned structured validation details, format them
      const serverData = err?.response?.data
      if (serverData) {
        // Handle DB unavailable specially
        if (serverData.error_type === 'DatabaseUnavailable' || err?.response?.status === 503) {
          setError('Server database is unavailable. Please check the backend or try again later.\n' + (serverData.exact_message || serverData.message || ''))
        } else if (serverData.details && Array.isArray(serverData.details)) {
          const detailsText = serverData.details.map(d => `${d.field}: ${d.message}`).join('; ')
          setError(`${serverData.message || 'Validation error'} - ${detailsText}`)
        } else if (serverData.missing) {
          setError(`${serverData.message || 'Missing fields'}: ${serverData.missing.join(', ')}`)
        } else if (serverData.message) {
          setError(serverData.message)
        } else {
          setError(JSON.stringify(serverData))
        }
      } else {
        setError(err.message || 'Failed to add')
      }
    } finally {
      setLoading(false)
      // clear success after short delay
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  return (
    <form className="add-med-form" onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto', background: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#065f46', marginBottom: '16px', textAlign: 'center' }}>Schedule Medication</h3>
      {error && <div className="error" style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
      {success && <div className="success" style={{ color: 'green', marginBottom: '10px', textAlign: 'center' }}>{success}</div>}
      <div className="form-row" style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>Medication Name *</label>
        <input value={medicationName} onChange={(e) => setMedicationName(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }} placeholder="e.g. Amoxicillin" />
      </div>
      <div className="form-row" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>Time *</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
      </div>
      <div className="form-row" style={{ textAlign: 'center' }}>
        <button className="btn" type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#059669', color: '#ffffff', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Scheduling…' : 'Schedule Time'}
        </button>
      </div>
    </form>
  )
}
