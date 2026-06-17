import React, { useContext, useState, useEffect } from 'react'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
    const { userData, backendUrl, getUserData, setIsLoggedin, setUserData } = useContext(AppContent)
    const navigate = useNavigate()
    
    const [isEdit, setIsEdit] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        birthday: '',
        gender: '',
        height: '',
        weight: '',
        primaryLanguage: '',
        insuranceProvider: '',
        pharmacyNumber: '',
        emergencyContact: ''
    })

    useEffect(() => {
        getUserData();
    }, [])

    useEffect(() => {
        if (userData) {
            setFormData({
                name: userData.name || '',
                birthday: userData.birthday || '',
                gender: userData.gender || '',
                height: userData.height || '',
                weight: userData.weight || '',
                primaryLanguage: userData.primaryLanguage || '',
                insuranceProvider: userData.insuranceProvider || '',
                pharmacyNumber: userData.pharmacyNumber || '',
                emergencyContact: userData.emergencyContact || ''
            })
        }
    }, [userData])

    const sendOtpHandler = async () => {
        try {
            axios.defaults.withCredentials = true;
            const token = localStorage.getItem('med_app_auth_token') || '';
            const { data } = await axios.post(backendUrl + '/api/auth/send-verify-otp', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                navigate('/email-verify');
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const logout = async () => {
        try {
            axios.defaults.withCredentials = true;
            const { data } = await axios.post(backendUrl + '/api/auth/logout')
            
            if (data.success) {
                setIsLoggedin(false)
                setUserData(false)
                toast.success("Logged out successfully")
                navigate('/')
            }
        } catch (error) {
            toast.error(error.message)
        }
    }
    
    const handleUpdate = async () => {
        const nameRegex = /^[A-Za-z\s]+$/;
        const phoneRegex = /^\+?[0-9]+$/;

        if (!formData.name.trim()) {
            return toast.error("Name is required");
        } else if (!nameRegex.test(formData.name)) {
            return toast.error("Name can only contain letters and spaces");
        }

        if (formData.birthday) {
            const birthDate = new Date(formData.birthday);
            if (birthDate > new Date()) {
                return toast.error("Birthday cannot be in the future");
            }
        }

        if (formData.weight && (formData.weight <= 0 || formData.weight > 500)) {
            return toast.error("Please enter a realistic weight in kg");
        }
        if (formData.height && (formData.height <= 0 || formData.height > 10)) {
            return toast.error("Please enter a realistic height in feet");
        }

        if (formData.pharmacyNumber && !phoneRegex.test(formData.pharmacyNumber)) {
            return toast.error("Pharmacy number must be numeric");
        }
        if (formData.emergencyContact && !phoneRegex.test(formData.emergencyContact)) {
            return toast.error("Emergency contact must be numeric");
        }

        try {
            axios.defaults.withCredentials = true;
            const token = localStorage.getItem('med_app_auth_token') || '';
            const { data } = await axios.post(backendUrl + '/api/user/update-data', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                toast.success(data.message)
                setIsEdit(false)
                getUserData()
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleDeactivate = async () => {
        const password = prompt("Enter password to delete account:")
        if (!password) return

        try {
            axios.defaults.withCredentials = true;
            const token = localStorage.getItem('med_app_auth_token') || '';
            const { data } = await axios.post(backendUrl + '/api/user/deactivate', { password }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                toast.success("Account deleted")
                setIsLoggedin(false)
                setUserData(false)
                navigate('/')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error("Delete failed")
        }
    }

    if (!userData) {
        return (
            <div className='min-h-screen bg-emerald-50 flex items-center justify-center'>
                <div className='text-emerald-600 font-bold animate-pulse'>Loading Profile...</div>
            </div>
        )
    }

   return (
        <div className='min-h-screen bg-emerald-50 flex items-center justify-center p-6'>
            <div className='bg-white p-7 rounded-2xl shadow-lg w-full max-w-lg border border-emerald-100'>
                
                <div className='flex justify-between items-start mb-6'>
                    <div>
                        <h2 className='text-2xl font-bold text-emerald-700'>User Profile</h2>
                        {userData.isAccountVerified ? (
                            <p className='text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 w-fit'>✓ VERIFIED ACCOUNT</p>
                        ) : (
                            <button onClick={sendOtpHandler} className='text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-1 hover:bg-red-100 transition-all'>⚠ VERIFY ACCOUNT NOW</button>
                        )}
                    </div>
                    <button onClick={() => navigate('/medication')} className='text-sm text-gray-500 hover:text-emerald-600'>← Back</button>
                </div>
                
                <div className='space-y-4 text-gray-700'>
                    <div className={`p-3 rounded-xl transition-all ${isEdit ? 'bg-white ring-2 ring-emerald-50 border border-emerald-400' : 'bg-gray-50'}`}>
                        <p className='text-xs font-bold text-emerald-800 uppercase'>Name</p>
                        <input 
                            type="text" 
                            disabled={!isEdit} 
                            className='bg-transparent w-full font-semibold outline-none' 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value.replace(/[^A-Za-z\s]/g, '')})} 
                        />
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        <div className={`p-3 rounded-xl transition-all ${isEdit ? 'bg-white ring-2 ring-emerald-50 border border-emerald-400' : 'bg-gray-50'}`}>
                            <p className='text-xs font-bold text-emerald-800 uppercase'>Birthday</p>
                            <input type="date" disabled={!isEdit} className='bg-transparent w-full font-medium outline-none' value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} />
                        </div>
                        <div className='bg-gray-100 p-3 rounded-xl'>
                            <p className='text-xs font-bold text-gray-400 uppercase'>Age (Auto)</p>
                            <p className='font-medium text-gray-500'>{userData.age} Years</p>
                        </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        <div className={`p-3 rounded-xl transition-all ${isEdit ? 'bg-white ring-2 ring-emerald-50 border border-emerald-400' : 'bg-gray-50'}`}>
                            <p className='text-xs font-bold text-emerald-800 uppercase'>Gender</p>
                            <select disabled={!isEdit} className='bg-transparent w-full font-medium outline-none' value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                            <div className={`p-3 rounded-xl transition-all ${isEdit ? 'bg-white ring-2 ring-emerald-50 border border-emerald-400' : 'bg-gray-50'}`}>
                                <p className='text-xs font-bold text-emerald-800 uppercase'>Weight (kg)</p>
                                <input 
                                    type="number" 
                                    min="0"
                                    disabled={!isEdit} 
                                    className='bg-transparent w-full font-medium outline-none' 
                                    value={formData.weight} 
                                    onChange={e => setFormData({...formData, weight: e.target.value})} 
                                />
                            </div>

                            <div className={`p-3 rounded-xl transition-all ${isEdit ? 'bg-white ring-2 ring-emerald-50 border border-emerald-400' : 'bg-gray-50'}`}>
                                <p className='text-xs font-bold text-emerald-800 uppercase'>Height (ft)</p>
                                <input 
                                    type="number" 
                                    min="0"
                                    disabled={!isEdit} 
                                    className='bg-transparent w-full font-medium outline-none' 
                                    value={formData.height} 
                                    onChange={e => setFormData({...formData, height: e.target.value})} 
                                />
                            </div>
                    </div>

                    <div className={`p-3 rounded-xl transition-all ${isEdit ? 'bg-white ring-2 ring-emerald-50 border border-emerald-400' : 'bg-gray-50'}`}>
                        <p className='text-xs font-bold text-emerald-800 uppercase'>Insurance Provider</p>
                        <input type="text" disabled={!isEdit} className='bg-transparent w-full font-medium outline-none' value={formData.insuranceProvider} onChange={e => setFormData({...formData, insuranceProvider: e.target.value})} />
                    </div>

                    <div className='mt-4 space-y-4'>
                        <div className={`p-3 rounded-xl transition-all ${isEdit ? 'bg-white ring-2 ring-emerald-50 border border-emerald-400' : 'bg-gray-50'}`}>
                            <p className='text-xs font-bold text-emerald-800 uppercase'>Pharmacy Number</p>
                            <input 
                                type="tel" 
                                disabled={!isEdit} 
                                className='bg-transparent w-full font-medium outline-none' 
                                value={formData.pharmacyNumber} 
                                onChange={e => setFormData({...formData, pharmacyNumber: e.target.value.replace(/[^0-9+]/g, '')})} 
                            />
                        </div>
                        <div className={`p-3 rounded-xl transition-all ${isEdit ? 'bg-white ring-2 ring-emerald-50 border border-emerald-400' : 'bg-gray-50'}`}>
                            <p className='text-xs font-bold text-emerald-800 uppercase'>Emergency Contact</p>
                            <input 
                                type="tel" 
                                disabled={!isEdit} 
                                className='bg-transparent w-full font-medium outline-none' 
                                value={formData.emergencyContact} 
                                onChange={e => setFormData({...formData, emergencyContact: e.target.value.replace(/[^0-9+]/g, '')})} 
                            />
                        </div>
                    </div>
                </div>

                <div className='mt-8 space-y-3'>
                    {!isEdit ? (
                        <button onClick={() => setIsEdit(true)} className='w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100'>Update Details</button>
                    ) : (
                        <button onClick={handleUpdate} className='w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all'>Save Details</button>
                    )}
                    <button onClick={logout} className='w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-black transition-all'>Logout</button>
                    <button onClick={handleDeactivate} className='w-full text-red-500 py-2 text-sm font-semibold hover:underline transition-all mt-2'>Delete Account</button>
                </div>
            </div>
        </div>
    )
}

export default Profile