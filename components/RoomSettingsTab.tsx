import React, { useState } from 'react';
import { Settings, Plus, LayoutGrid, Bed, Hash, RefreshCcw } from 'lucide-react';
import { api } from '../services/api';

interface RoomSettingsTabProps {
  categories: any[];
  rooms: any[];
  onRefresh: () => void;
}

export const RoomSettingsTab: React.FC<RoomSettingsTabProps> = ({ categories, rooms, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'rooms' | 'beds'>('categories');
  const [isLoading, setIsLoading] = useState(false);

  // Forms State
  const [categoryName, setCategoryName] = useState('');
  const [categoryTier, setCategoryTier] = useState('basic');
  const [categoryRate, setCategoryRate] = useState('');

  const [roomName, setRoomName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomFloor, setRoomFloor] = useState('1');
  const [roomCapacity, setRoomCapacity] = useState('1');
  const [roomCategoryId, setRoomCategoryId] = useState('');

  const [bedIdentifier, setBedIdentifier] = useState('');
  const [bedRoomId, setBedRoomId] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.createRoomCategory({
        name: categoryName,
        tier: categoryTier,
        daily_rate: parseFloat(categoryRate) || 0
      });
      setCategoryName(''); setCategoryRate('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.createRoom({
        name: roomName,
        room_number: roomNumber,
        floor: roomFloor,
        capacity: parseInt(roomCapacity),
        category_id: roomCategoryId
      });
      setRoomName(''); setRoomNumber('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.createBed(bedRoomId, {
        bed_identifier: bedIdentifier
      });
      setBedIdentifier('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to create bed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-sm overflow-hidden flex flex-col md:flex-row h-[600px]">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-brand-bg border-r border-brand-border p-4 space-y-2">
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
            activeSubTab === 'categories' ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'text-brand-textSecondary hover:bg-brand-hover'
          }`}
        >
          <LayoutGrid size={18} />
          <span>Room Categories</span>
        </button>
        <button
          onClick={() => setActiveSubTab('rooms')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
            activeSubTab === 'rooms' ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'text-brand-textSecondary hover:bg-brand-hover'
          }`}
        >
          <Hash size={18} />
          <span>Physical Rooms</span>
        </button>
        <button
          onClick={() => setActiveSubTab('beds')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
            activeSubTab === 'beds' ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'text-brand-textSecondary hover:bg-brand-hover'
          }`}
        >
          <Bed size={18} />
          <span>Bed Management</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* CATEGORIES TAB */}
        {activeSubTab === 'categories' && (
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-lg font-bold text-brand-textPrimary flex items-center space-x-2">
              <LayoutGrid className="text-brand-primary" />
              <span>Create Room Category (Tier)</span>
            </h2>
            <form onSubmit={handleCreateCategory} className="bg-brand-bg p-6 rounded-xl border border-brand-border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-textSecondary mb-1">Category Name</label>
                  <input value={categoryName} onChange={e => setCategoryName(e.target.value)} required placeholder="e.g. Premium Single" className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-textPrimary focus:ring-2 focus:ring-brand-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-textSecondary mb-1">Tier</label>
                  <select value={categoryTier} onChange={e => setCategoryTier(e.target.value)} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-textPrimary focus:ring-2 focus:ring-brand-primary/50 outline-none">
                    <option value="premium">Premium</option>
                    <option value="basic">Basic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-textSecondary mb-1">Daily Rate ($)</label>
                  <input type="number" value={categoryRate} onChange={e => setCategoryRate(e.target.value)} required placeholder="1000" className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-textPrimary focus:ring-2 focus:ring-brand-primary/50 outline-none" />
                </div>
              </div>
              <button disabled={isLoading} type="submit" className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primaryDark transition-colors flex items-center space-x-2">
                <Plus size={16} /> <span>Create Category</span>
              </button>
            </form>

            {/* List Existing Categories */}
            <div className="mt-8 space-y-2">
              <h3 className="font-semibold text-brand-textSecondary">Existing Categories</h3>
              {categories.map(c => (
                <div key={c.id} className="p-3 bg-brand-bg rounded-lg border border-brand-border flex justify-between">
                  <div>
                    <span className="font-bold text-brand-textPrimary">{c.name}</span>
                    <span className="text-xs ml-2 px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded">{c.tier}</span>
                  </div>
                  <span className="text-brand-textSecondary">${c.daily_rate}/day</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROOMS TAB */}
        {activeSubTab === 'rooms' && (
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-lg font-bold text-brand-textPrimary flex items-center space-x-2">
              <Hash className="text-brand-primary" />
              <span>Create Physical Room</span>
            </h2>
            <form onSubmit={handleCreateRoom} className="bg-brand-bg p-6 rounded-xl border border-brand-border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-textSecondary mb-1">Room Name</label>
                  <input value={roomName} onChange={e => setRoomName(e.target.value)} required placeholder="e.g. Ward A" className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-textPrimary focus:ring-2 focus:ring-brand-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-textSecondary mb-1">Room Number</label>
                  <input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required placeholder="101" className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-textPrimary focus:ring-2 focus:ring-brand-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-textSecondary mb-1">Floor</label>
                  <input value={roomFloor} onChange={e => setRoomFloor(e.target.value)} required placeholder="1" className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-textPrimary focus:ring-2 focus:ring-brand-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-textSecondary mb-1">Max Capacity (Beds)</label>
                  <input type="number" min="1" value={roomCapacity} onChange={e => setRoomCapacity(e.target.value)} required className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-textPrimary focus:ring-2 focus:ring-brand-primary/50 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-brand-textSecondary mb-1">Category / Tier</label>
                  <select value={roomCategoryId} onChange={e => setRoomCategoryId(e.target.value)} required className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-textPrimary focus:ring-2 focus:ring-brand-primary/50 outline-none">
                    <option value="" disabled>Select a category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <button disabled={isLoading} type="submit" className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primaryDark transition-colors flex items-center space-x-2">
                <Plus size={16} /> <span>Create Room</span>
              </button>
            </form>
          </div>
        )}

        {/* BEDS TAB */}
        {activeSubTab === 'beds' && (
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-lg font-bold text-brand-textPrimary flex items-center space-x-2">
              <Bed className="text-brand-primary" />
              <span>Add Physical Bed to Room</span>
            </h2>
            <form onSubmit={handleCreateBed} className="bg-brand-bg p-6 rounded-xl border border-brand-border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-textSecondary mb-1">Target Room</label>
                  <select value={bedRoomId} onChange={e => setBedRoomId(e.target.value)} required className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-textPrimary focus:ring-2 focus:ring-brand-primary/50 outline-none">
                    <option value="" disabled>Select a room...</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name || r.room_number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-textSecondary mb-1">Bed Identifier</label>
                  <input value={bedIdentifier} onChange={e => setBedIdentifier(e.target.value)} required placeholder="e.g. Bed A, 101-1" className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-textPrimary focus:ring-2 focus:ring-brand-primary/50 outline-none" />
                </div>
              </div>
              <button disabled={isLoading} type="submit" className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primaryDark transition-colors flex items-center space-x-2">
                <Plus size={16} /> <span>Add Bed</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
