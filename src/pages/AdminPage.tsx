import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, LogOut, Upload, Trash2, ExternalLink, ChevronRight, Clock, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { User, Appointment, AssessmentScore, SessionNote } from '../lib/database';
import { db, generateTimeSlots } from '../lib/database';
import ScoreDisplay from '../components/ScoreDisplay';

// --- Reusable Date Helpers ---
const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
const getISOString = (date: Date) => date.toISOString().split('T')[0];

const generateWeekDates = (weekOffset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1
    startOfWeek.setDate(today.getDate() - dayOfWeek + (weekOffset * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
};

// --- Availability Component ---
const AvailabilityManager = () => {
    const [currentWeek, setCurrentWeek] = useState(0);
    const [weekDates, setWeekDates] = useState(generateWeekDates(0));
    const [unavailableSlots, setUnavailableSlots] = useState<Record<string, string[]>>({});

    const fetchAvailability = useCallback(async () => {
        const availabilityData: Record<string, string[]> = {};
        for (const date of weekDates) {
            const isoDate = getISOString(date);
            availabilityData[isoDate] = await db.getAvailabilityForDate(isoDate);
        }
        setUnavailableSlots(availabilityData);
    }, [weekDates]);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

     useEffect(() => {
        setWeekDates(generateWeekDates(currentWeek));
    }, [currentWeek]);


    const handleSlotClick = async (date: Date, time: string) => {
        const isoDate = getISOString(date);
        const isCurrentlyUnavailable = unavailableSlots[isoDate]?.includes(time);
        
        await db.updateAvailability(isoDate, time, !isCurrentlyUnavailable);
        // Refresh local state to update UI instantly
        setUnavailableSlots(prev => {
            const currentDaySlots = prev[isoDate] || [];
            if (isCurrentlyUnavailable) {
                return {...prev, [isoDate]: currentDaySlots.filter(t => t !== time) };
            } else {
                 return {...prev, [isoDate]: [...currentDaySlots, time] };
            }
        });
    };

     const formatWeekRange = (dates: Date[]) => `${formatDate(dates[0])} - ${formatDate(dates[6])}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Your Availability</h2>
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => setCurrentWeek(currentWeek - 1)} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"><ChevronLeft size={16} className="mr-1" />Previous Week</button>
                <h3 className="text-lg font-semibold text-gray-900 text-center">{formatWeekRange(weekDates)}</h3>
                <button onClick={() => setCurrentWeek(currentWeek + 1)} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Next Week<ChevronRight size={16} className="ml-1" /></button>
            </div>
             <div className="overflow-x-auto">
                <div className="border border-gray-200 rounded-lg inline-block min-w-full">
                    <div className="grid grid-cols-8 bg-gray-50">
                        <div className="p-3 text-sm font-medium text-gray-700 border-r">Time</div>
                        {weekDates.map(date => (
                            <div key={date.toISOString()} className="p-3 text-sm font-medium text-center text-gray-700 border-r last:border-r-0"><span className="text-grima-primary">{date.toLocaleDateString('en-CA', {weekday: 'short'})}</span><br/>{date.toLocaleDateString('en-CA', {month: 'short', day: 'numeric'})}</div>
                        ))}
                    </div>
                    <div>
                    {generateTimeSlots(weekDates[0]).map(time => (
                        <div key={time} className="grid grid-cols-8 border-t">
                             <div className="p-3 text-xs text-gray-600 border-r bg-gray-50 font-medium">{time}</div>
                             {weekDates.map(date => {
                                const isoDate = getISOString(date);
                                const isUnavailable = unavailableSlots[isoDate]?.includes(time);
                                return (
                                    <div key={date.toISOString()} className="border-r last:border-r-0">
                                        <button 
                                            onClick={() => handleSlotClick(date, time)}
                                            className={`w-full h-12 text-xs font-medium transition-colors ${ isUnavailable ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-50 text-green-800 hover:bg-green-100'}`}>
                                            {isUnavailable ? 'Unavailable' : 'Available'}
                                        </button>
                                    </div>
                                )
                             })}
                        </div>
                    ))}
                    </div>
                </div>
             </div>
        </div>
    )
}

