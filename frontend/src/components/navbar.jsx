import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContext'

const navbar = () => {
    const navigate = useNavigate()

  return (
    <nav className='w-full fixed top-0 left-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-md'>
      <div className='flex items-center justify-between px-6 py-4 sm:px-24'>
        
        <div className='flex-1 flex justify-start'>
            <img 
                onClick={() => navigate('/')} 
                src={assets.logo_med} 
                alt="MedSync Logo" 
                className='w-28 sm:w-32 cursor-pointer'
            />
        </div>  
                <ul className='hidden md:flex items-center gap-10 text-gray-700 font-medium'>
                    <li 
                        onClick={() => document.getElementById('header-section').scrollIntoView({ behavior: 'smooth' })}
                        className='hover:text-emerald-600 cursor-pointer transition-all'>
                        About
                    </li>
                    <li 
                        onClick={() => document.getElementById('features-section').scrollIntoView({ behavior: 'smooth' })}
                        className='hover:text-emerald-600 cursor-pointer transition-all'>
                        Features
                    </li>
                    <li 
                        onClick={() => document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' })}
                        className='hover:text-emerald-600 cursor-pointer transition-all'>
                        Contact Us
                    </li>
                </ul>

                <div className='flex-1 flex justify-end'>
                    <button 
                        onClick={() => navigate('/login',{ state: { initialMode: 'Login' }})} 
                        className='flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm'>
                        Login 
                        <img src={assets.arrow_icon} alt="" className='w-3 brightness-0 invert' />
                    </button>
                </div>        
      </div>
    </nav>
  )
}

export default navbar
