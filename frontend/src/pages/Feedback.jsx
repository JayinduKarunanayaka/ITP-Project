import React, { useState, useEffect, useContext } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Navbar from '../components/navbar';
import { AppContent } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import PatientSidebar from '../components/PatientSidebar';

const readSavedSessionToken = () => {
    try {
        return window.localStorage.getItem('med_app_auth_token') || '';
    } catch {
        return '';
    }
};

const getAuthHeaders = () => {
    const token = readSavedSessionToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
};


const FeedbackModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {

    const [formData, setFormData] = useState({
        userName: '',
        userId: '',
        type: 'Feature Request',
        rating: 0,
        description: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                userName: initialData.userName || '',
                userId: initialData.userId || '',
                type: initialData.type,
                rating: initialData.rating,
                description: initialData.description
            });
        } else {
            setFormData({
                userName: '', // Start empty or with placeholder
                userId: '',
                type: 'Feature Request',
                rating: 0,
                description: ''
            });
        }
    }, [initialData, isOpen]);


    if (!isOpen) return null;

    // FORM SUBMISSION: Validate and submit
    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.rating === 0) {
            toast.error('Please select a rating');
            return;
        }
        onSubmit({
            ...formData,
            _id: initialData?._id
        });
    };


    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full">
                <div className="p-6">
                    {/* Modal Header: Title + Close button */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit Feedback' : 'Submit Feedback'}</h2>
                            <p className="text-gray-500 text-sm mt-1">Share your thoughts and help us improve.</p>
                        </div>
                        {/* Close button (X icon) */}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* FORM: Input fields for feedback data */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* User Name Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">User Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0c7a43] focus:border-transparent outline-none font-medium text-gray-700 placeholder-gray-400"
                                placeholder="Your name (stays Anonymous if empty)"
                                value={formData.userName}
                                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                            />
                        </div>

                        {/* Feedback Type Dropdown */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Feedback Type</label>
                            <div className="relative">
                                <select
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0c7a43] focus:border-transparent outline-none appearance-none font-medium text-gray-700"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Bug Report">🐛 Bug Report</option>
                                    <option value="Feature Request">💡 Feature Request</option>
                                    <option value="Improvement">📈 Improvement</option>
                                    <option value="Complaint">⚠️ Complaint</option>
                                    <option value="Praise">👍 Praise</option>
                                </select>
                                {/* dynamic icon based on selected type */}
                                <div className="absolute left-4 top-3.5 text-gray-400">
                                    {formData.type === 'Bug Report' ? '🐛' :
                                        formData.type === 'Feature Request' ? '💡' :
                                            formData.type === 'Improvement' ? '📈' :
                                                formData.type === 'Complaint' ? '⚠️' : '👍'}
                                </div>
                                {/* dropdown arrow icon */}
                                <div className="absolute right-4 top-4 text-gray-400 pointer-events-none">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Star Rating Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rating: star })}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        {/* Star icon: filled if selected, empty otherwise */}
                                        <svg className={`w-8 h-8 ${star <= formData.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                    </button>
                                ))}
                                {/* display current rating values */}
                                <span className="ml-3 font-semibold text-gray-500 text-sm">{formData.rating} / 5</span>
                            </div>
                        </div>

                        {/* Description Textarea */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                            <textarea
                                required
                                rows="4"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0c7a43] focus:border-transparent outline-none resize-none placeholder-gray-400 text-gray-700"
                                placeholder="Please provide detailed feedback..."
                            />
                        </div>

                        {/* Action Buttons: Cancel & Submit */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-[#0a1128] text-white rounded-xl hover:bg-[#111a3b] font-semibold transition-colors shadow-md"
                            >
                                {initialData ? 'Update Feedback' : 'Submit Feedback'}
                            </button>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

//main component - Feedback

const Feedback = () => {
    const { patientId } = useParams();
    const { backendUrl, userData } = useContext(AppContent);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All Types');
    const [feedbacks, setFeedbacks] = useState([]);
    const [editingFeedback, setEditingFeedback] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [accessState, setAccessState] = useState('checking');

    const isCaretakerPatientView = Boolean(patientId);
    const feedbackUserId = userData?._id || patientId || '';

    const fetchAuthState = async () => {
        const token = readSavedSessionToken();
        if (!token) {
            setAccessState('unauthorized');
            return;
        }

        try {
            const { data } = await axios.get(`${backendUrl}/api/auth/is-auth`, { headers: getAuthHeaders() });
            const authenticatedUser = data?.userData || data?.user;
            if (!data?.success || !authenticatedUser?._id) {
                setAccessState('unauthorized');
                return;
            }
            setAccessState('authorized');
        } catch (error) {
            console.error('Error checking feedback access:', error);
            setAccessState('unauthorized');
        }
    };

    //API: Fetch all feedback from backend
    const fetchFeedbacks = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${backendUrl}/api/feedback`, { headers: getAuthHeaders() });
            setFeedbacks(response.data);
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
            toast.error('Failed to load feedbacks');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthState();
    }, [backendUrl]);

    useEffect(() => {
        if (accessState === 'authorized') {
            fetchFeedbacks();
        }
    }, [accessState, backendUrl]);

    useEffect(() => {
        const fetchPatientData = async () => {
            if (!patientId) return;
            try {
                const { data } = await axios.get(
                    `${backendUrl}/api/user/get-patient/${patientId}`,
                    { headers: getAuthHeaders() }
                );
                if (data.success) setPatient(data.patient);
            } catch (error) {
                console.error('Error fetching patient profile for feedback:', error);
            }
        };
        fetchPatientData();
    }, [patientId, backendUrl]);

    //Add or update feedback
    const handleAddOrUpdateFeedback = async (formData) => {
        try {
            if (formData._id) {
                //UPDATE: Put request to update existing feedback
                const response = await axios.put(`${backendUrl}/api/feedback/${formData._id}`, formData, { headers: getAuthHeaders() });
                setFeedbacks(feedbacks.map(f => f._id === formData._id ? response.data : f));
                toast.success('Feedback updated successfully');
            } else {
                // CREATE: Post request to create new feedback
                const finalUserName = formData.userName.trim() || userData?.name || 'Anonymous';
                const response = await axios.post(`${backendUrl}/api/feedback`, {
                    ...formData,
                    userName: finalUserName // Use the calculated final user name
                }, { headers: getAuthHeaders() });
                // Add new feedback to top of list
                setFeedbacks([response.data, ...feedbacks]);
                toast.success('Feedback submitted successfully');
            }
            setIsModalOpen(false);
            setEditingFeedback(null);
        } catch (error) {
            console.error('Error saving feedback:', error);
            toast.error(error.response?.data?.message || 'Error saving feedback');
        }
    };

    //Delete feedback
    const handleDeleteFeedback = async (id) => {
        if (!window.confirm('Are you sure you want to delete this feedback?')) return;
        try {
            await axios.delete(`${backendUrl}/api/feedback/${id}`, { headers: getAuthHeaders() });
            setFeedbacks(feedbacks.filter(f => f._id !== id));
            toast.success('Feedback deleted successfully');
        } catch (error) {
            console.error('Error deleting feedback:', error);
            toast.error('Error deleting feedback');
        }
    };

    const openEditModal = (fb) => {
        setEditingFeedback(fb);
        setIsModalOpen(true);
    };


    //over all ratings
    // Calculate stats
    const totalReviews = feedbacks.length;
    const avgRating = totalReviews > 0 ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalReviews).toFixed(1) : 0;

    // Calculate rating distribution (5★ to 1★)
    const ratingCounts = [5, 4, 3, 2, 1].map(star => {
        const count = feedbacks.filter(f => f.rating === star).length;
        return { star, count, percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0 };
    });

    // Calculate sentiment counts
    const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
    const neutralCount = feedbacks.filter(f => f.rating === 3).length;
    const negativeCount = feedbacks.filter(f => f.rating <= 2).length;

    // Filter feedbacks
    const filteredFeedbacks = feedbacks.filter(f => {
        const matchesSearch = f.description.toLowerCase().includes(searchTerm.toLowerCase()) || f.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All Types' || f.type === filterType;
        return matchesSearch && matchesType;
    });

    if (accessState === 'checking') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-emerald-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0c7a43] mx-auto"></div>
                    <p className="text-gray-500 mt-4">Checking access...</p>
                </div>
            </div>
        );
    }

    if (accessState === 'unauthorized') {
        return <Navigate to='/login' replace />;
    }

    //main UI
    const feedbackContent = (
        <div className="max-w-5xl mx-auto w-full p-2 pt-28">

                {/* Toolbar - search, filter, button */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search feedback..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-4 py-2.5 bg-white border border-[#0c7a43] rounded-lg text-gray-700 outline-none focus:ring-2 focus:ring-[#0c7a43] focus:border-transparent shadow-sm"
                        />
                    </div>
                    {/* Type Filter Dropdown */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 outline-none focus:ring-2 focus:ring-[#0c7a43] shadow-sm appearance-none pr-10 relative bg-no-repeat bg-[right_1rem_center] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')]"
                        style={{ backgroundSize: '0.65em auto' }}
                    >
                        <option value="All Types">All Types</option>
                        <option value="Bug Report">Bug Report</option>
                        <option value="Feature Request">Feature Request</option>
                        <option value="Improvement">Improvement</option>
                        <option value="Complaint">Complaint</option>
                        <option value="Praise">Praise</option>
                    </select>
                    {/* Add Feedback Button */}
                    <button
                        onClick={() => {
                            setEditingFeedback(null);
                            setIsModalOpen(true);
                        }}
                        className="px-5 py-2.5 bg-[#14834e] hover:bg-[#0c7a43] text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        + Add Feedback
                    </button>

                </div>

                {/* System Overall Rating Card */}
                <div className="bg-emerald-50/50 rounded-2xl shadow-sm border border-emerald-100 p-6 mb-8 overflow-hidden">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        System Overall Rating
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8 border border-emerald-100 bg-white/60 backdrop-blur-sm rounded-xl p-6 mb-6">
                        {/* Left: Average Rating Display */}
                        <div className="flex flex-col items-center justify-center border-r-0 md:border-r border-emerald-100 pb-6 md:pb-0">
                            <h1 className="text-6xl font-black text-gray-900">{avgRating}</h1>
                            {/* Star rating visualization */}
                            <div className="flex text-amber-400 my-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg key={star} className={`w-6 h-6 ${star <= Math.round(avgRating) ? 'fill-amber-400' : 'text-gray-300 fill-gray-100'}`} viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-base text-gray-500 mb-3">Based on {totalReviews} reviews</p>
                            <p className="text-xl font-bold text-gray-800">Very Good 👍</p>
                        </div>

                        {/* Right: Rating Distribution Bars */}
                        <div className="flex flex-col justify-center gap-2">
                            {ratingCounts.map((rc) => (
                                <div key={rc.star} className="flex items-center gap-3">
                                    <span className="text-base font-semibold text-gray-600 w-10 flex items-center">{rc.star} <span className="text-amber-400 text-sm ml-1">★</span></span>
                                    {/* Progress bar background */}
                                    <div className="flex-1 bg-emerald-100/30 rounded-full h-2">
                                        <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${rc.percentage}%` }}></div>
                                    </div>
                                    <span className="text-base text-gray-500 w-16 text-right font-medium">{rc.count} ({rc.percentage}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sentiment Summary Cards */}
                    <div className="grid grid-cols-3 divide-x divide-emerald-100 text-center">
                        <div>
                            <p className="text-3xl font-bold text-[#0c7a43]">{positiveCount}</p>
                            <p className="text-sm font-bold text-gray-600 mt-1">Positive (4-5★)</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-amber-500">{neutralCount}</p>
                            <p className="text-sm font-bold text-gray-600 mt-1">Neutral (3★)</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-red-500">{negativeCount}</p>
                            <p className="text-sm font-bold text-gray-600 mt-1">Negative (1-2★)</p>
                        </div>
                    </div>
                </div>

                {/* Feedback List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0c7a43] mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading feedbacks...</p>
                        </div>
                    ) : filteredFeedbacks.length === 0 ? (
                        //empty state
                        <div className="text-center py-10 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-gray-500 font-medium">No feedback entries found.</p>
                        </div>
                    ) : (
                        // Feedback Cards Grid
                        filteredFeedbacks.map((fb) => (
                            <div key={fb._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
                                <div className="flex gap-4">
                                    {/* Type Icon */}
                                    <div className="text-2xl mt-1">
                                        {fb.type === 'Bug Report' ? '🐛' :
                                            fb.type === 'Feature Request' ? '💡' :
                                                fb.type === 'Improvement' ? '📈' :
                                                    fb.type === 'Complaint' ? '⚠️' : '🔥'}
                                    </div>
                                    <div className="flex-1">
                                        {/* User Name at the top */}
                                        <div className="mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                {fb.userName || 'Anonymous'}
                                            </span>
                                        </div>
                                        {/* Card Header: Type, Date, Rating, Status */}
                                        <div className="flex justify-between items-start mb-1.5">
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 leading-tight">{fb.type}</h3>
                                                <p className="text-sm text-gray-500 font-bold mt-1">{fb.date}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                {/* Star Rating */}
                                                <div className="flex text-amber-400">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span key={star} className={star <= fb.rating ? 'fill-amber-400' : 'text-gray-200'}>
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                                {/* Status Badge */}
                                                <span className={`px-3 py-1 text-[11px] font-black uppercase rounded-full ${fb.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                    {fb.status}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Description */}
                                        <p className="text-gray-700 text-base leading-relaxed font-medium mt-3 whitespace-pre-wrap">{fb.description}</p>
                                    </div>
                                </div>

                                 {/* Action Buttons: Edit & Delete - visible only for the owner */}
                                {userData?._id && fb.userId === userData._id && (
                                    <div className="flex justify-end gap-6 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => openEditModal(fb)}
                                            className="flex items-center gap-2 text-base font-bold text-gray-600 hover:text-emerald-700 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteFeedback(fb._id)}
                                            className="flex items-center gap-2 text-base font-bold text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Modal: Render FeedbackModal when open */}
                <FeedbackModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingFeedback(null);
                    }}
                    onSubmit={handleAddOrUpdateFeedback}
                    initialData={editingFeedback}
                />

        </div>
    );

    if (isCaretakerPatientView) {
        return (
            <div className='flex min-h-screen bg-white'>
                <PatientSidebar patientName={patient?.name} />
                <main className='flex-1 p-8 md:p-12 bg-slate-50 overflow-y-auto'>
                    {feedbackContent}
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            {feedbackContent}
        </div>
    );
};

export default Feedback;
