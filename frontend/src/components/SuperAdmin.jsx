import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';

const SuperAdmin = ({ backendUrl }) => {
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [subTab, setSubTab] = useState('Admin Table');
    
    const [admins, setAdmins] = useState([]);
    const [logs, setLogs] = useState([]);
    const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;
        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const fetchAdminData = async () => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/admin/list-admins`,
                { withCredentials: true }
            );
            if (data.success) {
                setAdmins(data.admins);
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/admin/audit-logs`, 
                { withCredentials: true }
            );
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        }
    };

    useEffect(() => {
        if (isAuthorized) {
            fetchAdminData();
            fetchAuditLogs();
        }
    }, [isAuthorized]);

    const handleVerify = async () => {
        const finalKey = otp.join("");
        if (finalKey.length !== 6) return toast.error("Enter 6 digits");

        try {
            setLoading(true);
            const { data } = await axios.post(
                `${backendUrl}/api/admin/verify-super`, 
                { masterKey: finalKey },
                { withCredentials: true }
            );
            if (data.success) {
                setIsAuthorized(true);
                toast.success("Master Access Granted");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Verification failed. Check server connection.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/admin/create-admin`, 
                { ...newAdmin, birthday: "1900-01-01", isAccountVerified: true },
                { withCredentials: true }
            );
            
            if (data.success) {
                toast.success("Admin Created Successfully");
                setNewAdmin({ email: '', password: '' });
                
                await fetchAdminData(); 
                await fetchAuditLogs();
                setSubTab('Admin Table');
            } else {
                toast.error(data.message || "Failed to create admin");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Server error.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAdmin = async (adminId) => {
        if (!window.confirm("Delete this admin? Access will be revoked immediately.")) return;
        try {
            const { data } = await axios.post(
                `${backendUrl}/api/admin/remove-admin`, 
                { adminId },
                { withCredentials: true }
            );
            if (data.success) {
                toast.success("Admin Removed");
                fetchAdminData();
                fetchAuditLogs();
            }
        } catch (error) {
            toast.error("Removal failed");
        }
    };


    if (isAuthorized) {
        return (
            <div className='animate-in fade-in zoom-in duration-500 w-full max-w-[95%] ml-0 py-10 px-6'>
                <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 p-8 bg-rose-50 rounded-[2rem] border border-rose-100 w-full shadow-sm'>
                    <div className='flex-1'>
                        <h2 className='text-2xl font-black text-rose-900 flex items-center gap-3'>
                            <span className='w-3 h-3 bg-rose-600 rounded-full animate-pulse'></span>
                            MASTER CONTROL LAYER
                        </h2>
                        <p className='text-sm text-rose-700/70 font-medium'>System-wide privileges active. All deletions are permanent.</p>
                    </div>
                    
                    <div className='flex bg-white/60 p-1.5 rounded-xl border border-rose-200 shadow-sm shrink-0'>
                        {['Admin Table', 'Create Admin', 'Audit Logs'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setSubTab(tab)}
                                className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-all ${
                                    subTab === tab 
                                    ? 'bg-rose-600 text-white shadow-lg' 
                                    : 'text-rose-900 hover:bg-rose-100'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className='grid grid-cols-1 gap-6'>
                    {subTab === 'Admin Table' && (
                        <div className='w-full bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden'>
                            <div className='p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30'>
                                <h3 className='font-bold text-gray-800'>Active Administrative Staff</h3>
                                <span className='px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold'>
                                    {admins.length} ACTIVE SESSIONS
                                </span>
                            </div>
                            <div className='overflow-x-auto'>
                                <table className='w-full text-left'>
                                    <thead className='bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-[0.1em]'>
                                        <tr>
                                            <th className='px-8 py-5 font-semibold'>System Identifier</th>
                                            <th className='px-8 py-5 font-semibold'>Authorized Email</th>
                                            <th className='px-8 py-5 font-semibold'>Role Status</th>
                                            <th className='px-8 py-5 font-semibold text-right'>Management</th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-gray-50'>
                                        {admins.length > 0 ? admins.map((admin) => (
                                            <tr key={admin._id} className='hover:bg-gray-50/80 transition-all group'>
                                                <td className='px-8 py-5 font-mono text-[10px] text-gray-400 group-hover:text-emerald-600 transition-colors'>{admin._id}</td>
                                                <td className='px-8 py-5 text-sm font-bold text-gray-700'>{admin.email}</td>
                                                <td className='px-8 py-5 text-[10px] font-black uppercase text-emerald-600'>Administrator</td>
                                                <td className='px-8 py-5 text-right'>
                                                    <button onClick={() => handleRemoveAdmin(admin._id)} className='text-[11px] font-black text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-100 px-4 py-2 rounded-xl transition-all'>
                                                        REVOKE ACCESS
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className='p-20 text-center text-gray-400 italic text-sm'>No secondary admins found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {subTab === 'Create Admin' && (
                        <div className='max-w-2xl mx-auto w-full bg-white p-10 rounded-[2rem] border border-gray-100 shadow-xl shadow-emerald-900/5'>
                            <h3 className='text-xl font-black text-gray-900 mb-5 text-center'>Onboard New Administrator</h3>
                            <form onSubmit={handleCreateAdmin} className='space-y-5'>
                                <input type="email" required placeholder="Official Email" className='w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium' value={newAdmin.email} onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})} />
                                <input type="password" required placeholder="Access Password" className='w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium' value={newAdmin.password} onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})} />
                                <button 
                                    type='submit' 
                                    disabled={loading}
                                    className='w-full py-4 bg-emerald-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98] disabled:opacity-50'
                                >
                                    {loading ? 'Authorizing...' : 'Authorize & Save Admin'}
                                </button>
                            </form>
                        </div>
                    )}

                    {subTab === 'Audit Logs' && (
                        <div className='w-full bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden'>
                            <div className='p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30'>
                                <div>
                                    <h3 className='font-bold text-gray-800'>System Audit Trail</h3>
                                    <p className='text-[10px] text-gray-400 font-medium uppercase tracking-tighter'>Live Security Monitoring</p>
                                </div>
                                <button onClick={fetchAuditLogs} className='text-[10px] font-black text-rose-600 hover:bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 transition-all'>
                                    REFRESH LOGS
                                </button>
                            </div>
                            <div className='overflow-x-auto'>
                                <table className='w-full text-left'>
                                    <thead className='bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest'>
                                        <tr>
                                            <th className='px-8 py-5 font-semibold'>Date & Time</th>
                                            <th className='px-8 py-5 font-semibold'>Admin User</th>
                                            <th className='px-8 py-5 font-semibold'>Admin Email</th>
                                            <th className='px-8 py-5 font-semibold'>Action Performed</th>
                                            <th className='px-8 py-5 font-semibold'>Target Resource</th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-gray-50'>
                                        {logs.length > 0 ? logs.map((log) => (
                                            <tr key={log._id} className='hover:bg-gray-50 transition-all'>
                                                <td className='px-8 py-5 text-xs text-gray-500 font-mono'>
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                                <td className='px-8 py-5 text-sm font-bold text-gray-700'>
                                                    {log.adminName || "System Agent"}
                                                </td>
                                                <td className='px-8 py-5 text-sm font-bold text-gray-700'>
                                                    {log.adminEmail}
                                                </td>
                                                <td className='px-8 py-5'>
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                                                        log.action.includes('REMOVE') || log.action.includes('DELETE') 
                                                        ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className='px-8 py-5 font-mono text-[10px] text-gray-400 uppercase'>
                                                    {log.targetId || '---'}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className='p-20 text-center text-gray-400 italic text-sm'>
                                                    No system logs found in the current cycle.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className='flex flex-col items-center justify-center p-10 bg-emerald-50/50 rounded-3xl border border-emerald-100 min-h-[400px]'>
            <img src={assets.lock_icon} className='w-12 mb-4' alt="Secure" />
            <h3 className='text-emerald-900 font-bold text-xl'>Super Admin Portal</h3>
            <p className='text-emerald-600 text-xs mb-8 uppercase tracking-widest'>Identity Verification Required</p>

            <div className='flex gap-2 mb-8'>
                {otp.map((data, index) => (
                    <input
                        key={index}
                        type="text"
                        maxLength="1"
                        className='w-12 h-14 border-2 border-emerald-200 rounded-xl text-center text-xl font-bold focus:border-emerald-500 outline-none bg-white transition-all'
                        value={data}
                        onChange={e => handleChange(e.target, index)}
                        onFocus={e => e.target.select()}
                    />
                ))}
            </div>

            <button 
                onClick={handleVerify}
                disabled={loading}
                className='w-full max-w-[300px] py-4 bg-emerald-900 text-white rounded-2xl font-bold shadow-lg hover:bg-black transition-all'
            >
                {loading ? "Verifying..." : "Verify Identity"}
            </button>
        </div>
    );
};

export default SuperAdmin;