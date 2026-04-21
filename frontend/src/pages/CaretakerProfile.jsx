import React, { useContext, useState, useEffect } from 'react'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const CaretakerProfile = () => {
    const { userData, backendUrl, getUserData, setIsLoggedin, setUserData } = useContext(AppContent)
    const navigate = useNavigate()
    
    const [isEdit, setIsEdit] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        birthday: '',
        gender: '',
        primaryLanguage: '',
        province: '',
        city: '',
        address: '',
        serviceArea: '',
        skills: ''
    })

    // Auto-calculate age from birthday
    const calculateAge = (dob) => {
        if (!dob) return "N/A";
        const birthDate = new Date(dob);
        const ageDate = new Date(Date.now() - birthDate.getTime());
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    useEffect(() => {
        if (userData) {
            setFormData({
                name: userData.name || '',
                // Ensure date is formatted correctly for the input type="date"
                birthday: userData.birthday ? new Date(userData.birthday).toISOString().split('T')[0] : '',
                gender: userData.gender || '',
                primaryLanguage: userData.primaryLanguage || '',
                province: userData.province || '',
                city: userData.city || '',
                address: userData.address || '',
                serviceArea: userData.serviceArea || '',
                skills: userData.skills || ''
            })
        }
    }, [userData])

    const handleUpdate = async () => {
        try {
            axios.defaults.withCredentials = true;
            const { data } = await axios.post(backendUrl + '/api/user/update-data', formData)
            if (data.success) {
                toast.success("Caretaker profile updated successfully")
                setIsEdit(false)
                getUserData()
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const logout = async () => {
        try {
            axios.defaults.withCredentials = true;
            const { data } = await axios.post(backendUrl + '/api/auth/logout');
            if (data.success) {
                setIsLoggedin(false);
                setUserData(false);
                navigate('/');
                toast.success("Logged out successfully");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    // 3. Add the Deactivate Function
    const handleDeactivate = async () => {
        const password = prompt("Please enter your password to confirm deactivation:");
        if (!password) return;

        try {
            const { data } = await axios.post(backendUrl + '/api/user/deactivate', { password }, { withCredentials: true });
            if (data.success) {
                setIsLoggedin(false);
                setUserData(false);
                navigate('/');
                toast.warn("Account deleted permanently");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (!userData) return <div className='min-h-screen flex items-center justify-center text-emerald-600 font-bold'>Loading...</div>

    return (
        <div className='min-h-screen bg-emerald-50 flex items-center justify-center p-4'>
            <div className='bg-white p-6 rounded-3xl shadow-xl w-full max-w-2xl border border-emerald-100'>
                
                <div className='flex justify-between items-center mb-6'>
                    <h2 className='text-2xl font-bold text-emerald-800'>Caretaker Professional Profile</h2>
                    <button onClick={() => navigate(-1)} className='text-sm font-semibold text-gray-400 hover:text-emerald-600 transition-all'>← Back</button>
                </div>

                {/* Patient Count Banner */}
                <div className='mb-6 p-4 bg-emerald-800 rounded-2xl text-white flex justify-between items-center'>
                    <div>
                        <p className='text-[10px] font-bold uppercase tracking-wider opacity-80'>Registered Patients</p>
                        <p className='text-xs opacity-70'>Managed under your Caretaker ID</p>
                    </div>
                    <div className='text-3xl font-black px-4'>
                        {userData?.patients ? userData.patients.length : 0}
                    </div>
                </div>

                <div className='space-y-4'>
                    {/* Row 1: Name & Birthday */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className={`p-3 rounded-xl ${isEdit ? 'bg-white ring-2 ring-emerald-400' : 'bg-gray-50'}`}>
                            <p className='text-[10px] font-bold text-emerald-800 uppercase'>Full Name</p>
                            <input type="text" disabled={!isEdit} className='bg-transparent w-full font-bold outline-none' value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className={`p-3 rounded-xl ${isEdit ? 'bg-white ring-2 ring-emerald-400' : 'bg-gray-50'}`}>
                            <p className='text-[10px] font-bold text-emerald-800 uppercase'>Birthday</p>
                            <input type="date" disabled={!isEdit} className='bg-transparent w-full font-bold outline-none' value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} />
                        </div>
                    </div>

                    {/* Row 2: Age (Auto) & Gender */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='bg-emerald-50 p-3 rounded-xl border border-emerald-100'>
                            <p className='text-[10px] font-bold text-emerald-800 uppercase'>Calculated Age (Auto)</p>
                            <p className='font-bold text-emerald-700'>{calculateAge(formData.birthday)} Years</p>
                        </div>
                        <div className={`p-3 rounded-xl ${isEdit ? 'bg-white ring-2 ring-emerald-400' : 'bg-gray-50'}`}>
                            <p className='text-[10px] font-bold text-emerald-800 uppercase'>Gender</p>
                            <select disabled={!isEdit} className='bg-transparent w-full font-bold outline-none' value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Language & Province */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className={`p-3 rounded-xl ${isEdit ? 'bg-white ring-2 ring-emerald-400' : 'bg-gray-50'}`}>
                            <p className='text-[10px] font-bold text-emerald-800 uppercase'>Primary Language</p>
                            <input type="text" disabled={!isEdit} className='bg-transparent w-full font-bold outline-none' value={formData.primaryLanguage} onChange={e => setFormData({...formData, primaryLanguage: e.target.value})} />
                        </div>
                        <div className={`p-3 rounded-xl ${isEdit ? 'bg-white ring-2 ring-emerald-400' : 'bg-gray-50'}`}>
                            <p className='text-[10px] font-bold text-emerald-800 uppercase'>Province</p>
                            <input type="text" disabled={!isEdit} className='bg-transparent w-full font-bold outline-none' value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} />
                        </div>
                    </div>

                    {/* Row 4: City & Service Area */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className={`p-3 rounded-xl ${isEdit ? 'bg-white ring-2 ring-emerald-400' : 'bg-gray-50'}`}>
                            <p className='text-[10px] font-bold text-emerald-800 uppercase'>City</p>
                            <input type="text" disabled={!isEdit} className='bg-transparent w-full font-bold outline-none' value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                        </div>
                        <div className={`p-3 rounded-xl ${isEdit ? 'bg-white ring-2 ring-emerald-400' : 'bg-gray-50'}`}>
                            <p className='text-[10px] font-bold text-emerald-800 uppercase'>Service Area</p>
                            <input type="text" disabled={!isEdit} placeholder="e.g. Elderly Care" className='bg-transparent w-full font-bold outline-none' value={formData.serviceArea} onChange={e => setFormData({...formData, serviceArea: e.target.value})} />
                        </div>
                    </div>

                    {/* Full Address */}
                    <div className={`p-3 rounded-xl ${isEdit ? 'bg-white ring-2 ring-emerald-400' : 'bg-gray-50'}`}>
                        <p className='text-[10px] font-bold text-emerald-800 uppercase'>Full Home Address</p>
                        <input type="text" disabled={!isEdit} className='bg-transparent w-full font-bold outline-none' value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>

                    {/* Skills */}
                    <div className={`p-3 rounded-xl ${isEdit ? 'bg-white ring-2 ring-emerald-400' : 'bg-gray-50'}`}>
                        <p className='text-[10px] font-bold text-emerald-800 uppercase'>Professional Skills</p>
                        <input type="text" disabled={!isEdit} placeholder="e.g. Wound Care, CPR, First Aid" className='bg-transparent w-full font-bold outline-none' value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} />
                    </div>
                </div>

                <div className='mt-8 flex flex-col gap-3'>
                    {!isEdit ? (
                        <button onClick={() => setIsEdit(true)} className='w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all'>Update Profile Details</button>
                    ) : (
                        <div className='flex gap-3'>
                            <button onClick={() => setIsEdit(false)} className='flex-1 bg-gray-100 text-gray-500 py-3 rounded-2xl font-bold'>Cancel</button>
                            <button onClick={handleUpdate} className='flex-[2] bg-emerald-800 text-white py-3 rounded-2xl font-bold shadow-lg'>Save Changes</button>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                <button 
                    onClick={logout}
                    className='w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all border border-slate-200'
                >
                    Logout Account
                </button>

                <button 
                    onClick={handleDeactivate}
                    className='text-rose-500 text-sm font-semibold hover:underline transition-all mt-2'
                >
                    Deactivate Account
                </button>
            </div>
            </div>
        </div>
    )
}

export default CaretakerProfile