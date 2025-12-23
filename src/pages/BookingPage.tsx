import React, { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle, ArrowRight, ChevronLeft, ChevronRight, Info, Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext";
import { db, generateTimeSlots } from "../lib/database";

type AppointmentGroup = {
  groupName: string;
  duration?: string;
  isSingleService: boolean;
  services: { id: string; name: string; duration: string; price: string; description?: string }[];
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: string;
  password: string;
  confirmPassword: string;
  goals: string;
};

const BookingPage: React.FC = () => {
  const { user, addAppointment, register, appointments } = useAuth() as any;
  const appts = Array.isArray(appointments) ? appointments : [];

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [availability, setAvailability] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    password: "",
    confirmPassword: "",
    goals: "",
  });

  const appointmentGroups: AppointmentGroup[] = useMemo(
    () => [
      {
        groupName: "Initial Consultation",
        isSingleService: true,
        services: [
          {
            id: "initial",
            name: "Initial Consultation",
            duration: "60 min",
            price: "FREE",
            description: "A comprehensive assessment-based session to gauge your current financial situation",
          },
        ],
      },
      {
        groupName: "Informational Sessions",
        duration: "30-60 min",
        isSingleService: false,
        services: [
          { id: "spending", name: "Spending Habits", duration: "30-60 min", price: "$30" },
          { id: "budgeting", name: "Budgeting", duration: "30-60 min", price: "$30" },
          { id: "savings", name: "Interest Rates, Savings, & Loans", duration: "30-60 min", price: "$30" },
          { id: "credit", name: "Credit Cards", duration: "30-60 min", price: "$30" },
          { id: "investing-basics", name: "Investing", duration: "30-60 min", price: "$30" },
          { id: "taxes-accounts", name: "Taxes & Accounts", duration: "30-60 min", price: "$30" },
        ],
      },
      {
        groupName: "“Doing-Something” Sessions",
        duration: "30-60 min",
        isSingleService: false,
        services: [
          { id: "spreadsheet", name: '"The Spreadsheet"', duration: "30-60 min", price: "$30" },
          { id: "investing-setup", name: "Investing Setup/Review", duration: "30-60 min", price: "$30" },
          { id: "credit-setup", name: "Credit Card Setup/Review", duration: "30-60 min", price: "$30" },
          { id: "filing-taxes", name: "Filing Your Taxes", duration: "30-60 min", price: "$30" },
        ],
      },
      {
        groupName: "Maintenance Sessions",
        isSingleService: false,
        services: [
          { id: "maintenance-15", name: "Half-Length", duration: "15 min", price: "$20" },
          { id: "maintenance-30", name: "Full-Length", duration: "30 min", price: "$30" },
          { id: "maintenance-60", name: "Double-Length", duration: "60 min", price: "$40" },
        ],
      },
    ],
    []
  );

  const hasHadInitialConsult = useMemo(() => {
    return appts.some((apt: any) => apt.service_type === "Initial Consultation" && apt.status === "completed");
  }, [appts]);

  const hasBookedInitialConsult = useMemo(() => {
    return appts.some(
      (apt: any) =>
        apt.service_type === "Initial Consultation" && (apt.status === "scheduled" || apt.status === "completed")
    );
  }, [appts]);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      age: user.age ? String(user.age) : "",
    }));
  }, [user]);

  const handleServiceSelect = (serviceId: string) => {
    if (user) {
      if (serviceId === "initial" && hasBookedInitialConsult) {
        showNotification("You have already booked an Initial Consultation.", "error");
        return;
      }
      if (serviceId !== "initial" && !hasHadInitialConsult) {
        showNotification("Please complete an Initial Consultation before booking other sessions.", "error");
        return;
      }
    }
    setSelectedService(serviceId);
    setSelectedDate("");
    setSelectedTime("");
  };

  const generateWeekDates = (weekOffset: number) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // Sunday = 0
    startOfWeek.setDate(today.getDate() - dayOfWeek + weekOffset * 7);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = useMemo(() => generateWeekDates(currentWeek), [currentWeek]);

  useEffect(() => {
    let cancelled = false;

    const fetchAvailability = async () => {
      try {
        const availabilityData: Record<string, string[]> = {};
        for (const date of weekDates) {
          const isoDate = date.toISOString().split("T")[0];
          try {
            const blocked = await db.getAvailabilityForDate(isoDate);
            availabilityData[isoDate] = Array.isArray(blocked) ? blocked : [];
          } catch {
            availabilityData[isoDate] = [];
          }
        }
        if (!cancelled) setAvailability(availabilityData);
      } catch {
        if (!cancelled) setAvailability({});
      }
    };

    fetchAvailability();
    return () => {
      cancelled = true;
    };
  }, [weekDates]);

  const parseTimeString = (timeStr: string) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (hours === 12 && modifier === "AM") hours = 0;
    if (modifier === "PM" && hours < 12) hours += 12;
    return { hours, minutes };
  };

  const calculateEndTime = (startTimeStr: string, durationStr: string) => {
    if (!startTimeStr || !durationStr) return "";
    const { hours, minutes } = parseTimeString(startTimeStr);
    const durationInMinutes = parseInt(durationStr, 10);
    if (!Number.isFinite(durationInMinutes)) return "";

    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = new Date(startTime.getTime() + durationInMinutes * 60000);
    return endTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const isTimeSlotAvailable = (date: Date, timeStr: string) => {
    const isoDate = date.toISOString().split("T")[0];
    const dayUnavailableTimes = availability[isoDate] || [];
    if (dayUnavailableTimes.includes(timeStr)) return false;

    const { hours, minutes } = parseTimeString(timeStr);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);

    const bookingCutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return slotDateTime > bookingCutoff;
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });

  const formatWeekRange = (dates: Date[]) => `${formatDate(dates[0])} - ${formatDate(dates[6])}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getSelectedServiceInfo = () => {
    for (const group of appointmentGroups) {
      const service = group.services.find((s) => s.id === selectedService);
      if (service) return service;
    }
    return null;
  };

  const renderBookingSummary = () => {
    const serviceInfo = getSelectedServiceInfo();
    if (!serviceInfo || !selectedTime) return null;

    const endTimeFormatted = calculateEndTime(selectedTime, serviceInfo.duration);
    const timeRange = endTimeFormatted ? `${selectedTime} - ${endTimeFormatted}` : selectedTime;

    return (
      <div className="space-y-1 text-base">
        <p>
          <span className="text-black">Session:</span>{" "}
          <span className="text-gray-600">{serviceInfo.name}</span>
        </p>
        <p>
          <span className="text-black">Date:</span>{" "}
          <span className="text-gray-600">
            {new Date(selectedDate).toLocaleDateString("en-CA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </p>
        <p>
          <span className="text-black">Time:</span>{" "}
          <span className="text-gray-600">{timeRange}</span>
        </p>
        <p>
          <span className="text-black">Price:</span>{" "}
          <span className="text-grima-primary font-bold">{serviceInfo.price}</span>
        </p>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService || !selectedDate || !selectedTime) {
      showNotification("Please select a service, date, and time.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalUser = user;

      if (!user) {
        const { firstName, lastName, email, phone, age, password, confirmPassword } = formData;

        if (!firstName || !lastName || !email || !phone || !age || !password || !confirmPassword) {
          showNotification("Please fill out all required fields.", "error");
          return;
        }

        if (password !== confirmPassword) {
          showNotification("Passwords do not match.", "error");
          return;
        }

        const newUser = await register({
          firstName,
          lastName,
          email,
          password,
          age: parseInt(age, 10),
          phone,
        });

        if (!newUser) {
          showNotification("An account with this email may already exist. Please try logging in.", "error");
          return;
        }
        finalUser = newUser;
      }

      if (!finalUser) {
        showNotification("An error occurred. Please try again.", "error");
        return;
      }

      const selected = getSelectedServiceInfo();
      await addAppointment({
        user_id: finalUser.id,
        service_type: selected?.name || selectedService,
        date: selectedDate,
        time: selectedTime,
        notes: formData.goals || null,
      });

      showNotification("Booking successful! Redirecting to your dashboard.", "success");
      setTimeout(() => navigate("/account"), 1500);
    } catch (err) {
      console.error(err);
      showNotification("Booking failed. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-20 bg-grima-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Book Your Session</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Schedule your personalized financial coaching session.
          </p>
          {user && (
            <p className="mt-2 text-gray-600">
              Welcome back, {user.firstName}! Your information is pre-filled below.
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <CheckCircle className="h-6 w-6 text-grima-primary mr-2" />
                Select Appointment Type
              </h2>

              <div className="space-y-4">
                {appointmentGroups.map((group) => (
                  <div key={group.groupName} className="border border-gray-200 rounded-lg">
                    {group.isSingleService ? (
                      group.services.map((service) => (
                        <label
                          key={service.id}
                          className={`block p-4 cursor-pointer transition-colors rounded-lg ${
                            selectedService === service.id
                              ? "border-grima-primary bg-grima-50 border-2"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="service"
                            value={service.id}
                            checked={selectedService === service.id}
                            onChange={(e) => handleServiceSelect(e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900 flex items-center">
                              {service.name}{" "}
                              <span className="text-sm text-gray-500 ml-2 font-normal">({service.duration})</span>
                            </h3>
                            <span className="font-bold text-grima-primary">{service.price}</span>
                          </div>
                          {service.description && <p className="text-sm text-gray-600 mt-1">{service.description}</p>}
                        </label>
                      ))
                    ) : (
                      <div>
                        <div className="p-4 bg-gray-50 border-b">
                          <h3 className="font-semibold text-gray-900">
                            {group.groupName}
                            {group.duration && (
                              <span className="font-normal text-sm text-gray-500 ml-2">({group.duration})</span>
                            )}
                          </h3>
                        </div>
                        <div className="p-2">
                          {group.services.map((option) => (
                            <label
                              key={option.id}
                              className={`block p-3 cursor-pointer rounded ${
                                selectedService === option.id ? "bg-grima-100" : "hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="service"
                                value={option.id}
                                checked={selectedService === option.id}
                                onChange={(e) => handleServiceSelect(e.target.value)}
                                className="sr-only"
                              />
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">{option.name}</span>
                                  {!group.duration && (
                                    <span className="text-sm text-gray-500 ml-2">({option.duration})</span>
                                  )}
                                </div>
                                <span className="font-semibold">{option.price}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedService && (
              <div className="mb-8">
                <div className="flex justify-between items-baseline mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Calendar className="h-6 w-6 text-grima-primary mr-2" />
                    Select Date & Time
                  </h2>
                  <p className="text-xs text-gray-500">Sessions must be booked at least 24 hours in advance.</p>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setCurrentWeek((w) => w - 1)}
                    disabled={currentWeek === 0}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous Week
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900 text-center">{formatWeekRange(weekDates)}</h3>
                  <button
                    onClick={() => setCurrentWeek((w) => w + 1)}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Next Week
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <div className="border border-gray-200 rounded-lg inline-block min-w-full">
                    <div className="grid grid-cols-8 bg-gray-50">
                      <div className="p-3 text-sm font-medium text-gray-700 border-r">Time</div>
                      {weekDates.map((date) => (
                        <div
                          key={date.toISOString()}
                          className="p-3 text-sm font-medium text-center text-gray-700 border-r last:border-r-0"
                        >
                          <span className="text-grima-primary">
                            {date.toLocaleDateString("en-CA", { weekday: "short" })}
                          </span>
                          <br />
                          {date.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                        </div>
                      ))}
                    </div>

                    <div>
                      {generateTimeSlots(weekDates[0]).map((time: string) => (
                        <div key={time} className="grid grid-cols-8 border-t">
                          <div className="p-3 text-xs text-gray-600 border-r bg-gray-50 font-medium">{time}</div>

                          {weekDates.map((date) => {
                            const available = isTimeSlotAvailable(date, time);
                            const iso = date.toISOString().split("T")[0];

                            return (
                              <div key={date.toISOString()} className="border-r last:border-r-0">
                                {available ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDate(iso);
                                      setSelectedTime(time);
                                    }}
                                    className={`w-full h-12 text-xs font-medium transition-colors ${
                                      selectedDate === iso && selectedTime === time
                                        ? "bg-grima-primary text-white"
                                        : "bg-grima-100 text-grima-800 hover:bg-grima-200"
                                    }`}
                                  >
                                    Available
                                  </button>
                                ) : (
                                  <div className="w-full h-12 bg-gray-100 border-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">-</span>
                                  </div>
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
            )}

            {selectedDate && selectedTime && (
              <form onSubmit={handleSubmit} noValidate>
                <div className="pt-8 border-t">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {user ? "Confirm Your Information" : "Create Your Account & Book"}
                  </h2>

                  <div className="mb-8 p-6 bg-grima-50 rounded-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h3>
                    {renderBookingSummary()}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <InputField label="First Name *" name="firstName" value={formData.firstName} onChange={handleInputChange} disabled={!!user} />
                    <InputField label="Last Name *" name="lastName" value={formData.lastName} onChange={handleInputChange} disabled={!!user} />
                    <InputField label="Email *" name="email" type="email" value={formData.email} onChange={handleInputChange} disabled={!!user} />
                    <InputField label="Phone Number *" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
                    <InputField label="Age *" name="age" type="select" value={formData.age} onChange={handleInputChange} disabled={!!user}>
                      <option value="">Select age</option>
                      {Array.from({ length: 11 }, (_, i) => i + 15).map((age) => (
                        <option key={age} value={age}>
                          {age}
                        </option>
                      ))}
                    </InputField>
                  </div>

                  {!user && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
                      <InputField
                        label="Create Password *"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        minLength={6}
                        icon={<Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
                      />
                      <InputField
                        label="Confirm Password *"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        icon={<Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
                      />
                    </div>
                  )}

                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What are your main financial goals? (Optional)
                    </label>
                    <textarea
                      name="goals"
                      value={formData.goals}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="Tell us what you hope to achieve..."
                    />
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-r-lg mb-8">
                    <div className="flex">
                      <div className="py-1">
                        <Info size={20} className="mr-3" />
                      </div>
                      <div>
                        <p className="font-bold">Payment Information</p>
                        <p className="text-sm">
                          No upfront payment is required. Payment will be arranged at the end of your coaching session (if applicable).
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-grima-primary text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-grima-dark transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {isSubmitting ? "Booking..." : "Confirm Session"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> &
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    type?: "text" | "email" | "tel" | "password" | "select";
    children?: React.ReactNode;
    icon?: React.ReactNode;
  };

const InputField: React.FC<InputFieldProps> = ({ label, type = "text", children, icon, ...props }) => {
  const isSelect = type === "select";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        {icon}
        {isSelect ? (
          <select {...(props as any)} className={`w-full p-3 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 ${icon ? "pl-10" : ""}`}>
            {children}
          </select>
        ) : (
          <input type={type} {...(props as any)} className={`w-full p-3 border border-gray-300 rounded-lg disabled:bg-gray-100 ${icon ? "pl-10" : ""}`} />
        )}
      </div>
    </div>
  );
};

export default BookingPage;
