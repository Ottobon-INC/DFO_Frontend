import React, { useState, useEffect } from 'react';
import { X, User, Lock, Save, Mail, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onProfileUpdate: (updatedUser: any) => void;
    showToast: (msg: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user, onProfileUpdate, showToast }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setName(user.name || '');
            setEmail(user.email || '');
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name) {
            showToast('Name cannot be empty');
            return;
        }
        try {
            setIsSaving(true);
            const res = await api.updateProfile({ name, email });
            if (res.success) {
                showToast('Profile updated successfully');
                // Update local storage with new token and user
                if (res.token) {
                    const updatedUser = { ...user, ...res.data, token: res.token };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    localStorage.setItem('token', res.token);
                    onProfileUpdate(updatedUser);
                }
                onClose();
            }
        } catch (err: any) {
            showToast(err.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-surface rounded-2xl w-full max-w-md shadow-2xl border border-brand-border overflow-hidden transform scale-100 animate-scale-up">
                <div className="flex justify-between items-center p-6 border-b border-brand-border">
                    <h2 className="text-xl font-bold text-brand-textPrimary flex items-center gap-2">
                        <User className="text-brand-primary" size={24} />
                        My Profile
                    </h2>
                    <button onClick={onClose} className="text-brand-textSecondary hover:text-red-600 transition-colors p-2 hover:bg-red-100 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-brand-textSecondary block">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 pl-10 text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                                placeholder="Enter your full name"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-brand-textSecondary block">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 pl-10 text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-brand-border flex justify-end gap-3 bg-brand-bg/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-brand-textSecondary hover:bg-brand-hover transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-brand-primary text-brand-bg rounded-xl font-bold hover:bg-brand-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-brand-primary/20"
                    >
                        {isSaving ? 'Saving...' : (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    showToast: (msg: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, showToast }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Please fill all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters long');
            return;
        }

        try {
            setIsSaving(true);
            const res = await api.changePassword({ currentPassword, newPassword });
            if (res.success) {
                showToast('Password updated successfully');
                onClose();
            }
        } catch (err: any) {
            showToast(err.message || 'Failed to update password');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-surface rounded-2xl w-full max-w-md shadow-2xl border border-brand-border overflow-hidden transform scale-100 animate-scale-up">
                <div className="flex justify-between items-center p-6 border-b border-brand-border">
                    <h2 className="text-xl font-bold text-brand-textPrimary flex items-center gap-2">
                        <Lock className="text-brand-primary" size={24} />
                        Change Password
                    </h2>
                    <button onClick={onClose} className="text-brand-textSecondary hover:text-red-600 transition-colors p-2 hover:bg-red-100 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-brand-textSecondary block">Current Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" size={18} />
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 pl-10 pr-10 text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                                placeholder="Enter current password"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textSecondary hover:text-brand-textPrimary transition-colors"
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-brand-textSecondary block">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" size={18} />
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 pl-10 pr-10 text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                                placeholder="Enter new password"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textSecondary hover:text-brand-textPrimary transition-colors"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-brand-textSecondary block">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-textSecondary" size={18} />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 pl-10 pr-10 text-brand-textPrimary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
                                placeholder="Confirm new password"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-textSecondary hover:text-brand-textPrimary transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-brand-border flex justify-end gap-3 bg-brand-bg/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-brand-textSecondary hover:bg-brand-hover transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-brand-primary text-brand-bg rounded-xl font-bold hover:bg-brand-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-brand-primary/20"
                    >
                        {isSaving ? 'Updating...' : (
                            <>
                                <Save size={18} />
                                Update Password
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
