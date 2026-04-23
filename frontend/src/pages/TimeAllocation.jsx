import React from 'react';
import LoggedIn from '../components/loggedin';
import Scheduler from './Scheduler';

const TimeAllocation = () => {
    return (
        <LoggedIn>
            <div className="max-w-5xl mx-auto w-full">
                <div className="mb-8 border-b border-emerald-100 pb-6">
                    <h1 className="text-3xl sm:text-4xl font-black text-emerald-900">Time Allocation</h1>
                    <p className="text-emerald-700 mt-2 text-sm sm:text-base">Manage your schedule and time correctly.</p>
                </div>

                {/* No patientId prop here: Scheduler will show manual box for caretaker flows,
                    but for logged-in patient portal we want to show THEIR own meds.
                    So we update Scheduler to treat empty prop as "current user". */}
                <Scheduler />
            </div>
        </LoggedIn>
    );
};

export default TimeAllocation;
