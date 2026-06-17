import { useMemo, useState } from 'react';

const CalendarView = ({ notes, onBackToList }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const today = new Date();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const formatDateKey = (value) => {
        if (!value) return '';
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const categoryColors = {
        Symptom: 'bg-blue-500',
        Appointment: 'bg-orange-500',
        Medication: 'bg-purple-500',
        'Vital Signs': 'bg-pink-500',
        General: 'bg-indigo-500',
    };

    const notesByDay = useMemo(() => {
        return (notes || []).reduce((accumulator, note) => {
            const key = formatDateKey(note.date || note.createdAt);
            if (!key) return accumulator;
            if (!accumulator[key]) accumulator[key] = [];
            accumulator[key].push(note);
            return accumulator;
        }, {});
    }, [notes]);

    const days = [];

    for (let index = 0; index < startDay; index += 1) {
        days.push(
            <div key={`blank-${index}`} className="min-h-[8rem] border border-emerald-100 bg-slate-50/70" aria-hidden="true" />
        );
    }

    for (let day = 1; day <= totalDays; day += 1) {
        const cellDate = new Date(year, month, day);
        const dayKey = formatDateKey(cellDate);
        const dayNotes = notesByDay[dayKey] || [];
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

        days.push(
            <div
                key={day}
                className={`min-h-[8rem] border border-emerald-100 p-3 relative transition-colors duration-200 hover:bg-emerald-50/40 ${isToday ? 'bg-emerald-50/60' : 'bg-white'}`}
            >
                <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-bold ${isToday ? 'text-emerald-800 w-7 h-7 flex items-center justify-center rounded-full bg-emerald-200' : 'text-slate-500'}`}>
                        {day}
                    </span>
                    {dayNotes.length > 0 && (
                        <span className="rounded-full border border-emerald-100 bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-sm">
                            {dayNotes.length}
                        </span>
                    )}
                </div>

                <div className="mt-3 flex flex-col gap-1.5">
                    {dayNotes.slice(0, 3).map((note, index) => (
                        <div
                            key={`${dayKey}-${note._id || index}`}
                            className={`${categoryColors[note.category] || 'bg-emerald-600'} h-2 rounded-full w-full shadow-sm opacity-90`}
                            title={`${note.category}: ${note.title}`}
                        />
                    ))}
                    {dayNotes.length > 3 && (
                        <span className="text-[10px] font-bold text-emerald-700">+{dayNotes.length - 3} more</span>
                    )}
                </div>

                {isToday && <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
        );
    }

    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl">
            <div className="flex flex-col gap-5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-slate-50 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBackToList}
                        className="rounded-xl border border-emerald-100 bg-white p-2 text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50"
                        aria-label="Back to list"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h2 className="text-xl font-black text-emerald-900">Calendar View</h2>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">Monthly note overview with color-coded categories.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-2 shadow-sm">
                        <span className="text-sm font-semibold text-emerald-800">{monthLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white p-1 shadow-sm">
                        <button onClick={prevMonth} className="rounded-xl p-2 text-emerald-700 transition-colors hover:bg-emerald-100" aria-label="Previous month">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={nextMonth} className="rounded-xl p-2 text-emerald-700 transition-colors hover:bg-emerald-100" aria-label="Next month">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                <div className="mb-2 grid grid-cols-7">
                    {weekdayLabels.map((label) => (
                        <div key={label} className="py-3 text-center text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
                            {label}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 overflow-hidden rounded-3xl border border-emerald-100 bg-white">
                    {days}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-emerald-100 bg-slate-50/70 p-6">
                <div className="mr-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Legend</div>
                {Object.entries(categoryColors).map(([category, colorClass]) => (
                    <div key={category} className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 shadow-sm">
                        <div className={`h-3 w-3 rounded-full ${colorClass}`} />
                        <span className="text-xs font-semibold text-slate-700">{category}</span>
                    </div>
                ))}
                <div className="ml-auto flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 shadow-sm">
                    <div className="h-3 w-3 rounded-full border border-emerald-400 bg-emerald-200" />
                    <span className="text-xs font-semibold text-emerald-800">Current Day</span>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
