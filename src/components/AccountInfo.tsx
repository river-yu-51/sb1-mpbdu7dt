import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Edit, Save } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

const AccountInfo = () => {
    const { user, updateUser } = useAuth();
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: ''});
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    
    const handleSaveDetails = () => {
        if (!user) return;
        
        updateUser(user.id, formData);
        showNotification("Account details updated successfully.", "success");
        setIsEditingDetails(false);
    };

    const handleChangePassword = () => {
        if(passwords.new !== passwords.confirm) return showNotification("New passwords do not match.", "error");
        if(passwords.new.length < 6) return showNotification("New password must be at least 6 characters long.", "error");
        showNotification("Password changed successfully!", "success");
        setPasswords({ current: '', new: '', confirm: '' });
        setIsChangingPassword(false);
    };

    if (!user) return null;

    return (
        <div className="space-y-10">
            <div className="bg-white p-6 rounded-lg shadow-md border">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                    {!isEditingDetails && <button onClick={() => setIsEditingDetails(true)} className="flex items-center text-sm font-medium text-grima-primary hover:underline"><Edit size={14} className="mr-1"/> Edit Details</button>}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <InputField label="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} disabled={!isEditingDetails} />
                    <InputField label="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} disabled={!isEditingDetails} />
                    <InputField label="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!isEditingDetails} type="email" />
                    <InputField label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={!isEditingDetails} type="tel" />
                 </div>
                 {isEditingDetails && <div className="mt-6 flex justify-end gap-4"><button onClick={() => setIsEditingDetails(false)} className="text-sm font-medium">Cancel</button><button onClick={handleSaveDetails} className="bg-grima-primary text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center"><Save size={16} className="mr-2"/>Save Changes</button></div>}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border">
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Security</h3>
                 {!isChangingPassword ? (
                    <button onClick={() => setIsChangingPassword(true)} className="text-sm text-grima-primary font-medium hover:underline">Change Password</button>
                 ) : (
                    <div className="mt-6 space-y-4">
                        <InputField label="Current Password" type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
                        <InputField label="New Password" type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
                        <InputField label="Confirm New Password" type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />
                        <div className="flex justify-end gap-4"><button onClick={() => setIsChangingPassword(false)} className="text-sm font-medium">Cancel</button><button onClick={handleChangePassword} className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">Update Password</button></div>
                    </div>
                 )}
            </div>
        </div>
    );
};

const InputField = ({ label, ...props } : any) => (
    <div>
        <label className="block text-xs font-medium text-gray-500">{label}</label>
        <input {...props} className="w-full mt-1 p-2 bg-transparent border-b-2 focus:outline-none focus:border-grima-primary disabled:border-gray-200 disabled:bg-gray-50" />
    </div>
);


export default AccountInfo;