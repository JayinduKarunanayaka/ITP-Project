import React, { useContext, useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const Login = () => {

    const navigate = useNavigate()
    const location = useLocation()

    const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContent)

    const [state, setState] = useState('Sign Up')

    useEffect(() => {
        if (location.state && location.state.initialMode) {
            setState(location.state.initialMode)
        }
    }, [location])

    const [name, setName] = useState('')
    const [birthday, setBirthday] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    
    // Updated: loginRole is now used for both Login and Sign Up
    const [loginRole, setLoginRole] = useState('Patient');

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            axios.defaults.withCredentials = true

            if (state === 'Sign Up') {
                // Updated: Added 'role' to the registration payload
                const { data } = await axios.post(backendUrl + '/api/auth/register', { 
                    name, 
                    birthday, 
                    email, 
                    password, 
                    role: loginRole 
                })

                if (data.success) {
                    setIsLoggedin(true)
                    await getUserData();
                    // Conditional navigation based on role
                    if (loginRole === 'Caretaker') {
                        navigate('/medication')
                    } else {
                        navigate('/medication')
                    }
                } else {
                    toast.error(data.message)
                }
            } else {
                // Login Logic
                const { data } = await axios.post(backendUrl + '/api/auth/login', { email, password })

                if (data.success) {
                    setIsLoggedin(true)
                    await getUserData();
                    
                    // Role-based redirection
                    if (loginRole === 'Admin') {
                        navigate('/admin-dashboard')
                    } else if (loginRole === 'Caretaker') {
                        navigate('/medication')
                    } else {
                        navigate('/medication')
                    }
                } else {
                    toast.error(data.message)
                }
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <div className='flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-emerald-50 to-teal-100'>
            <img onClick={() => navigate('/')} src={assets.logo_med} alt="" className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer' />
            <div className='bg-white p-10 rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-md text-emerald-800 transition-all'>
                <h2 className='text-3xl font-extrabold text-center mb-3'>
                    {state === 'Sign Up' ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className='text-center text-sm mb-6 text-gray-500'>
                    {state === 'Sign Up' ? 'Join MedSync to manage your health' : `Login as ${loginRole} to your account`}
                </p>

                {/* Role Selector UI */}
                <div className='flex justify-center gap-4 mb-6 p-1 bg-emerald-50 rounded-xl'>
                    {['Patient', 'Caretaker', ...(state === 'Login' ? ['Admin'] : [])].map((role) => (
                        <button
                            key={role}
                            onClick={() => setLoginRole(role)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                loginRole === role 
                                ? 'bg-emerald-600 text-white shadow-md' 
                                : 'text-emerald-600 hover:bg-emerald-100'
                            }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>

                <form onSubmit={onSubmitHandler}>
                    {state === 'Sign Up' && (
                        <>
                            <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100'>
                                <img src={assets.person_icon} alt="" className='w-4' />
                                <input onChange={e => setName(e.target.value)} value={name} className='bg-transparent outline-none w-full text-gray-700' type="text" placeholder="Full Name" required />
                            </div>
                            <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100'>
                                <input onChange={e => setBirthday(e.target.value)} value={birthday} className='bg-transparent outline-none w-full text-gray-700 text-sm' type="date" required />
                            </div>
                        </>
                    )}

                    <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100'>
                        <img src={assets.mail_icon} alt="" className='w-4' />
                        <input onChange={e => setEmail(e.target.value)} value={email} className='bg-transparent outline-none w-full text-gray-700' type="email" placeholder="Email Address" required />
                    </div>
                    <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100'>
                        <img src={assets.lock_icon} alt="" className='w-4' />
                        <input onChange={e => setPassword(e.target.value)} value={password} className='bg-transparent outline-none w-full text-gray-700' type="password" placeholder="Password" required />
                    </div>

                    {state === 'Login' && (
                        <p onClick={() => navigate('/reset-password')} className='text-xs text-emerald-600 mb-6 cursor-pointer hover:underline'>
                            Forgot password?
                        </p>
                    )}

                    <button className={`w-full py-3 rounded-xl text-white font-bold text-lg transition-all shadow-lg ${
                        loginRole === 'Admin' && state === 'Login' 
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                    }`}>
                        {state === 'Login' ? `Login as ${loginRole}` : 'Create Account'}
                    </button>
                </form>

                <p className='text-gray-500 text-center text-xs mt-6'>
                    {state === "Sign Up" ? (
                        <>
                            Already have an account?{' '}
                            <span onClick={() => setState('Login')} className='text-emerald-600 font-bold cursor-pointer hover:underline'>
                                Login here
                            </span>
                        </>
                    ) : (
                        <>
                            Don't have an account?{' '}
                            <span onClick={() => {setState('Sign Up'); setLoginRole('Patient');}} className='text-emerald-600 font-bold cursor-pointer hover:underline'>
                                Sign Up here
                            </span>
                        </>
                    )}
                </p>
            </div>
        </div>
    )
}

export default Login