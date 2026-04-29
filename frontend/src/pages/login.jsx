import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { createMobileLinkCode, forwardSessionToMobile, persistWebAuthSession } from '../services/api'

const Login = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContent)

    const [state, setState] = useState(location.state?.initialMode || 'Sign Up')

    const [name, setName] = useState('')
    const [birthday, setBirthday] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loginRole, setLoginRole] = useState('Patient')
    

    const [errors, setErrors] = useState({})

    const syncSessionToMobile = async (data) => {
        if (!data?.success || !data?.token || !data?.user?._id) return;

        persistWebAuthSession({ token: data.token, user: data.user });
        const bridgeResult = await forwardSessionToMobile({ token: data.token, user: data.user });

        if (!bridgeResult.success) {
            console.warn('Mobile session forward failed:', bridgeResult.message);
        }

        const linkResult = await createMobileLinkCode();
        if (linkResult?.success && linkResult?.linkCode) {
            const deepLink = `medmobile://link?code=${linkResult.linkCode}`;
            toast.success(
                <div className='text-center'>
                    <p className='font-semibold'>Scan to link mobile app</p>
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(deepLink)}`}
                        alt='Mobile link QR'
                        className='mx-auto my-2 h-36 w-36 rounded bg-white p-1'
                    />
                    <p className='text-xs font-bold tracking-wide'>{linkResult.linkCode}</p>
                </div>,
                {
                autoClose: 12000,
            });
        } else if (linkResult?.message) {
            console.warn('Link code generation failed:', linkResult.message);
        }
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        const nameRegex = /^[A-Za-z\s]+$/;

        if (state === 'Sign Up') {
            if (!name.trim()) {
                newErrors.name = "Full name is required";
            } else if (!nameRegex.test(name)) {
                newErrors.name = "Name can only contain letters and spaces";
            }
            if (!birthday) {
                newErrors.birthday = "Birthday is required";
            } else {
                const birthDate = new Date(birthday);
                if (birthDate > new Date()) newErrors.birthday = "Birthday cannot be in the future";
            }
        }

        if (!email) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(email)) {
            newErrors.email = "Invalid email format";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        } else if (!passwordRegex.test(password)) {
            newErrors.password = "Must include uppercase, lowercase, and a number";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) return;

        try {
            axios.defaults.withCredentials = true

            if (state === 'Sign Up') {
                const { data } = await axios.post(backendUrl + '/api/auth/register', {
                    name,
                    birthday,
                    email,
                    password,
                    role: loginRole
                })

                if (data.success) {
                    await syncSessionToMobile(data)
                    setIsLoggedin(true)
                    await getUserData();

                    const currentRole = data.role || loginRole;

                    if (currentRole === 'Admin') {
                        navigate('/admin-dashboard');
                    } else if (currentRole === 'Caretaker') {
                        navigate('/caretaker-dashboard');
                    } else {
                        navigate('/medication');
                    }
                } else {
                    toast.error(data.message)
                }
            } else {
                const { data } = await axios.post(backendUrl + '/api/auth/login', { email, password })

                if (data.success) {
                    await syncSessionToMobile(data)
                    setIsLoggedin(true)
                    await getUserData()

                    if (data.role === 'Admin') {
                        navigate('/admin-dashboard')
                    } else if (data.role === 'Caretaker') {
                        navigate('/caretaker-dashboard')
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
                    {state === 'Sign Up' ? 'Join MedSync to manage your health' : `Login to your account`}
                </p>

                {/* <div className='flex justify-center gap-4 mb-6 p-1 bg-emerald-50 rounded-xl'>
                    {['Patient', 'Caretaker', ...(state === 'Login' ? ['Admin'] : [])].map((role) => (
                        <button
                            key={role}
                            onClick={() => { setLoginRole(role); setErrors({}); }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                loginRole === role
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-emerald-600 hover:bg-emerald-100'
                            }`}
                        >
                            {role}
                        </button>
                    ))}
                </div> */}

                <form onSubmit={onSubmitHandler} noValidate>
                    {state === 'Sign Up' && (
                        <>
                            <div className={`mb-3 flex items-center gap-3 w-full px-5 py-2.5 rounded-xl bg-emerald-50 border ${errors.name ? 'border-red-400' : 'border-emerald-100'}`}>
                                <img src={assets.person_icon} alt="" className='w-4' />
                                <input onChange={e => setName(e.target.value)} value={name} className='bg-transparent outline-none w-full text-gray-700' type="text" placeholder="Full Name" />
                            </div>
                            {errors.name && <p className='text-red-500 text-[10px] mb-3 ml-2'>{errors.name}</p>}

                            <div className={`mb-3 flex items-center gap-3 w-full px-5 py-2.5 rounded-xl bg-emerald-50 border ${errors.birthday ? 'border-red-400' : 'border-emerald-100'}`}>
                                <input onChange={e => setBirthday(e.target.value)} value={birthday} className='bg-transparent outline-none w-full text-gray-700 text-sm' type="date" />
                            </div>
                            {errors.birthday && <p className='text-red-500 text-[10px] mb-3 ml-2'>{errors.birthday}</p>}
                        </>
                    )}

                    <div className={`mb-3 flex items-center gap-3 w-full px-5 py-2.5 rounded-xl bg-emerald-50 border ${errors.email ? 'border-red-400' : 'border-emerald-100'}`}>
                        <img src={assets.mail_icon} alt="" className='w-4' />
                        <input onChange={e => setEmail(e.target.value)} value={email} className='bg-transparent outline-none w-full text-gray-700' type="email" placeholder="Email Address" />
                    </div>
                    {errors.email && <p className='text-red-500 text-[10px] mb-3 ml-2'>{errors.email}</p>}

                    <div className={`mb-1 flex items-center gap-3 w-full px-5 py-2.5 rounded-xl bg-emerald-50 border ${errors.password ? 'border-red-400' : 'border-emerald-100'}`}>
                        <img src={assets.lock_icon} alt="" className='w-4' />
                        <input onChange={e => setPassword(e.target.value)} value={password} className='bg-transparent outline-none w-full text-gray-700' type="password" placeholder="Password" />
                    </div>
                    {errors.password && <p className='text-red-500 text-[10px] mb-3 ml-2'>{errors.password}</p>}

                    {state === 'Login' && (
                        <p onClick={() => navigate('/reset-password')} className='text-xs text-emerald-600 mb-4 mt-2 cursor-pointer hover:underline'>
                            Forgot password?
                        </p>
                    )}

                    <button type="submit" className={`w-full py-3 mt-2 rounded-xl text-white font-bold text-lg transition-all shadow-lg ${
                        loginRole === 'Admin' && state === 'Login'
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-100'
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                    }`}>
                        {state === 'Login' ? `Login` : 'Create Account'}
                    </button>
                </form>

                <p className='text-gray-500 text-center text-xs mt-6'>
                    {state === "Sign Up" ? (
                        <>
                            Already have an account?{' '}
                            <span onClick={() => { setState('Login'); setErrors({}); }} className='text-emerald-600 font-bold cursor-pointer hover:underline'>
                                Login here
                            </span>
                        </>
                    ) : (
                        <>
                            Don't have an account?{' '}
                            <span onClick={() => { setState('Sign Up'); setLoginRole('Patient'); setErrors({}); }} className='text-emerald-600 font-bold cursor-pointer hover:underline'>
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