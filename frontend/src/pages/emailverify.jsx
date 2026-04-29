import React, { useContext, useEffect } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const EmailVerify = () => {
    axios.defaults.withCredentials = true;
    const navigate = useNavigate()
    const { backendUrl, isLoggedin, userData, getUserData } = useContext(AppContent)

    const inputRefs = React.useRef([])

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

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            const otpArray = inputRefs.current.map(e => e.value)
            const otp = otpArray.join('')

            const { data } = await axios.post(backendUrl + '/api/auth/verify-account', { otp })

            if (data.success) {
                toast.success(data.message)
                getUserData()
                navigate('/profile')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (isLoggedin && userData && userData.isAccountVerified) {
            navigate('/profile')
        }
    }, [isLoggedin, userData])

    return (
        <div className='flex items-center justify-center min-h-screen px-6 bg-emerald-50'>
            <img 
                onClick={() => navigate('/')} 
                src={assets.logo_med} 
                alt="MedSync" 
                className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer' 
            />

            <form onSubmit={onSubmitHandler} className='bg-white p-10 rounded-3xl shadow-2xl border border-emerald-100 w-full max-w-md text-emerald-800 text-center'>
                <h2 className='text-3xl font-bold mb-3'>Verify Account</h2>
                <p className='text-sm mb-8 text-gray-500'>Enter the 6-digit code sent to your email.</p>
                
                <div className='flex justify-between mb-8' onPaste={(e) => {
                    const paste = e.clipboardData.getData('text').slice(0,6).split('');
                    paste.forEach((char, index) => { if(inputRefs.current[index]) inputRefs.current[index].value = char });
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
                    Verify Email
                </button>
            </form>
        </div>
    )
}

export default EmailVerify