import React, { useState, useContext, useEffect } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import UserOversight from '../components/UserOversight'
import Analytics from '../components/Analytics'
import SuperAdmin from '../components/SuperAdmin'

const AdminDashboard = () => {
    const navigate = useNavigate()
    const { setIsLoggedin, setUserData, backendUrl } = useContext(AppContent)
    const [activeTab, setActiveTab] = useState('User oversight')
    
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

    useEffect(() => {
        fetchPatients()
    }, [])

    const logout = async () => {
        try {
            axios.defaults.withCredentials = true
            const { data } = await axios.post(backendUrl + '/api/auth/logout')
            if (data.success) {
                setIsLoggedin(false)
                setUserData(false)
                navigate('/')
                toast.success("Logged out successfully")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const menuItems = [
        { name: 'User oversight', icon: assets.person_icon },
        { name: 'Analytic data & monitoring', icon: assets.chart_icon || assets.person_icon },
        { name: 'Super Admin login', icon: assets.lock_icon }
    ]

    return (
        <div className='flex min-h-screen bg-emerald-50'>
            <div className='w-20 sm:w-72 bg-white border-r border-emerald-100 flex flex-col justify-between py-6 shadow-lg fixed h-full z-10'>
                <div>
                    <div 
                        onClick={() => setActiveTab('User oversight')} 
                        className='px-6 mb-10 cursor-pointer flex items-center justify-center sm:justify-start gap-3'
                    >
                        <img src={assets.logo_med} alt="Logo" className='w-10 sm:w-32' />
                    </div>

                    <nav className='space-y-2 px-4'>
                        {menuItems.map((item) => (
                            <div
                                key={item.name}
                                onClick={() => setActiveTab(item.name)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
                                    activeTab === item.name 
                                    ? 'bg-emerald-600 text-white shadow-md' 
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                            >
                                <img 
                                    src={item.icon} 
                                    alt="" 
                                    className={`w-5 ${activeTab === item.name ? 'brightness-0 invert' : ''}`} 
                                />
                                <span className='hidden sm:block font-semibold text-sm text-nowrap'>{item.name}</span>
                            </div>
                        ))}
                    </nav>
                </div>

                <div className='px-4'>
                    <button 
                        onClick={logout}
                        className='w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 font-bold transition-all border border-transparent hover:border-rose-100'
                    >
                        <img src={assets.lock_icon} alt="" className='w-5 opacity-70' />
                        <span className='hidden sm:block'>Logout</span>
                    </button>
                </div>
            </div>

            <div className='flex-1 ml-20 sm:ml-72 p-6 sm:p-10 overflow-y-auto'>
                <header className='flex justify-between items-center mb-8'>
                    <div>
                        <h2 className='text-2xl font-bold text-emerald-900'>{activeTab}</h2>
                        <p className='text-sm text-emerald-600'>Welcome back to the administrative panel.</p>
                    </div>
                    
                    <div className='bg-white px-4 py-2 rounded-full shadow-sm border border-emerald-100 flex items-center gap-2'>
                        <div className='w-2 h-2 bg-emerald-500 rounded-full animate-pulse'></div>
                        <span className='text-xs font-bold text-emerald-700 uppercase tracking-wider text-nowrap'>Admin Active</span>
                    </div>
                </header>

                <div className='bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-100 min-h-[75vh]'>
                    
                    {activeTab === 'User oversight' && (
                        <div className='animate-in fade-in duration-500'>
                            <UserOversight 
                                patients={patients} 
                                fetchPatients={fetchPatients} 
                                loading={loading} 
                            />
                        </div>
                    )}

                    {activeTab === 'Analytic data & monitoring' && (
                        <div className='animate-in slide-in-from-bottom-4 duration-500'>
                            <Analytics patients={patients} fetchPatients={fetchPatients} />
                        </div>
                    )}

                    {activeTab === 'Super Admin login' && (
                        <div className='w-full lg:max-w-[99.5%] ml-0 py-10 px-8'>
                            <SuperAdmin backendUrl={backendUrl} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard