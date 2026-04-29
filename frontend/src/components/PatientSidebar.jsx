import React from 'react';
import { NavLink, useParams, Link, useNavigate } from 'react-router-dom';

const PatientSidebar = ({ patientName }) => {
    const { patientId, id } = useParams();
    const navigate = useNavigate();
    const activeId = patientId || id;

    const menu = [
        { name: 'Medical Info', path: `/patient/${activeId}/info`},
        { name: 'Time Allocation', path: `/patient/${activeId}/time`},
        { name: 'Health Notes', path: `/patient/${activeId}/notes`},
        { name: 'Adherence Tracking', path: `/patient/${activeId}/tracking`},
        { name: 'Inventory', path: `/patient/${activeId}/inventory`},
    ];

    return (
        <div className='w-64 bg-white border-r border-emerald-100 flex flex-col p-6'>
            <div className='mb-10'>
                <h2 className='text-emerald-800 font-black text-xl'>Care - Panel</h2>
            </div>

            <nav className='flex-1 space-y-3'>
                {menu.map(item => (
                    <NavLink 
                        to={item.path} 
                        key={item.name}
                        className={({isActive}) => `flex items-center gap-3 p-3 rounded-xl font-medium transition-all ${isActive ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:bg-emerald-50'}`}
                    >
                        {item.name}
                    </NavLink>
                ))}
            </nav>

            <div className='mt-auto pt-6 border-t border-emerald-50 flex flex-col gap-4'>
                <Link 
                    to={`/patient-details/${activeId}`}
                    className='flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50 transition-all cursor-pointer'
                >
                    <div className='w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold'>
                        {patientName?.charAt(0) || 'P'}
                    </div>
                    <div>
                        <p className='text-[10px] font-bold text-emerald-600 uppercase'>Current Patient</p>
                        <p className='text-sm font-bold text-gray-800 truncate w-32'>{patientName || 'Loading...'}</p>
                    </div>
                </Link>

                {/* Logout / Exit Button */}
                <button 
                    onClick={() => navigate('/caretaker-dashboard')}
                    className='w-full py-3 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-all text-sm'
                >
                    Logout to Dashboard
                </button>
            </div>
        </div>
    );
};

export default PatientSidebar;