import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContent } from '../context/AppContext';

const PatientAppointments = ({ patientId }) => {
    const { backendUrl } = useContext(AppContent);
    const [doctor, setDoctor] = useState('');
    const [doctorSpecialty, setDoctorSpecialty] = useState('');
    const [hospitalName, setHospitalName] = useState('');
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [editId, setEditId] = useState(null);

    const fetchAppointments = async () => {
        try {
            const url = patientId 
                ? `${backendUrl}/api/appointments?patientId=${patientId}` 
                : `${backendUrl}/api/appointments`;
            const { data } = await axios.get(url, { withCredentials: true });
            if (data.success && data.appointments) {
                setAppointments(data.appointments);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        
        if (!doctor.trim() || !date) {
            toast.error('Doctor name and Date are required.');
            return;
        }
        
        const selectedDate = new Date(date);
        if (selectedDate < new Date()) {
            toast.error('Appointment date cannot be in the past.');
            return;
        }

        try {
            setLoading(true);
            const payload = { doctor, doctorSpecialty, hospitalName, date, notes };
            if (patientId) payload.patientId = patientId;

            let data;
            if (editId) {
                const response = await axios.put(`${backendUrl}/api/appointments/${editId}`, payload, { withCredentials: true });
                data = response.data;
            } else {
                const response = await axios.post(backendUrl + '/api/appointments', payload, { withCredentials: true });
                data = response.data;
            }

            if (data.success) {
                toast.success(data.message || (editId ? 'Appointment updated' : 'Appointment scheduled'));
                setDoctor('');
                setDoctorSpecialty('');
                setHospitalName('');
                setDate('');
                setNotes('');
                setEditId(null);
                fetchAppointments();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (appt) => {
        setDoctor(appt.doctor);
        setDoctorSpecialty(appt.doctorSpecialty || '');
        setHospitalName(appt.hospitalName || '');
        if (appt.date) {
            const dt = new Date(appt.date);
            const localDt = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            setDate(localDt);
        }
        setNotes(appt.notes || '');
        setEditId(appt._id);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this appointment?")) return;
        try {
            const { data } = await axios.delete(`${backendUrl}/api/appointments/${id}`, { withCredentials: true });
            if (data.success) {
                toast.success(data.message || "Appointment deleted");
                fetchAppointments();
                if (editId === id) {
                    setEditId(null);
                    setDoctor('');
                    setDoctorSpecialty('');
                    setHospitalName('');
                    setDate('');
                    setNotes('');
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 lg:col-span-1">
                <h3 className="text-xl font-bold text-emerald-800 mb-4">{editId ? 'Edit Appointment' : 'Schedule Appointment'}</h3>
                <form onSubmit={onSubmitHandler} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                        <input type="text" value={doctor} onChange={(e) => setDoctor(e.target.value)} required className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Dr. Smith" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Specialty (Optional)</label>
                        <input type="text" value={doctorSpecialty} onChange={(e) => setDoctorSpecialty(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Cardiologist" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name (Optional)</label>
                        <input type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. City General" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Routine Checkup"></textarea>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md">
                            {loading ? 'Saving...' : (editId ? 'Update Appointment' : 'Schedule Appointment')}
                        </button>
                        {editId && (
                            <button type="button" onClick={() => { setEditId(null); setDoctor(''); setDoctorSpecialty(''); setHospitalName(''); setDate(''); setNotes(''); }} className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-all">
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 lg:col-span-2">
                <h3 className="text-xl font-bold text-emerald-800 mb-6">Upcoming Appointments</h3>
                {appointments.length > 0 ? (
                    <div className="space-y-4">
                        {appointments.map((appt, i) => (
                            <div key={i} className="p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all flex justify-between items-center bg-gray-50">
                                <div>
                                    <h4 className="font-bold text-emerald-900">{appt.doctor}</h4>
                                    {(appt.doctorSpecialty || appt.hospitalName) && (
                                        <p className="text-sm font-medium text-gray-700 mt-1">
                                            {appt.doctorSpecialty}{appt.doctorSpecialty && appt.hospitalName ? ' @ ' : ''}{appt.hospitalName}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-600 mt-1">{appt.notes || "No additional notes"}</p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <div className="text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">{new Date(appt.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                                    <div className="flex gap-3">
                                        <button onClick={() => handleEdit(appt)} className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors">Edit</button>
                                        <button onClick={() => handleDelete(appt._id)} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <p>No appointments scheduled yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientAppointments;
