import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Edit, Save } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";
import { supabase } from "../lib/supabase";

type ProfileUpdate = {
  first: string | null;
  last: string | null;
  phone: string | null;
};

const AccountInfo = () => {
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState<ProfileUpdate>({
    first: null,
    last: null,
    phone: null,
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Keep form in sync once user loads / changes
  useEffect(() => {
    if (!user) return;
    setFormData({
      first: (user as any).first ?? null,
      last: (user as any).last ?? null,
      phone: (user as any).phone ?? null,
    });
  }, [user]);

  if (!user) return null;

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const ok = await updateUser(user.id, {
        first: formData.first?.trim() || null,
        last: formData.last?.trim() || null,
        phone: formData.phone?.trim() || null,
      } as any);

      if (!ok) {
        showNotification("Failed to update account details.", "error");
        return;
      }

      showNotification("Account details updated successfully.", "success");
      setIsEditingDetails(false);
    } catch (e) {
      console.error(e);
      showNotification("Failed to update account details.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm)
      return showNotification("New passwords do not match.", "error");
    if (passwords.new.length < 6)
      return showNotification("New password must be at least 6 characters long.", "error");

    // Supabase password change requires a valid session
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) {
        console.error(error);
        showNotification(error.message || "Password update failed.", "error");
        return;
      }

      showNotification("Password changed successfully!", "success");
      setPasswords({ current: "", new: "", confirm: "" });
      setIsChangingPassword(false);
    } catch (e) {
      console.error(e);
      showNotification("Password update failed.", "error");
    }
  };

  // Display helpers (support either shape)
  const displayFirst = (user as any).firstName ?? (user as any).first ?? "";
  const displayLast = (user as any).lastName ?? (user as any).last ?? "";

  return (
    <div className="space-y-10">
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
          {!isEditingDetails && (
            <button
              onClick={() => setIsEditingDetails(true)}
              className="flex items-center text-sm font-medium text-grima-primary hover:underline"
            >
              <Edit size={14} className="mr-1" /> Edit Details
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <InputField
            label="First Name"
            value={formData.first ?? displayFirst}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, first: e.target.value })
            }
            disabled={!isEditingDetails || saving}
          />
          <InputField
            label="Last Name"
            value={formData.last ?? displayLast}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, last: e.target.value })
            }
            disabled={!isEditingDetails || saving}
          />

          {/* Email: show, but do not edit here */}
          <InputField label="Email Address" value={user.email ?? ""} disabled />

          <InputField
            label="Phone Number"
            value={formData.phone ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            disabled={!isEditingDetails || saving}
            type="tel"
          />
        </div>

        {isEditingDetails && (
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={() => {
                setIsEditingDetails(false);
                setFormData({
                  first: (user as any).first ?? null,
                  last: (user as any).last ?? null,
                  phone: (user as any).phone ?? null,
                });
              }}
              className="text-sm font-medium"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDetails}
              disabled={saving}
              className="bg-grima-primary text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center disabled:opacity-50"
            >
              <Save size={16} className="mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Security</h3>

        {!isChangingPassword ? (
          <button
            onClick={() => setIsChangingPassword(true)}
            className="text-sm text-grima-primary font-medium hover:underline"
          >
            Change Password
          </button>
        ) : (
          <div className="mt-6 space-y-4">
            {/* current password is optional; kept for UX but not required by Supabase */}
            <InputField
              label="Current Password (optional)"
              type="password"
              value={passwords.current}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPasswords({ ...passwords, current: e.target.value })
              }
            />
            <InputField
              label="New Password"
              type="password"
              value={passwords.new}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPasswords({ ...passwords, new: e.target.value })
              }
            />
            <InputField
              label="Confirm New Password"
              type="password"
              value={passwords.confirm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPasswords({ ...passwords, confirm: e.target.value })
              }
            />
            <div className="flex justify-end gap-4">
              <button onClick={() => setIsChangingPassword(false)} className="text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
              >
                Update Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InputField = ({ label, ...props }: any) => (
  <div>
    <label className="block text-xs font-medium text-gray-500">{label}</label>
    <input
      {...props}
      className="w-full mt-1 p-2 bg-transparent border-b-2 focus:outline-none focus:border-grima-primary disabled:border-gray-200 disabled:bg-gray-50"
    />
  </div>
);

export default AccountInfo;
