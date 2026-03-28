import { axiosInstance } from '../lib/axios';
import type { User } from 'shared';

export interface SettingsProfile {
  id: string;
  name: string;
  email: string;
  businessName: string | null;
  logoUrl: string | null;
  currency: string;
  createdAt: string;
}

export async function getSettings(): Promise<SettingsProfile> {
  const { data } = await axiosInstance.get<SettingsProfile>('/api/settings');
  return data;
}

export async function updateProfile(payload: {
  name: string;
  businessName?: string;
  currency: string;
}): Promise<User> {
  const { data } = await axiosInstance.put<User>('/api/settings/profile', payload);
  return data;
}

export async function updatePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ message: string }> {
  const { data } = await axiosInstance.put<{ message: string }>('/api/settings/password', payload);
  return data;
}

export async function uploadLogo(file: File): Promise<SettingsProfile> {
  const formData = new FormData();
  formData.append('logo', file);
  const { data } = await axiosInstance.post<SettingsProfile>('/api/settings/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}

export async function deleteLogo(): Promise<SettingsProfile> {
  const { data } = await axiosInstance.delete<SettingsProfile>('/api/settings/logo');
  return data;
}
