'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Agency, MonitorTask } from '@/lib/api';
import TaskModal from '@/components/TaskModal';
import TaskCard from '@/components/TaskCard';
import LogsView from '@/components/LogsView';
import Sidebar from '@/components/Sidebar';
import LoginPage from '@/components/LoginPage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronRight,
  Globe,
  Activity,
  Zap,
  BarChart3,
  Building2,
  LogOut,
  Shield
} from 'lucide-react';
import { ModeToggle } from '@/components/ThemeToggle';

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<MonitorTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'logs' | 'settings'>('matrix');
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentAgency) {
      loadTasks();
    }
  }, [isAuthenticated, currentAgency]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const storedAgency = localStorage.getItem('agency');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedAgency && storedUser) {
        // Verify session is still valid
        const response = await api.verifySession(token);
        
        setSessionToken(token);
        setCurrentAgency(response.agency);
        setCurrentUser(response.user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid session
      localStorage.removeItem('session_token');
      localStorage.removeItem('agency');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (token: string, agency: Agency) => {
    setSessionToken(token);
    setCurrentAgency(agency);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      if (sessionToken) {
        await api.logout(sessionToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('session_token');
      localStorage.removeItem('agency');
      localStorage.removeItem('user');
      setSessionToken(null);
      setCurrentAgency(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  const loadTasks = async () => {
    if (!currentAgency) return;
    
    try {
      const tasksData = await api.getTasks(currentAgency.id);
      console.log('✅ Tasks loaded for agency:', currentAgency.name, tasksData.length, 'tasks');
      setTasks(tasksData);
    } catch (error) {
      console.error('❌ Failed to load tasks:', error);
    }
  };

  const refreshTasks = async () => {
    if (!currentAgency) return;
    try {
      const tasksData = await api.getTasks(currentAgency.id);
      setTasks(tasksData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      setTasks(tasks.filter(t => t.id !== taskId));
      await api.deleteTask(taskId);
    } catch (err) {
      console.error(err);
      alert('Failed to delete task');
      refreshTasks();
    }
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0F0F0F] border border-[#262626] flex items-center justify-center">
            <Activity className="w-6 h-6 text-[#00E37C] animate-pulse" />
          </div>
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-[#888888]">Loading Dashboard</div>
        </div>
      </div>
    );
  }

  if (!currentAgency) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="text-center">
          <p className="text-white mb-4">No agency found</p>
          <button onClick={handleLogout} className="btn-primary">
            Logout
          </button>
        </div>
      </div>
    );
  }

  const activeTasks = tasks.filter(t => t.is_active).length;
  const totalTasks = tasks.length;
  const taskLimit = currentAgency.plan === 'free' ? 2 : currentAgency.plan === 'pro' ? 10 : 50;

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#050505]">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        className="flex-shrink-0 z-20"
      />

      <main className="flex-1 overflow-y-auto relative">
        <div className="p-8 lg:p-12 max-w-[1600px] mx-auto min-h-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-start mb-10"
          >
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-[#888888] mb-3">
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-white">{currentAgency.name}</span>
              </div>
              <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
                {currentAgency.name}
              </h1>
              <p className="text-[#888888] max-w-xl">
                Live status of all automated ticket checking tasks for this agency.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 bg-[#0F0F0F] border border-[#262626] rounded-full flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${tasks.length >= taskLimit ? 'bg-red-500' : 'bg-[#00E37C]'}`}></div>
                <span className="text-sm font-medium text-[#888888]">
                  {tasks.length}/{taskLimit} Monitors
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-[#00E37C]/10 text-[#00E37C] rounded-full uppercase font-semibold">
                  {currentAgency.plan}
                </span>
              </div>
              
              {currentUser?.is_super_admin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="h-10 px-4 rounded-lg bg-red-600 border border-red-500 text-white text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="h-10 px-4 rounded-lg bg-[#1a1a1a] border border-[#262626] text-[#888888] text-sm font-medium hover:text-white hover:border-[#404040] transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
              
              <ModeToggle />
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                disabled={tasks.length >= taskLimit}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>New Monitor</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            <div className="bento-card !p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00E37C]/10 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#00E37C]" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-white">{activeTasks}</div>
                  <div className="text-sm text-[#888888]">Active</div>
                </div>
              </div>
            </div>
            <div className="bento-card !p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-semibold text-white">{totalTasks}</div>
                  <div className="text-sm text-[#888888]">Total Tasks</div>
                </div>
              </div>
            </div>
            <div className="bento-card !p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-white capitalize">{currentAgency.plan}</div>
                  <div className="text-sm text-[#888888]">Plan</div>
                </div>
              </div>
            </div>
            <div className="bento-card !p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">
                    {tasks.filter(t => t.last_status === 'available').length > 0 ? 
                      `${Math.round((tasks.filter(t => t.last_status === 'available').length / Math.max(tasks.length, 1)) * 100)}%` : 
                      '0%'}
                  </div>
                  <div className="text-sm text-[#888888]">Available</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'matrix' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
                  {Array.isArray(tasks) && tasks.map((task, i) => (
                    <motion.div
                      key={`task-${task.id}-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <TaskCard task={task} onDelete={handleDeleteTask} />
                    </motion.div>
                  ))}
                  {(!Array.isArray(tasks) || tasks.length === 0) && (
                    <div className="col-span-full bento-card flex flex-col items-center justify-center text-center py-20">
                      <div className="w-16 h-16 bg-[#262626] rounded-full flex items-center justify-center mb-6">
                        <Globe className="w-7 h-7 text-[#888888]" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No Active Monitors</h3>
                      <p className="text-[#888888] max-w-md mb-6">
                        Initialize a new monitoring task for {currentAgency.name} to begin tracking ticket availability.
                      </p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={tasks.length >= taskLimit}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                        Create First Monitor
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'logs' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <LogsView agencyId={currentAgency.id} />
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshTasks}
        agencyId={currentAgency.id}
      />
    </div>
  );
}
