import React, { useEffect, useState, useContext } from 'react'
import { AppContent } from '../context/AppContext'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const UserOversight = () => {
    const { backendUrl } = useContext(AppContent)
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchPatients = async () => {
        try {
            setLoading(true)
            axios.defaults.withCredentials = true
            const { data } = await axios.get(backendUrl + '/api/admin/all-patients')
            if (data.success) {
                setPatients(data.patients)
            }
        } catch (error) {
            toast.error("Error fetching patient data")
        } finally {
            setLoading(false)
        }
    }

    const removeUser = async (userId) => {
        if (window.confirm("Are you sure?")) {
            try {
                const { data } = await axios.post(
                    backendUrl + '/api/admin/delete-user', 
                    { targetUserId: userId },
                    { withCredentials: true } 
                );
                if (data.success) {
                    toast.success(data.message);
                    fetchPatients();
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const downloadPDF = () => {
        try {
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text('Patient Directory Report', 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

            const tableColumn = ["User ID", "Name", "Email", "Status"];
            const tableRows = patients.map(patient => [
                patient._id.slice(-8),
                patient.name,
                patient.email,
                patient.isAccountVerified ? "Verified" : "Pending"
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                theme: 'striped',
                headStyles: { fillColor: [5, 150, 105] }, 
                margin: { top: 35 },
            });

            doc.save(`Patient_Report_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate PDF");
        }
        };

    useEffect(() => {
        fetchPatients()
    }, [])

    if (loading) return (
        <div className='flex items-center justify-center py-20'>
            <div className='w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin'></div>
        </div>
    )

    return (
        <div className='w-full'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-3'>
                <div>
                    <p className='text-xs text-gray-500'>Total Registered: {patients.length}</p>
                </div>
                <button 
                    onClick={downloadPDF}
                    className='flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95'
                >
                    Download PDF Report
                </button>
            </div>

            <div className='overflow-x-auto bg-white rounded-xl'>
                <table className='w-full text-left border-collapse'>
                    <thead className='bg-emerald-50 text-emerald-700 uppercase text-[11px] font-bold'>
                        <tr>
                            <th className='px-4 py-4 text-nowrap'>User ID</th>
                            <th className='px-4 py-4 text-nowrap'>Patient Name</th>
                            <th className='px-4 py-4 text-nowrap'>Status</th>
                            <th className='px-4 py-4 text-center text-nowrap'>Actions</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-emerald-50'>
                        {patients.map((patient) => (
                            <tr key={patient._id} className='hover:bg-emerald-50/30 transition-all'>
                                <td className='px-4 py-4 text-[10px] font-mono text-gray-400'>
                                    #{patient._id.slice(-8)}
                                </td>
                                <td className='px-4 py-4'>
                                    <p className='font-bold text-emerald-900 text-sm'>{patient.name}</p>
                                    <p className='text-xs text-gray-500'>{patient.email}</p>
                                </td>
                                <td className='px-4 py-4'>
                                    {patient.isAccountVerified ? (
                                        <span className='inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase'>
                                            Verified
                                        </span>
                                    ) : (
                                        <span className='inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-black uppercase'>
                                            Pending
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <button 
                                        onClick={() => removeUser(patient._id)}
                                        className="inline-flex items-center px-4 py-1.5 rounded-full bg-rose-50 text-rose-500 text-[10px] font-bold uppercase hover:bg-rose-100 border border-rose-100 transition-all"
                                        title="Delete Patient"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {patients.length === 0 && (
                    <div className='text-center py-20 bg-emerald-50/10 rounded-b-xl'>
                        <p className='text-gray-400 italic font-medium'>No patients currently registered in the system.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserOversight