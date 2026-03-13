'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  Activity, 
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Shield,
  BarChart3
} from 'lucide-react';
import { api } from '@/lib/api';

interface Agency {
  id: number;
  name: string;
  plan: string;
  is_active: boolean;
  user_count: number;
  task_count: number;
  active_task_count: number;
  latest_activity: string;
  created_at: string;
  telegram_groups: Array<{
    id: number;
    chat_id: string;
    title: string;
  }>;
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  agency: {
    id: number;
    name: string;
    plan: string;
  };
  last_login: string | null;
  created_at: string;
  task_count: number;
}

interface DashboardStats {
  system_stats: {
    total_agencies: number;
    active_agencies: number;
    total_users: number;
    active_users: number;
    total_tasks: number;
    active_tasks: number;
  };
  recent_activity: {
    new_agencies_30d: number;
    new_users_30d: number;
    new_tasks_30d: number;
  };
  top_agencies: Array<{
    id: number;
    name: string;
    plan: string;
    task_count: number;
    is_active: boolean;
  }>;
}

export default function AdminPanel() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'dashboard' | 'agencies' | 'users' | 'tasks'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('session_token');
      if (!token) {
        router.push('/');
        return;
      }
      
      const response = await api.verifySession(token);
      if (!response.user.is_super_admin) {
        router.push('/');
        return;
      }
      setUser(response.user);
      loadDashboard();
    } catch (error) {
      router.push('/');
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, agenciesRes, usersRes] = await Promise.all([
        fetch('/api/v1/admin/dashboard/overview/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
        }),
        fetch('/api/v1/admin/agencies/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
        }),
        fetch('/api/v1/admin/users/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
        })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (agenciesRes.ok) setAgencies(await agenciesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgencyStatus = async (agencyId: number) => {
    try {
      const response = await fetch(`/api/v1/admin/agencies/${agencyId}/toggle_active/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('session_token')}` }
      });
      
      if (response.ok) {
        loadDashboard(); // Reload data
      }
    } catch (error) {
      console.error('Failed to toggle agency status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'system': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <Button 
                variant="outline" 
                onClick={() => router.push('/')}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex space-x-1 mb-8">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { key: 'agencies', label: 'Agencies', icon: Building2 },
            { key: 'users', label: 'Users', icon: Users },
            { key: 'tasks', label: 'Tasks', icon: Activity }
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={currentView === key ? 'default' : 'ghost'}
              onClick={() => setCurrentView(key as any)}
              className="flex items-center space-x-2"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Button>
          ))}
        </div>

        {/* Dashboard View */}
        {currentView === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.system_stats.total_agencies}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.system_stats.active_agencies} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.system_stats.total_users}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.system_stats.active_users} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.system_stats.total_tasks}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.system_stats.active_tasks} active
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Agencies */}
            <Card>
              <CardHeader>
                <CardTitle>Top Agencies by Task Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.top_agencies.map((agency) => (
                    <div key={agency.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{agency.name}</p>
                          <Badge className={getPlanBadgeColor(agency.plan)}>
                            {agency.plan}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{agency.task_count} tasks</p>
                        <p className={`text-sm ${agency.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {agency.is_active ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agencies View */}
        {currentView === 'agencies' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Agencies Management</h2>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Agency</span>
              </Button>
            </div>

            <div className="grid gap-6">
              {agencies.map((agency) => (
                <Card key={agency.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium">{agency.name}</h3>
                          <Badge className={getPlanBadgeColor(agency.plan)}>
                            {agency.plan}
                          </Badge>
                          <Badge variant={agency.is_active ? 'default' : 'secondary'}>
                            {agency.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Users:</span> {agency.user_count}
                          </div>
                          <div>
                            <span className="font-medium">Tasks:</span> {agency.task_count} 
                            ({agency.active_task_count} active)
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {formatDate(agency.created_at)}
                          </div>
                          <div>
                            <span className="font-medium">Telegram Groups:</span> {agency.telegram_groups.length}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={agency.is_active ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => toggleAgencyStatus(agency.id)}
                        >
                          {agency.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Users View */}
        {currentView === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Users Management</h2>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add User</span>
              </Button>
            </div>

            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{user.username}</h3>
                          <span className="text-sm text-gray-600">{user.email}</span>
                          {user.is_admin && (
                            <Badge variant="secondary">Admin</Badge>
                          )}
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Agency:</span> {user.agency.name}
                          </div>
                          <div>
                            <span className="font-medium">Plan:</span> {user.agency.plan}
                          </div>
                          <div>
                            <span className="font-medium">Last Login:</span> {
                              user.last_login ? formatDate(user.last_login) : 'Never'
                            }
                          </div>
                          <div>
                            <span className="font-medium">Tasks:</span> {user.task_count}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tasks View */}
        {currentView === 'tasks' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Tasks Overview</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600">Task management interface coming soon...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}