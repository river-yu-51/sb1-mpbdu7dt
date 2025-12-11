import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db, generateTimeSlots, Appointment } from '../lib/database';

const ReschedulePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, rescheduleAppointment } = useAuth();
  const { showNotification } = useNotification();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/account');
      return;
    }
    db.getAppointmentById(id).then(apt => {
      if (apt && apt.user_id === user?.id) {
        setAppointment(apt);
      } else {
        showNotification("Appointment not found.", "error");
        navigate('/account');
      }
    });
  }, [id, user, navigate, showNotification]);
  
  const generateWeekDates = (weekOffset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() - dayOfWeek + (weekOffset * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };
  
  const weekDates = generateWeekDates(currentWeek);

  useEffect(() => {
    const fetchAvailability = async () => {
        const availabilityData: Record<string, string[]> = {};
        for (const date of weekDates) {
            const isoDate = date.toISOString().split('T')[0];
            availabilityData[isoDate] = await db.getAvailabilityForDate(isoDate);
        }
        setAvailability(availabilityData);
    };
    fetchAvailability();
}, [currentWeek]);

  const parseTimeString = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12 && modifier === 'AM') { hours = 0; }
    if (modifier === 'PM' && hours < 12) { hours += 12; }
    return { hours, minutes };
  }

 const isTimeSlotAvailable = (date: Date, timeStr: string) => {
    const isoDate = date.toISOString().split('T')[0];
    const dayUnavailableTimes = availability[isoDate] || [];
    if(dayUnavailableTimes.includes(timeStr)) return false;

    const { hours, minutes } = parseTimeString(timeStr);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);
    const bookingCutoff = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    return slotDateTime > bookingCutoff;
  };

  const formatDate = (date: Date) => date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatWeekRange = (dates: Date[]) => `${formatDate(dates[0])} - ${formatDate(dates[6])}`;

  const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if(!selectedDate || !selectedTime || !id){
          return showNotification("Please select a new date and time.", "error");
      }
      setIsSubmitting(true);
      await rescheduleAppointment(id, selectedDate, selectedTime);
      showNotification("Appointment rescheduled successfully!", "success");
      setTimeout(() => navigate('/account'), 1500);
  }

  if (!appointment) return <div>Loading...</div>;

  return (
    <div className="py-20 bg-grima-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="mb-4">
              <Link to="/account" className="text-gray-600 hover:text-gray-800 flex items-center">
                  <ChevronLeft size={16} /> Back to Dashboard
              </Link>
        </div>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reschedule Your Session</h1>
            <p className="text-gray-600 mb-8">You are rescheduling your <span className="font-semibold text-grima-primary">{appointment.service_type}</span>.</p>
            
            <div className="mb-8">
                <div className="flex justify-between items-baseline mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center"><Calendar className="h-6 w-6 text-grima-primary mr-2" />Select a New Date & Time</h2>
                    <p className="text-xs text-gray-500">Sessions must be booked at least 24 hours in advance.</p>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setCurrentWeek(currentWeek - 1)} disabled={currentWeek === 0} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} className="mr-1" />Previous Week</button>
                  <h3 className="text-lg font-semibold text-gray-900 text-center">{formatWeekRange(weekDates)}</h3>
                  <button onClick={() => setCurrentWeek(currentWeek + 1)} className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Next Week<ChevronRight size={16} className="ml-1" /></button>
                </div>
                 <div className="overflow-x-auto">
                  <div className="border border-gray-200 rounded-lg inline-block min-w-full">
                    <div className="grid grid-cols-8 bg-gray-50">
                      <div className="p-3 text-sm font-medium text-gray-700 border-r">Time</div>
                      {weekDates.map((date, index) => (
                        <div key={index} className="p-3 text-sm font-medium text-center text-gray-700 border-r last:border-r-0"><span className="text-grima-primary">{date.toLocaleDateString('en-CA', {weekday: 'short'})}</span><br/>{date.toLocaleDateString('en-CA', {month: 'short', day: 'numeric'})}</div>
                      ))}
                    </div>
                    <div>
                      {generateTimeSlots(weekDates[0]).map((time) => (
                        <div key={time} className="grid grid-cols-8 border-t">
                          <div className="p-3 text-xs text-gray-600 border-r bg-gray-50 font-medium">{time}</div>
                          {weekDates.map((date, dateIndex) => {
                            const available = isTimeSlotAvailable(date, time);
                            return (
                              <div key={dateIndex} className="border-r last:border-r-0">
                                {available ? (
                                  <button type="button" onClick={() => { setSelectedDate(date.toISOString().split('T')[0]); setSelectedTime(time); }}
                                    className={`w-full h-12 text-xs font-medium transition-colors ${selectedDate === date.toISOString().split('T')[0] && selectedTime === time ? 'bg-grima-primary text-white' : 'bg-grima-100 text-grima-800 hover:bg-grima-200'}`}>Available</button>
                                ) : (
                                  <div className="w-full h-12 bg-gray-100 border-gray-200 flex items-center justify-center"><span className="text-gray-400 text-xs">-</span></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
             </div>

             {selectedDate && selectedTime && (
                 <div className="pt-8 border-t">
                     <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Your New Session Time</h2>
                     <div className="mb-8 p-6 bg-grima-50 rounded-lg">
                        <div className="space-y-1 text-base">
                           <p><span className="text-black">Session:</span> <span className="text-gray-600">{appointment.service_type}</span></p>
                           <p><span className="text-black">New Date:</span> <span className="text-gray-600">{new Date(selectedDate).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                           <p><span className="text-black">New Time:</span> <span className="text-gray-600">{selectedTime}</span></p>
                        </div>
                    </div>
                     <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-grima-primary text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-grima-dark transition-colors flex items-center justify-center disabled:opacity-50">
                        {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}<ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReschedulePage;