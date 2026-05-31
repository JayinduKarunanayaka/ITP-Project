import React, { useContext } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AppContent } from './context/AppContext';
import Home from './pages/home.jsx';
import Login from './pages/login.jsx';
import Emailverify from './pages/emailverify.jsx';
import ResetPassword from './pages/resetPassword.jsx';
import Medication from './pages/medication.jsx';
import TimeAllocation from './pages/TimeAllocation.jsx';
import Tracking from './pages/Tracking.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Profile from './pages/profile.jsx';
import AdminDashboard from './pages/adminDashboard.jsx';
import CaretakerDashboard from './pages/CaretakerDashboard.jsx';
import PatientDetails from './pages/PatientDetails.jsx';
import CaretakerProfile from './pages/CaretakerProfile.jsx';

//--- schedule section imports ---
import AddMedForm from "./schedule/components/AddMedForm.jsx";
import MedList from "./schedule/components/MedList.jsx";
import PatientCards from "./schedule/components/PatientCards.jsx";


// --- PATIENT SECTION IMPORTS ---
import PatientInfo from './pages/PatientInfo.jsx';
import PatientInventory from './pages/PatientInventory.jsx';
import PatientTime from './pages/PatientTime.jsx';
import PatientNotes from './pages/PatientNotes.jsx';
import PatientTracking from './pages/PatientTracking.jsx';
import Inventory from './pages/Inventory.jsx';
import InventoryMedications from './pages/InventoryMedications.jsx';
import InventoryPrescriptions from './pages/InventoryPrescriptions.jsx';


const App = () => {
  const { userData } = useContext(AppContent);

  return (
    <div>
      <ToastContainer />
      <Routes>
        {/* Public & General Routes */}
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/email-verify' element={<Emailverify />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/medication' element={<Medication />} />
        <Route path='/time' element={<TimeAllocation />} />
        <Route path='/tracking' element={<Tracking />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/inventory' element={<Inventory />} />
        <Route path='/inventory/medications' element={<InventoryMedications />} />
        <Route path='/inventory/prescriptions' element={<InventoryPrescriptions />} />

        {/* Role Based Dashboards */}
        <Route
          path='/admin-dashboard'
          element={userData?.role === 'Admin' ? <AdminDashboard /> : <Navigate to='/login' />}
        />

        <Route
          path='/caretaker-dashboard'
          element={userData?.role === 'Caretaker' ? <CaretakerDashboard /> : <Navigate to='/login' />}
        />

        <Route path='/caretaker-profile' element={<CaretakerProfile />} />

        {/* --- Standardized Patient Routes --- */}
        <Route path='/patient/:patientId/info' element={<PatientInfo />} />
        <Route path='/patient/:patientId/time' element={<PatientTime />} />
        <Route path='/patient/:patientId/notes' element={<PatientNotes />} />
        <Route path='/patient/:patientId/tracking' element={<PatientTracking />} />
        <Route path='/patient/:patientId/inventory' element={<PatientInventory />} />
        <Route path='/patient/:patientId/inventory/medications' element={<InventoryMedications />} />
        <Route path='/patient/:patientId/inventory/prescriptions' element={<InventoryPrescriptions />} />

        {/* Standardized Profile Routes to use :patientId */}
        <Route path='/patient-details/:patientId' element={<PatientDetails />} />
        <Route path='/patient/:patientId/profile' element={<PatientDetails />} />


      </Routes>
    </div>
  );
};

export default App;