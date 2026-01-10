import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { endpoints } from '../config';
import { fetchWithAuth } from '../utils/apiClient';
import type { User as UserType } from '../types/auth';

export const Profile: React.FC = () => {
    const { token } = useAuth();
    const [profile, setProfile] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetchWithAuth(endpoints.profile);

                const data = await response.json();
                if (data.success && data.data) {
                    setProfile(data.data);
                } else {
                    setError('Failed to load profile data');
                }
            } catch (err) {
                console.error(err);
                setError('An error occurred while fetching profile');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchProfile();
        }
    }, [token]);

    if (loading) {
        return <div className="flex h-64 items-center justify-center">Loading profile...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (!profile) {
        return <div>No profile found.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>

            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
                <div className="bg-primary-50 px-6 py-8 flex flex-col items-center border-b border-gray-200">
                    <div className="h-24 w-24 rounded-full bg-white p-1 shadow-sm mb-4">
                        <div className="h-full w-full rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                            <User className="h-12 w-12" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-gray-500 capitalize">{profile.type}</p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                        <div className="flex items-center gap-3 text-gray-900">
                            <Mail className="h-5 w-5 text-gray-400" />
                            {profile.email}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</label>
                        <div className="flex items-center gap-3 text-gray-900">
                            <Phone className="h-5 w-5 text-gray-400" />
                            {profile.phone}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</label>
                        <div className="flex items-center gap-3 text-gray-900">
                            <Shield className="h-5 w-5 text-gray-400" />
                            <span className="capitalize">{profile.role || profile.type}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Joined At</label>
                        <div className="flex items-center gap-3 text-gray-900">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            {new Date(profile.created_at).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address</label>
                        <div className="flex items-center gap-3 text-gray-900">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            {profile.address || 'No address provided'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
