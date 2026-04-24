import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; //for URL parameters & navigation
import { AppContent } from '../../context/AppContext';  //for backend URL & user data
import { notesAPI } from '../../services/api'; // for health notes operations
import NoteModal from './NoteModal';  //for adding/editing notes
import Trends from './Trends';
import LoggedIn from '../loggedin';  //import authentication wrapper component

//main component
const HealthNotes = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { backendUrl, userData } = useContext(AppContent);
    const [notes, setNotes] = useState([]);
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [viewMode, setViewMode] = useState('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [loading, setLoading] = useState(true);

    const userId = patientId || userData?._id || 'user123';

    const categories = ['All Categories', 'Symptom', 'Appointment', 'Medication', 'Vital Signs', 'General'];

    //fetch notes when userID changes
    useEffect(() => {
        fetchNotes();
    }, [userId]);

    useEffect(() => {
        filterNotes();
    }, [notes, searchTerm, categoryFilter]);

    //fetch all notes for current user from backend
    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await notesAPI.getAll(userId);
            setNotes(response.data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    };

    //filter notes based on search term and category
    const filterNotes = () => {
        let filtered = notes;
        if (categoryFilter !== 'All Categories') {
            filtered = filtered.filter(note => note.category === categoryFilter);
        }
        if (searchTerm) {
            filtered = filtered.filter(
                note =>
                    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    note.notes.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredNotes(filtered);
    };

    //add new note to db
    const handleAddNote = async (noteData) => {
        try {
            const response = await notesAPI.create({ ...noteData, userId });
            setNotes([response.data, ...notes]);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error creating note:', error);
            alert('Failed to save note.');
        }
    };

    //edit existing note
    const handleUpdateNote = async (noteData) => {
        try {
            const response = await notesAPI.update(editingNote._id, noteData);
            setNotes(notes.map(note => (note._id === editingNote._id ? response.data : note)));
            setEditingNote(null);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error updating note:', error);
        }
    };

    //remove note from db
    const handleDeleteNote = async (id) => {
        if (window.confirm('Delete this note?')) {
            try {
                await notesAPI.delete(id);
                setNotes(notes.filter(note => note._id !== id));
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        }
    };

    const openEditModal = (note) => {
        setEditingNote(note);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingNote(null);
        setIsModalOpen(true);
    };

    // Trends view
    if (viewMode === 'trends') {
        return (
            <LoggedIn>
                <div className="w-full">
                    <div className="mb-6">
                        <h2 className="text-3xl font-black text-gray-900">Health Notes & Trends</h2>
                        <p className="text-emerald-600 font-medium mt-2">Analyze your health patterns and logged statistics.</p>
                    </div>
                    <Trends userId={userId} onBackToList={() => setViewMode('list')} />
                </div>
            </LoggedIn>
        );
    }

    //main UI render
    return (
        <LoggedIn>
            <div className="w-full">
                {/* Standard Page Header */}
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-gray-900">Health Notes</h2>
                    <p className="text-emerald-600 font-medium mt-2">Track and monitor your personal health journey over time.</p>
                </div>

                {/* Toolbar: search, filter, view toggle and button */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                    {/* search input */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                        />
                        <div className="absolute right-3 top-3.5 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                    {/* filter & actions */}
                    <div className="flex gap-4">
                        {/* category dropdown */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-5 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer shadow-sm appearance-none pr-10 relative bg-no-repeat bg-[right_1rem_center] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')]"
                            style={{ backgroundSize: '0.65em auto' }}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        {/* view mode toggle: list/trends */}
                        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                            <button className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-emerald-700'}`}
                                    onClick={() => setViewMode('list')}>
                                List
                            </button>
                            <button className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${viewMode === 'trends' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-emerald-700'}`}
                                    onClick={() => setViewMode('trends')}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                Trends
                            </button>
                        </div>

                        {/* add note button */}
                        <button
                            onClick={openAddModal}
                            className="px-6 py-3 bg-[#0c7a43] hover:bg-emerald-800 text-white rounded-xl flex items-center gap-2 font-bold shadow-md transition-all whitespace-nowrap"
                        >
                            + Add Note
                        </button>
                    </div>
                </div>

                <div>
                    {/* Loading State  */}
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0c7a43] border-t-transparent"></div>
                        </div>
                    )}

                    {/* Notes Grid - display filtered notes */}
                    {!loading && filteredNotes.length > 0 && (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredNotes.map((note) => (
                                <div key={note._id} className="bg-white rounded-2xl shadow-sm border border-emerald-100 flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-5 flex-1">
                                        {/* note header: icon, title,date */}
                                        <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-4">
                                            <div className="flex gap-3">
                                                {/* note icon */}
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 mt-1 shadow-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 leading-tight">{note.title}</h3>
                                                    <p className="text-emerald-700 text-xs font-semibold mt-1">{note.category === 'Symptom' ? 'Reported Symptom' : `Type: ${note.category}`}</p>
                                                    <p className="text-gray-500 text-xs mt-1.5 flex items-center gap-1 font-medium">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        <span className="mx-1 text-gray-300">|</span>
                                                        ⏱ {note.time}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* badges: category & severity */}
                                            <div className="flex flex-col gap-1 items-end">
                                                <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border ${note.category === 'Vital Signs' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                                    {note.category === 'Vital Signs' ? 'vital' : note.category.toLowerCase()}
                                                </span>
                                                <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border ${
                                                    note.severity === 'Critical' ? 'bg-red-50 text-red-600 border-red-200' :
                                                    note.severity === 'Severe' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                    note.severity === 'Moderate' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-green-50 text-green-600 border-green-200'
                                                }`}>
                                                    {note.severity}
                                                </span>
                                            </div>
                                        </div>
                                        {/* note details - mood, physical condition */}
                                        <div className="flex gap-4 text-xs font-bold mb-3">
                                            <span className="text-emerald-800">Mood: <span className="font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md">{note.mood === "Great" ? "🤩" : note.mood === "Poor" ? "🤒" : note.mood === "Terrible" ? "😭" : "😐"} {note.mood}</span></span>
                                            <span className="text-emerald-800">Physical: <span className="font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md">{note.physicalCondition}</span></span>
                                        </div>
                                        {/* note content */}
                                        <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">{note.notes}</p>
                                    </div>
                                    {/* action buttons - edit,delete */}
                                    <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50">
                                        <button
                                            onClick={() => openEditModal(note)}
                                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteNote(note._id)}
                                            className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredNotes.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-emerald-100 shadow-sm mt-4">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No health notes yet</h3>
                            <p className="text-gray-500 text-sm mb-6">Start tracking your health by adding your first note</p>
                            <button
                                onClick={openAddModal}
                                className="px-6 py-2.5 bg-[#0c7a43] hover:bg-emerald-800 text-white rounded-xl flex items-center gap-2 text-sm font-semibold transition-all shadow-md"
                            >
                                + Add Your First Note
                            </button>
                        </div>
                    )}

                    {isModalOpen && (
                        <NoteModal
                            isOpen={isModalOpen}
                            onClose={() => {
                                setIsModalOpen(false);
                                setEditingNote(null);
                            }}
                            onSubmit={editingNote ? handleUpdateNote : handleAddNote}
                            note={editingNote}
                        />
                    )}
                </div>
            </div>
        </LoggedIn>
    );
};

export default HealthNotes;