import React, { useEffect, useState, useContext } from 'react'
import { AppContent } from '../context/AppContext'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const UserOversight = () => {
    const { backendUrl } = useContext(AppContent)
    const [users, setUsers] = useState([]) 
    const [loading, setLoading] = useState(true)

    const fetchUsers = async () => {
        try {
            setLoading(true)
            axios.defaults.withCredentials = true
            const token = localStorage.getItem('med_app_auth_token') || '';
            const { data } = await axios.get(backendUrl + '/api/admin/all-users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setUsers(data.users || [] ); 
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Error fetching user data")
        } finally {
            setLoading(false)
        }
    }

    const removeUser = async (userId) => {
        if (window.confirm("Are you sure you want to remove this user?")) {
            try {
                const token = localStorage.getItem('med_app_auth_token') || '';
                const { data } = await axios.post(
                    backendUrl + '/api/admin/delete-user', 
                    { targetUserId: userId },
                    { 
                        withCredentials: true,
                        headers: { Authorization: `Bearer ${token}` }
                    } 
                );
                if (data.success) {
                    toast.success(data.message);
                    fetchUsers();
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
            doc.text('User Directory Report', 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

            const tableColumn = ["User ID", "Name", "Email", "Role", "Status"];
            const tableRows = users.map(user => [
                user._id.slice(-8),
                user.name,
                user.email,
                user.role,
                user.isAccountVerified ? "Verified" : "Pending"
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                theme: 'striped',
                headStyles: { fillColor: [5, 150, 105] }, 
                margin: { top: 35 },
            });

            doc.save(`User_Report_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate PDF");
        }
    };

    useEffect(() => {
        fetchUsers()
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
                    <p className='text-xs text-gray-500'>Total Registered Users: {users.length}</p>
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
                            <th className='px-4 py-4'>User ID</th>
                            <th className='px-4 py-4'>User Details</th>
                            <th className='px-4 py-4 text-center'>Role</th> {/* NEW COLUMN */}
                            <th className='px-4 py-4'>Status</th>
                            <th className='px-4 py-4 text-center'>Actions</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-emerald-50'>
                        {users.map((user) => (
                            <tr key={user._id} className='hover:bg-emerald-50/30 transition-all'>
                                <td className='px-4 py-4 text-[10px] font-mono text-gray-400'>
                                    #{user._id.slice(-8)}
                                </td>
                                <td className='px-4 py-4'>
                                    <p className='font-bold text-emerald-900 text-sm'>{user.name}</p>
                                    <p className='text-xs text-gray-500'>{user.email}</p>
                                </td>
                                <td className='px-4 py-4 text-center'>
                                    {/* Role Badge */}
                                    <span className={`inline-block px-2 py-1 rounded-md text-[9px] font-bold uppercase ${
                                        user.role === 'Caretaker' 
                                        ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                                        : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className='px-4 py-4'>
                                    {user.isAccountVerified ? (
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
                                        onClick={() => removeUser(user._id)}
                                        className="inline-flex items-center px-4 py-1.5 rounded-full bg-rose-50 text-rose-500 text-[10px] font-bold uppercase hover:bg-rose-100 border border-rose-100 transition-all"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {users.length === 0 && (
                    <div className='text-center py-20 bg-emerald-50/10 rounded-b-xl'>
                        <p className='text-gray-400 italic font-medium'>No users currently registered in the system.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserOversight