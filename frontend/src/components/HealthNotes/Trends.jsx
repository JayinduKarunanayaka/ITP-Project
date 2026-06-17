import { useState, useEffect } from 'react';
import { notesAPI } from '../../services/api';
import jsPDF from 'jspdf';  //import pdf generation libraries
import autoTable from 'jspdf-autotable';

//ANALYTICS COMPONENT: Trends
const Trends = ({ userId, onBackToList }) => {
    //Trends analytics data from API
    const [trends, setTrends] = useState(null);
    //STATE: Notes from last 30 days for PDF report
    const [allNotes, setAllNotes] = useState([]);
    //STATE: Loading indicator for API calls
    const [loading, setLoading] = useState(true);

    const categoryColorMap = {
        Symptom: 'bg-rose-500',
        Medication: 'bg-violet-500',
        Appointment: 'bg-sky-500',
        'Vital Signs': 'bg-emerald-500',
        General: 'bg-amber-500',
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    //Fetch trends + recent notes for PDF
    const fetchData = async () => {
        try {
            // Fetch trends analytics (counts, distributions, top symptoms)
            const trendsResponse = await notesAPI.getTrends(userId);
            setTrends(trendsResponse.data);

            const notesResponse = await notesAPI.getAll(userId);
            const monthNotes = notesResponse.data.filter(note => {
                const noteDate = new Date(note.createdAt);
                const now = new Date();
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return noteDate >= monthAgo;  //Only include notes from last 30 days
            });
            setAllNotes(monthNotes);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    //PDF: Generate and download monthly report
    const downloadMonthlyReport = () => {
        try {
            // Validate data exists before generating PDF
            if (!trends || allNotes.length === 0) {
                alert('No data available to download');
                return;
            }

            const doc = new jsPDF();
            const now = new Date();
            const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });

            // Title
            doc.setFontSize(20);
            doc.setTextColor(0, 0, 0);
            doc.text('Health Notes - Monthly Report', 14, 20);

            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 14, 30);
            doc.text(`Period: Last 30 Days (${monthYear})`, 14, 37);

            // Summary Section
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text('Summary Statistics', 14, 50);

            doc.setFontSize(11);
            doc.setTextColor(0);

            const summaryData = [
                ['Total Notes', trends.totalNotes.toString()],
                ['Today', trends.today.toString()],
                ['This Week', trends.thisWeek.toString()],
                ['This Month', trends.thisMonth.toString()],
                ['Mild Severity', trends.severityDistribution.Mild.count.toString()],
                ['Moderate Severity', trends.severityDistribution.Moderate.count.toString()],
                ['Severe Severity', trends.severityDistribution.Severe.count.toString()],
                ['Critical Severity', trends.severityDistribution.Critical.count.toString()]
            ];

            autoTable(doc, {
                startY: 55,
                head: [['Metric', 'Count']],
                body: summaryData,
                theme: 'striped',
                headStyles: {
                    fillColor: [134, 239, 172],
                    textColor: 0,
                    fontStyle: 'bold'
                },
                styles: { fontSize: 10 }
            });

            if (trends.categoryBreakdown && trends.categoryBreakdown.length > 0) {
                autoTable(doc, {
                    startY: doc.lastAutoTable.finalY + 15,
                    head: [['Category', 'Count', 'Share']],
                    body: trends.categoryBreakdown.map((item) => [
                        item.category,
                        item.count.toString(),
                        `${item.percentage}%`
                    ]),
                    theme: 'striped',
                    headStyles: {
                        fillColor: [134, 239, 172],
                        textColor: 0,
                        fontStyle: 'bold'
                    },
                    styles: { fontSize: 10 }
                });
            }

            // Top Symptoms
            if (trends.topSymptoms && trends.topSymptoms.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text('Top Symptoms', 14, doc.lastAutoTable.finalY + 15);

                const symptomsData = trends.topSymptoms.map((symptom, index) => [
                    `${index + 1}. ${symptom.name}`,
                    `${symptom.count} ${symptom.count === 1 ? 'note' : 'notes'}`
                ]);

                autoTable(doc, {
                    startY: doc.lastAutoTable.finalY + 20,
                    head: [['Symptom', 'Frequency']],
                    body: symptomsData,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [134, 239, 172],
                        textColor: 0,
                        fontStyle: 'bold'
                    },
                    styles: { fontSize: 10 }
                });
            }

            // Detailed Notes Section
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text('Detailed Health Notes', 14, doc.lastAutoTable.finalY + 15);

            const notesData = allNotes.map((note, index) => [
                `${index + 1}. ${note.title}`,
                note.category,
                new Date(note.date).toLocaleDateString(),
                note.time,
                note.physicalCondition,
                note.severity,
                note.notes.length > 80 ? note.notes.substring(0, 80) + '...' : note.notes
            ]);

            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Title', 'Category', 'Date', 'Time', 'Physical', 'Severity', 'Notes']],
                body: notesData,
                theme: 'grid',
                headStyles: {
                    fillColor: [134, 239, 172],
                    textColor: 0,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', valign: 'middle' },
                columnStyles: {
                    0: { cellWidth: 35 },
                    1: { cellWidth: 22 },
                    2: { cellWidth: 22 },
                    3: { cellWidth: 18 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 'auto' }
                },
                margin: { top: 20, bottom: 20, left: 10, right: 10 }
            });

            // Footer- page numbers
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
            }

            // Save PDF to user's device
            const fileName = `Health_Notes_${monthYear.replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('PDF Error:', error);
            alert('Failed to download PDF. Check console for details.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
            </div>
        );
    }

    //EMPTY STATE: Show message when no notes to analyze
    if (!trends || trends.totalNotes === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-emerald-600 text-lg">No health notes to analyze yet.</p>
                <button
                    onClick={onBackToList}
                    className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                >
                    Back to List
                </button>
            </div>
        );
    }

    //main UI
    return (
        <div>
            {/* Back Button & Download pdf Button */}
            <div className="mb-6 flex justify-between items-center">
                <button
                    onClick={onBackToList}
                    className="px-4 py-2 bg-white text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-md"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to List
                </button>

                <button
                    onClick={downloadMonthlyReport}
                    className="px-6 py-2.5 bg-[#0c7a43] text-white rounded-xl hover:bg-emerald-800 transition-colors flex items-center gap-2 shadow-md font-semibold"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Monthly Report
                </button>
            </div>

            {/* Stats Cards - total, weekly, monthly notes */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
                {/* Total Notes */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-emerald-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-emerald-600 text-sm font-medium mb-2">Total Notes</h3>
                            <p className="text-4xl font-bold text-emerald-600">{trends.totalNotes}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Today */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-emerald-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-blue-600 text-sm font-medium mb-2">Today</h3>
                            <p className="text-4xl font-bold text-blue-600">{trends.today}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* This Week */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-emerald-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-emerald-600 text-sm font-medium mb-2">This Week</h3>
                            <p className="text-4xl font-bold text-emerald-600">{trends.thisWeek}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* This Month */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-emerald-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-emerald-600 text-sm font-medium mb-2">This Month</h3>
                            <p className="text-4xl font-bold text-emerald-600">{trends.thisMonth}</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-emerald-100 mb-6">
                <h3 className="text-lg font-bold text-emerald-900 mb-2 flex items-center gap-2">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V5m0 14h16M8 17V9m4 8V7m4 10v-4" />
                    </svg>
                    Category Breakdown (30d)
                </h3>
                <p className="text-sm text-slate-500 mb-6">Health records grouped by the category selected when each note was created.</p>

                {trends.categoryBreakdown && trends.categoryBreakdown.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {trends.categoryBreakdown.map((item) => (
                            <div key={item.category} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{item.category}</p>
                                        <p className="text-xs text-slate-500">{item.percentage}% of recent notes</p>
                                    </div>
                                    <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-emerald-700 border border-emerald-200 shadow-sm">
                                        {item.count}
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-emerald-100 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${categoryColorMap[item.category] || 'bg-emerald-500'}`}
                                        style={{ width: `${Math.max(Number(item.percentage), item.count > 0 ? 10 : 0)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-6 py-10 text-center text-sm text-emerald-600">
                        No category breakdown available yet.
                    </div>
                )}
            </div>

            {/* Severity Distribution & Top Symptoms */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Severity Distribution */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-emerald-100">
                    <h3 className="text-lg font-bold text-emerald-900 mb-6 flex items-center gap-2">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Severity Distribution
                    </h3>

                    <div className="space-y-4">
                        {['Mild', 'Moderate', 'Severe', 'Critical'].map((severity) => {
                            const data = trends.severityDistribution[severity];
                            const percentage = parseFloat(data?.percentage || 0);

                            //color mapping for severity levels
                            const getColor = (sev) => {
                                switch (sev) {
                                    case 'Mild': return 'bg-amber-500';
                                    case 'Moderate': return 'bg-orange-600';
                                    case 'Severe': return 'bg-red-500';
                                    case 'Critical': return 'bg-rose-700';
                                    default: return 'bg-gray-600';
                                }
                            };

                            return (
                                <div key={severity} className="flex items-center justify-between">
                                    <span className="text-emerald-800 font-bold w-24 text-sm">{severity}</span>
                                    <div className="flex-1 mx-4">
                                        {/* Progress bar background */}
                                        <div className="bg-emerald-100/80 rounded-full h-2">
                                            <div
                                                className={`${getColor(severity)} h-2 rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    {/* Count + percentage badge */}
                                    <div className="flex items-center gap-3 w-[6.5rem] justify-end">
                                        <span className="text-gray-800 font-black text-sm">{data?.count || 0}</span>
                                        <span className="text-emerald-600 text-xs font-bold border border-emerald-300 bg-white px-2.5 py-0.5 rounded-full min-w-[3.25rem] text-center shadow-sm">
                                            {percentage}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Symptoms list */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-emerald-100">
                    <h3 className="text-lg font-bold text-emerald-900 mb-6 flex items-center gap-2">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Top Symptoms
                    </h3>

                    {trends.topSymptoms && trends.topSymptoms.length > 0 ? (
                        <div className="space-y-3">
                            {trends.topSymptoms.map((symptom, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Ranking badge */}
                                        <div className="w-8 h-8 bg-emerald-200 rounded-full flex items-center justify-center">
                                            <span className="text-emerald-700 font-bold text-sm">{index + 1}</span>
                                        </div>
                                        <span className="font-medium text-emerald-900">{symptom.name}</span>
                                    </div>
                                    {/* Frequency badge */}
                                    <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-sm font-medium">
                      {symptom.count} {symptom.count === 1 ? 'note' : 'notes'}
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        //empty state for symptoms
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-emerald-600">No symptom data available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Trends;