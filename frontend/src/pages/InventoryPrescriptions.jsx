import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContent } from '../context/AppContext';
import PatientSidebar from '../components/PatientSidebar';
import LoggedIn from '../components/loggedin';

const InventoryPrescriptions = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { backendUrl } = useContext(AppContent);
    const [patient, setPatient] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [note, setNote] = useState('');
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef(null);

    // Fetch patient data if caretaker view
    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const { data } = await axios.get(
                    `${backendUrl}/api/user/get-patient/${patientId}`,
                    { withCredentials: true }
                );
                if (data.success) {
                    setPatient(data.patient);
                }
            } catch (error) {
                console.error("Network or Server Error:", error);
            }
        };
        if (patientId) {
            fetchPatientData();
        }
    }, [patientId, backendUrl]);

    const fetchPrescriptions = async () => {
        try {
            const url = patientId
                ? `${backendUrl}/api/prescriptions?patientId=${patientId}`
                : `${backendUrl}/api/prescriptions`;
            const { data } = await axios.get(url, { withCredentials: true });
            if (data.success && data.prescriptions) {
                setPrescriptions(data.prescriptions);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    useEffect(() => {
        fetchPrescriptions();
    }, [patientId, backendUrl]);

    // Drag and Drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error("Please select a file to upload.");
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', name);
            formData.append('note', note);
            if (patientId) {
                formData.append('patientId', patientId);
            }

            const response = await axios.post(`${backendUrl}/api/prescriptions`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                toast.success('Prescription uploaded successfully');
                fetchPrescriptions(); // Refresh list
                closeModal();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFile(null);
        setName('');
        setNote('');
    };

    const renderContent = () => (
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-emerald-900 mb-1">Prescription Manager</h2>
                    <p className="text-slate-500 text-sm">Review uploaded documents and add new prescriptions.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Back to Inventory
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                        + Add a prescription
                    </button>
                </div>
            </div>

            {prescriptions.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6 text-sm font-semibold text-slate-600 w-1/4">Date Uploaded</th>
                                <th className="py-4 px-6 text-sm font-semibold text-slate-600 w-1/4">Name</th>
                                <th className="py-4 px-6 text-sm font-semibold text-slate-600 w-1/4">Note</th>
                                <th className="py-4 px-6 text-sm font-semibold text-slate-600 text-right w-1/4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prescriptions.map((presc, index) => (
                                <tr key={index} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                                    <td className="py-4 px-6 text-sm text-slate-600">
                                        {new Date(presc.uploadDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="font-semibold text-emerald-900 truncate max-w-[200px]" title={presc.name}>{presc.name}</p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="text-sm text-slate-500 truncate max-w-[250px]" title={presc.note}>{presc.note || <span className="italic text-slate-400">No notes provided</span>}</p>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <a
                                                href={`${backendUrl}${presc.fileUrl}`}
                                                target="_blank" rel="noreferrer"
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                            >
                                                View
                                            </a>
                                            <a
                                                href={`${backendUrl}${presc.fileUrl}`}
                                                download={presc.name}
                                                className="text-sm font-medium text-emerald-600 hover:text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-200"
                                            >
                                                Download
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">No prescriptions added yet.</p>
                </div>
            )}
        </div>
    );

    // Modal Component
    const renderModal = () => (
        isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 transform transition-all">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-xl font-bold text-slate-800">Add a Prescription</h3>
                        <p className="text-sm text-slate-500 mt-1">Upload a document or photo of the prescription.</p>
                    </div>

                    <form onSubmit={handleUpload} className="p-6">
                        <div className="space-y-5">
                            {/* Drag and drop zone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Prescription File *</label>
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 bg-slate-50'}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                    />
                                    {file ? (
                                        <div className="flex flex-col items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <p className="text-emerald-700 font-medium truncate max-w-[250px]">{file.name}</p>
                                            <p className="text-xs text-slate-400 mt-1">Click or drag to change file</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                            <p className="text-slate-600 font-medium">Drag & drop your file here</p>
                                            <p className="text-xs text-slate-400 mt-1">or click to browse</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Prescription Name <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
                                <input
                                    type="text"
                                    placeholder="Leaves blank to use file name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Note <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
                                <textarea
                                    placeholder="Add any additional details or instructions here"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows="3"
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors resize-none"
                                ></textarea>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={uploading}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={uploading || !file}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
                            >
                                {uploading ? 'Uploading...' : 'Save Prescription'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );

    // Conditional rendering based on role (derived from URL presence of patientId)
    if (patientId) {
        // Caretaker View
        return (
            <div className='flex min-h-screen bg-white'>
                <PatientSidebar patientName={patient?.name} />
                <main className='flex-1 p-8 md:p-12 bg-slate-50 relative'>
                    <div className='max-w-6xl mx-auto'>
                        <h1 className='text-2xl font-bold text-emerald-900 mb-1'>
                            Inventory — <span className='text-emerald-500'>{patient?.name || 'Loading...'}</span>
                        </h1>
                        <p className='text-slate-400 text-sm mb-8'>Manage document files for this patient.</p>

                        {renderContent()}
                    </div>
                </main>
                {renderModal()}
            </div>
        );
    }

    // Patient View
    return (
        <LoggedIn>
            <div className="max-w-6xl mx-auto w-full relative">
                <div className="mb-8 border-b border-emerald-100 pb-6">
                    <h1 className='text-3xl sm:text-4xl font-black text-emerald-900'>
                        Inventory
                    </h1>
                    <p className='text-emerald-700 mt-2 text-sm sm:text-base'>Manage your medication stock levels and securely store prescriptions.</p>
                </div>

                {renderContent()}
            </div>
            {renderModal()}
        </LoggedIn>
    );
};

export default InventoryPrescriptions;
