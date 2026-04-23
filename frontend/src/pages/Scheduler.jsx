import React, {useState, useEffect, useContext} from 'react';
import '../schedule/App.css';
import MedList from '../schedule/components/MedList.jsx';
import { AppContent } from '../context/AppContext';

function Scheduler({ patientId: propPatientId }) {
    const { isLoggedin } = useContext(AppContent);
    const [patientId, setPatientId] = useState(propPatientId || '');
    const [input, setInput] = useState('');

    // If parent gives us a patientId (caretaker/PatientTime flow), always prefer that.
    useEffect(() => {
        if (propPatientId && propPatientId !== patientId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPatientId(propPatientId);
        }
    }, [propPatientId, patientId]);

    const loadPatient = () => {
        const trimmed = input.trim();
        if (trimmed) {
            setPatientId(trimmed);
            setInput('');
        }
    };

    // For logged-in patient portal TimeAllocation where no patientId prop is passed,
    // we want to show that patient's own meds without requiring an ID input.
    const effectivePatientId = propPatientId || patientId || null;

    return (
        <div className="scheduler-embedded">
            {/* For caretaker flows (PatientTime) we always have propPatientId and hide input.
                For patient portal (TimeAllocation) we don't pass a prop, but we also
                don't want them to type an ID, so hide the input when logged in. */}
            {!propPatientId && !isLoggedin && (
                <div className="patient-controls" style={{ marginBottom: '20px' }}>
                    <input
                        className="patient-input"
                        placeholder="Enter patient ID (e.g. 12345)"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadPatient()}
                    />
                    <button className="btn primary" onClick={loadPatient}>
                        Load
                    </button>
                </div>
            )}

            <div className="scheduler-components" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
                {/* When effectivePatientId is null, MedList will call /api/medications without query,
                    and backend will use req.body.userId (current logged-in user). */}
                <MedList patientId={effectivePatientId} />
            </div>
        </div>
    );
}

export default Scheduler;
