import React, { useContext } from 'react'
import { AppContent } from '../context/AppContext'
import { useNavigate, NavLink } from 'react-router-dom'
import { assets } from '../assets/assets' 

const Home = () => {
    const { userData } = useContext(AppContent) 
    const navigate = useNavigate() 

    // Menu items for the patient sidebar
    const menuItems = [
        { name: 'Medication', path: '/medication', icon: assets.menu_icon },
        { name: 'Time Allowcation', path: '/time', icon: assets.menu_icon },
        { name: 'Health Notes', path: '/notes', icon: assets.menu_icon },
        { name: 'Tracking', path: '/tracking', icon: assets.menu_icon },
        { name: 'Inventory', path: '/inventory', icon: assets.menu_icon },
        
    ];

    const handleProfileClick = () => {
        const role = userData?.role?.toLowerCase();
        if (role === 'caretaker') {
            navigate('/caretaker-profile');
        } else {
            navigate('/profile');
        }
    };

    return (
        <div className='flex min-h-screen bg-emerald-50'>
            
            {/* --- SIMPLE SIDEBAR --- */}
            <div className='w-64 bg-white border-r border-emerald-100 flex flex-col p-6 shadow-sm'>
                <div className='mb-10'>
                    <h2 className='text-emerald-800 font-black text-xl'>Care - Panel</h2>
                </div>

                {/* Main Navigation */}
                <nav className='flex-1 space-y-2'>
                    {menuItems.map((item) => (
                        <NavLink 
                            to={item.path} 
                            key={item.name}
                            className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl font-medium transition-all ${isActive ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-emerald-50'}`}
                        >
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                {/* --- BOTTOM PROFILE SECTION --- */}
                <div className='mt-auto pt-6 border-t border-emerald-50 flex flex-col gap-4'>
                    
                    {/* Only show "Patients" button if user is a Caretaker viewing this portal */}
                    {userData?.role?.toLowerCase() === 'caretaker' && (
                        <button 
                            onClick={() => navigate('/caretaker-dashboard')}
                            className='flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 py-2 rounded-xl font-bold text-xs hover:bg-emerald-200 transition-all'
                        >
                            Back to Patients
                        </button>
                    )}

                    {/* Profile Link */}
                    <div 
                        onClick={handleProfileClick}
                        className='flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50 transition-all cursor-pointer group'
                    >
                        <img 
                            src={userData?.image ? userData.image : assets.Profile_img} 
                            alt="Profile"
                            className='w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover group-hover:scale-105 transition-transform'
                        />
                        <div className='overflow-hidden'>
                            <p className='text-[10px] font-bold text-emerald-600 uppercase tracking-wider'>Profile</p>
                            <p className='text-sm font-bold text-gray-800 truncate w-32'>{userData?.name || 'User'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <main className='flex-1 flex flex-col items-center justify-center text-center p-8'>
                <div className='bg-white p-12 rounded-[3rem] shadow-xl border border-emerald-100 max-w-lg w-full'>
                    <h1 className='text-4xl font-black text-emerald-900'>
                        {userData?.role?.toLowerCase() === 'caretaker' ? 'Caretaker Portal' : 'Patient Portal'}
                    </h1>
                    <p className='text-emerald-600 font-medium mt-4 text-lg'>
                        Welcome back, <span className='font-bold text-gray-800'>{userData?.name || 'User'}</span>!
                    </p>
                    
                </div>
            </main>
        </div>
    )
}

export default Home