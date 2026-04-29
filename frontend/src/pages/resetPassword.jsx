import React, { useState, useContext, useRef } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const ResetPassword = () => {
    const { backendUrl } = useContext(AppContent);
    axios.defaults.withCredentials = true;

    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [isOtpSubmitted, setIsOtpSubmitted] = useState(false);

    const inputRefs = useRef([])

    const handleInput = (e, index) => {
        if (e.target.value.length > 0 && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    }

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    }

    const onSubmitEmail = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(backendUrl + '/api/auth/send-reset-otp', { email })
            if (data.success) {
                toast.success(data.message)
                setIsEmailSent(true)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const onSubmitOtp = async (e) => {
        e.preventDefault();
        const otpArray = inputRefs.current.map(e => e.value)
        setOtp(otpArray.join(''))
        setIsOtpSubmitted(true)
    }

    const onSubmitNewPassword = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(backendUrl + '/api/auth/reset-password', { email, otp, newPassword })
            if (data.success) {
                toast.success(data.message)
                navigate('/login')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    return (
        <div className='flex items-center justify-center min-h-screen px-6 bg-emerald-50'>
            <img
                onClick={() => navigate('/')}
                src={assets.logo_med}
                alt="MedSync Logo"
                className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer'
            />

            {!isEmailSent &&
                <form onSubmit={onSubmitEmail} className='bg-white p-10 rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-md text-emerald-800 text-center'>
                    <h1 className='text-3xl font-bold mb-3'>Reset Password</h1>
                    <p className='text-sm mb-6 text-gray-500'>Enter your registered email address</p>

                    <div className='mb-6 flex items-center gap-3 w-full px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100'>
                        <img src={assets.mail_icon} alt="" className='w-4' />
                        <input
                            type="email"
                            placeholder='Email Address'
                            className='bg-transparent outline-none w-full text-gray-700'
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button className='w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100'>
                        Send Reset Link
                    </button>
                </form>
            }

            {!isOtpSubmitted && isEmailSent &&
                <form onSubmit={onSubmitOtp} className='bg-white p-10 rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-md text-emerald-800 text-center'>
                    <h2 className='text-3xl font-bold mb-3'>Verify OTP</h2>
                    <p className='text-sm mb-8 text-gray-500'>Enter the 6-digit code sent to your email.</p>

                    <div className='flex justify-between mb-8' onPaste={(e) => {
                        const paste = e.clipboardData.getData('text').slice(0, 6).split('');
                        paste.forEach((char, index) => { if (inputRefs.current[index]) inputRefs.current[index].value = char });
                    }}>
                        {Array(6).fill(0).map((_, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength='1'
                                required
                                ref={e => inputRefs.current[index] = e}
                                onInput={(e) => handleInput(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                className='w-12 h-14 bg-emerald-50 border border-emerald-100 text-emerald-800 text-center text-2xl font-bold rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all'
                            />
                        ))}
                    </div>

                    <button className='w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100'>
                        Verify OTP
                    </button>
                </form>
            }

            {isOtpSubmitted && isEmailSent &&
                <form onSubmit={onSubmitNewPassword} className='bg-white p-10 rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-md text-emerald-800 text-center'>
                    <h1 className='text-3xl font-bold mb-3'>New Password</h1>
                    <p className='text-sm mb-6 text-gray-500'>Enter your new password below</p>

                    <div className='mb-6 flex items-center gap-3 w-full px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100'>
                        <img src={assets.lock_icon} alt="" className='w-4' />
                        <input
                            type="password"
                            placeholder='New Password'
                            className='bg-transparent outline-none w-full text-gray-700'
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button className='w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100'>
                        Update Password
                    </button>
                </form>
            }
        </div>
    )
}

export default ResetPassword