// --- Main Page Component ---
const AdminPage = () => {
  const { user, logout, loadAllUsers, addSessionNote } = useAuth();
  const [clients, setClients] = useState<User[]>([]);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [clientData, setClientData] = useState<{ appointments: Appointment[], scores: AssessmentScore[] } | null>(null);
  const [isLoadingClientData, setIsLoadingClientData] = useState(false);
  const [activeTab, setActiveTab] = useState<'clients' | 'availability'>('clients');

  useEffect(() => {
    if (user?.isAdmin) {
      loadAllUsers().then(setClients);
    }
  }, [user, loadAllUsers]);

  const selectClient = useCallback((client: User) => {
    setSelectedClient(client);
    setIsLoadingClientData(true);
    Promise.all([
      db.getUserAppointments(client.id),
      db.getUserAssessmentScores(client.id)
    ]).then(([appointments, scores]) => {
      setClientData({ appointments, scores });
      setIsLoadingClientData(false);
    });
  }, []);

  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      selectClient(clients[0]);
    }
  }, [clients, selectedClient, selectClient]);

  if (!user || !user.isAdmin) return <Navigate to="/login" replace />;

  const upcomingAppointments = clientData?.appointments.filter(a => a.status === 'scheduled') || [];
  const pastAppointments = clientData?.appointments.filter(a => a.status !== 'scheduled') || [];
  
  return (
    <div className="flex h-screen bg-grima-50 font-sans">
      <aside className="w-64 bg-gray-800 text-gray-200 flex flex-col p-4">
        <div className="font-bold text-xl mb-8 text-white">Grima Admin</div>
        <nav className="flex-grow space-y-2">
            <button onClick={() => setActiveTab('clients')} className={`w-full flex items-center p-2 rounded transition-colors ${activeTab === 'clients' ? 'bg-grima-primary text-white' : 'hover:bg-gray-700'}`}><Users size={18} className="mr-3"/> Client Management</button>
             <button onClick={() => setActiveTab('availability')} className={`w-full flex items-center p-2 rounded transition-colors ${activeTab === 'availability' ? 'bg-grima-primary text-white' : 'hover:bg-gray-700'}`}><Clock size={18} className="mr-3"/> Availability</button>
        </nav>
        <button onClick={logout} className="flex items-center p-2 rounded hover:bg-red-500/20 text-red-300 transition-colors"><LogOut size={18} className="mr-3"/> Sign Out</button>
      </aside>

       <main className="flex-1 grid grid-cols-1 xl:grid-cols-3 overflow-hidden">
        {activeTab === 'clients' ? (
        <>
            {/* Client List */}
            <div className="col-span-1 border-r bg-white overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900">All Clients ({clients.length})</h2>
            </div>
            <div className="p-2 space-y-1">
                {clients.map(client => (
                <div key={client.id} onClick={() => selectClient(client)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedClient?.id === client.id ? 'bg-grima-primary text-white shadow' : 'hover:bg-grima-50'}`}>
                    <p className="font-semibold">{client.firstName} {client.lastName}</p>
                    <p className={`text-sm ${selectedClient?.id === client.id ? 'text-grima-100' : 'text-gray-500'}`}>{client.email}</p>
                </div>
                ))}
            </div>
            </div>

            {/* Client Details */}
            <div className="col-span-1 xl:col-span-2 overflow-y-auto p-8">
                {selectedClient ? (
                    <>
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{selectedClient.firstName} {selectedClient.lastName}</h1>
                            <p className="text-gray-600">{selectedClient.email} • {selectedClient.phone}</p>
                        </div>
                        <button className="text-sm text-red-600 hover:underline flex items-center"><Trash2 size={14} className="mr-1"/>Delete Client</button>
                    </div>

                    {isLoadingClientData ? <p>Loading client data...</p> : (
                        <div className="space-y-10">
                            <div>
                                <h3 className="font-bold text-xl mb-4">Upcoming Sessions</h3>
                                {upcomingAppointments.length > 0 ? upcomingAppointments.map(apt => (
                                    <div key={apt.id} className="bg-white p-4 rounded-lg shadow border flex justify-between items-center">
                                        <div><p className="font-semibold">{apt.service_type}</p><p className="text-sm text-gray-500">{new Date(apt.date).toLocaleDateString('en-CA', {dateStyle: 'long'})} at {apt.time}</p></div>
                                        <a href={apt.google_meet_link} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white px-3 py-1.5 text-sm rounded font-semibold hover:bg-blue-600 flex items-center"><ExternalLink size={14} className="mr-2"/>Start Meet</a>
                                    </div>
                                )) : <p className="text-sm text-gray-500">No upcoming sessions.</p>}
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-xl mb-4">Session History & Notes</h3>
                                {pastAppointments.length > 0 ? pastAppointments.map(apt => (
                                    <details key={apt.id} className="bg-white rounded-lg shadow-md border group mb-2">
                                        <summary className="p-4 cursor-pointer flex justify-between items-center list-none">
                                            <h4 className="font-semibold text-gray-800">{apt.service_type} on {new Date(apt.date).toLocaleDateString('en-CA')} <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${apt.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{apt.status}</span></h4>
                                            <ChevronRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform" />
                                        </summary>
                                        <div className="px-4 pb-4 border-t">
                                            <h5 className="font-medium mt-3 text-sm">Existing Notes:</h5>
                                            {apt.session_notes && apt.session_notes.length > 0 ? apt.session_notes.map(note => <p key={note.id} className="text-xs text-gray-600 p-2 bg-gray-50 rounded mt-1">{note.file_name || "Note"}: {note.content}</p>) : <p className="text-xs text-gray-500 mt-1">No notes for this session.</p>}
                                            <div className="mt-4 pt-4 border-t">
                                                <h5 className="text-sm font-semibold mb-2">Upload New Note/File</h5>
                                                <input type="file" className="text-sm border p-1 rounded w-full"/>
                                                <button onClick={() => addSessionNote(apt.id!, {title: 'New Note', content: '...', file_name: 'demo.pdf', file_url:''}, selectedClient.id)} className="w-full mt-2 bg-gray-700 text-white p-2 rounded text-sm font-semibold hover:bg-gray-800 flex items-center justify-center"><Upload size={14} className="mr-2"/>Upload</button>
                                            </div>
                                        </div>
                                    </details>
                                )) : <p className="text-sm text-gray-500">No past sessions.</p>}
                            </div>

                            <div>
                                <h3 className="font-bold text-xl mb-4">Assessment Scores</h3>
                                <div className="space-y-4">
                                    {clientData?.scores && clientData.scores.length > 0 ? (
                                        clientData.scores.map(score => (
                                            <ScoreDisplay key={score.id} scoreData={score} />
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No assessment scores for this client.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full bg-white rounded-lg shadow-lg border-2 border-dashed"><p className="text-gray-500">Select a client from the list to view their details.</p></div>
                )}
            </div>
        </>
        ) : (
            <div className="col-span-1 xl:col-span-3 overflow-y-auto p-8">
               <AvailabilityManager />
            </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;