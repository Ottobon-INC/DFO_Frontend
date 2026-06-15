import React, { useState } from 'react';
import {
    Users, Calendar, FileText, Link, Plus, Settings,
    Shield, UserPlus, Database, Mail, DollarSign, CreditCard, Download
} from 'lucide-react';

export const SettingsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'resources' | 'templates' | 'integrations' | 'financial' | 'audit'>('users');

    return (
        <div className="flex h-full gap-6">
            {/* Settings Sidebar */}
            <div className="w-64 flex-shrink-0 flex flex-col gap-2">
                <div className="bg-brand-surface p-4 rounded-2xl shadow-sm border border-brand-border h-full">
                    <h3 className="font-bold text-brand-textPrimary mb-6 px-4 flex items-center">
                        <Settings size={20} className="mr-2 text-brand-primary" /> Configuration
                    </h3>
                    <nav className="space-y-2">
                        <SettingsTab
                            icon={<Users size={18} />}
                            label="User Management"
                            active={activeTab === 'users'}
                            onClick={() => setActiveTab('users')}
                        />
                        <SettingsTab
                            icon={<Calendar size={18} />}
                            label="Resources & Rooms"
                            active={activeTab === 'resources'}
                            onClick={() => setActiveTab('resources')}
                        />
                        <SettingsTab
                            icon={<FileText size={18} />}
                            label="Templates (SMS/Email)"
                            active={activeTab === 'templates'}
                            onClick={() => setActiveTab('templates')}
                        />
                        <SettingsTab
                            icon={<Link size={18} />}
                            label="Integrations"
                            active={activeTab === 'integrations'}
                            onClick={() => setActiveTab('integrations')}
                        />
                        <SettingsTab
                            icon={<DollarSign size={18} />}
                            label="Financial Setup"
                            active={activeTab === 'financial'}
                            onClick={() => setActiveTab('financial')}
                        />
                        <SettingsTab
                            icon={<Shield size={18} />}
                            label="System Audit Log"
                            active={activeTab === 'audit'}
                            onClick={() => setActiveTab('audit')}
                        />
                    </nav>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-brand-surface rounded-2xl shadow-sm border border-brand-border p-8 overflow-y-auto custom-scrollbar">

                {activeTab === 'users' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-brand-textPrimary">User Management</h2>
                                <p className="text-brand-textSecondary mt-1">Manage staff access, roles, and permissions.</p>
                            </div>
                            <button className="bg-brand-primary text-brand-bg text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-primary/20 flex items-center hover:bg-brand-secondary transition-colors">
                                <UserPlus size={18} className="mr-2" /> Add New User
                            </button>
                        </div>

                        <div className="border border-brand-border rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-brand-bg border-b border-brand-border">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Name</th>
                                        <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Role</th>
                                        <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Status</th>
                                        <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Last Active</th>
                                        <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border">
                                    {[1, 2, 3].map((i) => (
                                        <tr key={i} className="hover:bg-brand-bg/50 transition-colors">
                                            <td className="p-4 font-bold text-brand-textPrimary">Dr. Sarah Sharma</td>
                                            <td className="p-4 text-sm text-brand-textSecondary">Doctor (IVF)</td>
                                            <td className="p-4"><span className="bg-brand-success/10 text-brand-success text-xs font-bold px-2 py-1 rounded border border-brand-success/20">Active</span></td>
                                            <td className="p-4 text-sm text-brand-textSecondary">2 mins ago</td>
                                            <td className="p-4">
                                                <button className="text-brand-primary font-bold text-xs hover:underline">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-brand-textPrimary">Resources & Rooms</h2>
                                <p className="text-brand-textSecondary mt-1">Manage clinic rooms, equipment, and scheduling resources.</p>
                            </div>
                            <button className="bg-brand-primary text-brand-bg text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-primary/20 flex items-center hover:bg-brand-secondary transition-colors">
                                <Plus size={18} className="mr-2" /> Add Resource
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            {['Consultation Room 1', 'Ultrasound Room', 'OT 1', 'Recovery Ward'].map((room, i) => (
                                <div key={i} className="p-6 border border-brand-border rounded-xl hover:border-brand-primary transition-colors cursor-pointer group bg-brand-bg">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-brand-surface rounded-lg text-brand-textSecondary group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors">
                                            <Database size={24} />
                                        </div>
                                        <span className="bg-brand-success/10 text-brand-success text-[10px] font-bold px-2 py-1 rounded border border-brand-success/20">Available</span>
                                    </div>
                                    <h4 className="font-bold text-brand-textPrimary">{room}</h4>
                                    <p className="text-xs text-brand-textSecondary mt-1">Capacity: 1 Patient</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'templates' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-brand-textPrimary">Communication Templates</h2>
                                <p className="text-brand-textSecondary mt-1">Edit SMS and Email templates for automated alerts.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {['Appointment Confirmation', 'Payment Reminder', 'Lab Result Ready', 'Follow-up Call'].map((template, i) => (
                                <div key={i} className="p-4 border border-brand-border rounded-xl flex justify-between items-center hover:bg-brand-bg transition-colors bg-brand-bg/50">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-brand-textPrimary">{template}</h4>
                                            <p className="text-xs text-brand-textSecondary">Last updated: 2 days ago</p>
                                        </div>
                                    </div>
                                    <button className="text-brand-primary font-bold text-sm border border-brand-primary/30 px-4 py-2 rounded-lg hover:bg-brand-primary/10">Edit Template</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'integrations' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-brand-textPrimary">System Integrations</h2>
                                <p className="text-brand-textSecondary mt-1">Manage connections with external services.</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="p-6 border border-brand-border rounded-xl flex justify-between items-center bg-brand-bg">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-brand-success/10 rounded-xl flex items-center justify-center text-brand-success font-bold text-xl border border-brand-success/20">W</div>
                                    <div>
                                        <h4 className="font-bold text-brand-textPrimary text-lg">WhatsApp Business API</h4>
                                        <p className="text-sm text-brand-textSecondary">Connected • Sending from +91 98765 43210</p>
                                    </div>
                                </div>
                                <button className="text-brand-textSecondary font-bold text-sm border border-brand-border px-4 py-2 rounded-lg hover:bg-brand-surface">Configure</button>
                            </div>
                            <div className="p-6 border border-brand-border rounded-xl flex justify-between items-center opacity-70 bg-brand-bg">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary font-bold text-xl border border-brand-primary/20">T</div>
                                    <div>
                                        <h4 className="font-bold text-brand-textPrimary text-lg">Tally Prime / ERP</h4>
                                        <p className="text-sm text-brand-textSecondary">Disconnected • Last sync failed</p>
                                    </div>
                                </div>
                                <button className="text-brand-primary font-bold text-sm border border-brand-primary/30 px-4 py-2 rounded-lg hover:bg-brand-primary/10">Reconnect</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financial' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-brand-textPrimary">Financial Setup</h2>
                                <p className="text-brand-textSecondary mt-1">Manage treatment packages and payment plans.</p>
                            </div>
                            <button className="bg-brand-primary text-brand-bg text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-primary/20 flex items-center hover:bg-brand-secondary transition-colors">
                                <Plus size={18} className="mr-2" /> Add Package
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 border border-brand-border rounded-xl bg-brand-bg">
                                <h3 className="font-bold text-brand-textPrimary mb-4 flex items-center"><DollarSign size={18} className="mr-2 text-brand-primary" /> Treatment Packages</h3>
                                <div className="space-y-3">
                                    <div className="bg-brand-surface p-3 rounded-lg border border-brand-border shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-brand-textPrimary text-sm">IVF Standard Cycle</p>
                                            <p className="text-xs text-brand-textSecondary">Includes meds & transfer</p>
                                        </div>
                                        <span className="font-bold text-brand-textPrimary">₹ 1.5L</span>
                                    </div>
                                    <div className="bg-brand-surface p-3 rounded-lg border border-brand-border shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-brand-textPrimary text-sm">IUI Procedure</p>
                                            <p className="text-xs text-brand-textSecondary">Single cycle</p>
                                        </div>
                                        <span className="font-bold text-brand-textPrimary">₹ 15k</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border border-brand-border rounded-xl bg-brand-bg">
                                <h3 className="font-bold text-brand-textPrimary mb-4 flex items-center"><CreditCard size={18} className="mr-2 text-brand-secondary" /> Payment Plans</h3>
                                <div className="space-y-3">
                                    <div className="bg-brand-surface p-3 rounded-lg border border-brand-border shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-brand-textPrimary text-sm">3-Month EMI</p>
                                            <p className="text-xs text-brand-textSecondary">0% Interest</p>
                                        </div>
                                        <span className="text-xs font-bold bg-brand-success/10 text-brand-success px-2 py-1 rounded border border-brand-success/20">Active</span>
                                    </div>
                                    <div className="bg-brand-surface p-3 rounded-lg border border-brand-border shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-brand-textPrimary text-sm">Bajaj Finserv</p>
                                            <p className="text-xs text-brand-textSecondary">Third-party financing</p>
                                        </div>
                                        <span className="text-xs font-bold bg-brand-success/10 text-brand-success px-2 py-1 rounded border border-brand-success/20">Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-brand-textPrimary">System Audit Log</h2>
                                <p className="text-brand-textSecondary mt-1">Track all critical system actions and security events.</p>
                            </div>
                            <button className="text-brand-textSecondary font-bold text-sm border border-brand-border px-4 py-2 rounded-lg hover:bg-brand-bg flex items-center">
                                <Download size={18} className="mr-2" /> Export Log
                            </button>
                        </div>

                        <div className="border border-brand-border rounded-xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-brand-bg border-b border-brand-border">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Timestamp</th>
                                        <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">User</th>
                                        <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Action</th>
                                        <th className="p-4 text-xs font-bold text-brand-textSecondary uppercase">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border">
                                    {[
                                        { time: 'Today, 10:45 AM', user: 'Admin', action: 'User Role Change', details: 'Changed Dr. Smith to Admin' },
                                        { time: 'Today, 09:30 AM', user: 'Front Desk', action: 'New Patient', details: 'Created file for Sarah J.' },
                                        { time: 'Yesterday, 4:15 PM', user: 'System', action: 'Backup', details: 'Daily database backup completed' },
                                        { time: 'Yesterday, 2:00 PM', user: 'CRO Anjali', action: 'Lead Status', details: 'Marked Lead #402 as Dropped' },
                                    ].map((log, i) => (
                                        <tr key={i} className="hover:bg-brand-bg/50 transition-colors">
                                            <td className="p-4 text-xs font-bold text-brand-textSecondary">{log.time}</td>
                                            <td className="p-4 text-sm font-bold text-brand-textPrimary">{log.user}</td>
                                            <td className="p-4 text-sm text-brand-textSecondary"><span className="bg-brand-bg px-2 py-1 rounded text-xs font-bold border border-brand-border">{log.action}</span></td>
                                            <td className="p-4 text-sm text-brand-textSecondary">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SettingsTab: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active
            ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20'
            : 'text-brand-textSecondary hover:bg-brand-bg hover:text-brand-textPrimary font-medium'
            }`}
    >
        {icon}
        <span className="text-sm">{label}</span>
    </div>
);
