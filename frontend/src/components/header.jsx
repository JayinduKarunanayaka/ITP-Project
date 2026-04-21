import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'

const header = () => {

    const navigate = useNavigate();

  return (
    <div id='header-section' className='flex flex-col items-center mt-20 px-4 text-center'>
        
        <div className='relative'>
            <div className='absolute inset-0 bg-green-200 blur-3xl rounded-full opacity-30 -z-10'></div>
            <img src={assets.header_img} alt="Health Assistant" className='w-36 h-36 rounded-full mb-6 shadow-xl border-4 border-white'/>
        </div>

        <h1 className='flex items-center gap-2 text-xl md:text-2xl font-medium text-gray-700 mb-2'>
            Hey there! <img src={assets.hand_wave} alt="" className='w-8 aspect-square'/>
        </h1>

        <h2 className="text-3xl sm:text-6xl font-extrabold mb-6 text-emerald-600 tracking-tight">
            Stay On Track with MedSync
        </h2>

        <p className="mb-10 max-w-lg text-gray-600 text-lg leading-relaxed">
            A simple, accessible platform designed to help you manage daily medications, 
            track adherence rates, and receive smart refill reminders. 
        </p>

        <button 
            onClick={() => navigate('/login')}
            className="bg-emerald-600 text-white border-2 border-emerald-600 rounded-full px-10 py-3 text-lg font-semibold hover:bg-transparent hover:text-emerald-700 transition-all shadow-lg shadow-emerald-100">
            Start Tracking Now
        </button>

        <div className='mt-12 flex flex-wrap justify-center gap-6 text-sm font-medium'>
            <span className='flex items-center gap-1 text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full'>
                Adherence Reports
            </span>
            <span className='flex items-center gap-1 text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full'>
                Refill Alerts
            </span>
            <span className='flex items-center gap-1 text-emerald-700 bg-emerald-50 px-4 py-1.5 rounded-full'>
                Simplified Interface 
            </span>
        </div>
    </div>
  )
}

export default header
