"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  is_default: boolean;
}

export default function ProfilePage() {
  const { user: authUser, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        email: authUser.email || "",
        full_name: authUser.user_metadata?.full_name,
        phone: authUser.user_metadata?.phone,
        avatar_url: authUser.user_metadata?.avatar_url,
      });
    }
  }, [authUser]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return <div className="p-8">Please log in to view your profile</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold">My Profile</h1>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Profile Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <p className="mt-1 text-gray-900">{user.full_name || "Not set"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <p className="mt-1 text-gray-900">{user.phone || "Not set"}</p>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Saved Addresses</h2>
              {addresses.length === 0 ? (
                <p className="text-gray-500">No addresses saved yet</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="p-3 border border-gray-200 rounded"
                    >
                      <p className="font-medium">{address.name}</p>
                      <p className="text-sm text-gray-600">
                        {address.street}, {address.city}, {address.state}
                      </p>
                      <p className="text-sm text-gray-600">{address.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}