import { useState, useEffect } from 'react';
import { 
  Bell, Send, CheckCircle2, AlertCircle, Loader2, 
  Settings2, History, Trash2, Edit3, Save, X, 
  Smartphone, Monitor, Tablet, Globe, Search,
  Clock, User, MessageSquare, ChevronRight, ChevronLeft,
  Shield, BookOpen, GraduationCap, Star, Heart, Zap, Target,
  Award, Trophy, Lightbulb, Brain, Rocket, Sparkles, BookMarked,
  School, PenTool, Calculator, FlaskConical, Atom, Music, Palette,
  Camera, Gamepad2, Code, Coffee, Smile, ToggleLeft, ToggleRight
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Shield, BookOpen, GraduationCap, User, Star, Heart, Zap, Target,
  Award, Trophy, Lightbulb, Brain, Rocket, Sparkles, BookMarked,
  School, PenTool, Calculator, FlaskConical, Atom, Music, Palette,
  Camera, Gamepad2, Code, Globe, Coffee, Smile
};
import { supabase } from '../../../config/supabase';
import { format } from 'date-fns';
import ConfirmationModal from '../../ui/ConfirmationModal';

interface Subscription {
  id: string;
  tutee_id: string;
  label: string | null;
  user_agent: string | null;
  is_enabled: boolean;
  created_at: string;
  tutee_name?: string;
  tutee_color?: string;
  tutee_icon?: string;
}

interface NotificationLog {
  id: string;
  tutee_id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  device_label: string | null;
  error_message: string | null;
  triggered_by: string | null;
  triggered_from_device: string | null;
  created_at: string;
  tutee_name?: string;
  tutee_color?: string;
  tutee_icon?: string;
}

const NotificationAdmin = () => {
  const [activeTab, setActiveTab] = useState<'test' | 'devices' | 'logs'>('test');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Devices state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  
  // Logs state
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [logPage, setLogsPage] = useState(0);
  const logsPerPage = 10;

  useEffect(() => {
    fetchSubscriptions();
    fetchLogs();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data: subs, error: subsError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      const { data: tutees } = await supabase.from('tutees').select('id, name, color_gradient, icon');
      const tuteeMap = Object.fromEntries((tutees || []).map(t => [t.id, { name: t.name, color: t.color_gradient, icon: t.icon }]));

      setSubscriptions((subs || []).map(s => ({
        ...s,
        tutee_name: s.tutee_id === 'admin' ? 'Admin' : (tuteeMap[s.tutee_id]?.name || 'Unknown Student'),
        tutee_color: s.tutee_id === 'admin' ? 'from-purple-600 to-indigo-600' : (tuteeMap[s.tutee_id]?.color || 'from-gray-400 to-gray-500'),
        tutee_icon: s.tutee_id === 'admin' ? 'Shield' : (tuteeMap[s.tutee_id]?.icon || 'User')
      })));
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data: logData, error: logError } = await supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(logPage * logsPerPage, (logPage + 1) * logsPerPage - 1);

      if (logError) throw logError;

      const { data: tutees } = await supabase.from('tutees').select('id, name, color_gradient, icon');
      const tuteeMap = Object.fromEntries((tutees || []).map(t => [t.id, { name: t.name, color: t.color_gradient, icon: t.icon }]));

      setLogs((logData || []).map(l => ({
        ...l,
        tutee_name: l.tutee_id === 'admin' ? 'Admin' : (tuteeMap[l.tutee_id]?.name || 'Unknown Student'),
        tutee_color: l.tutee_id === 'admin' ? 'from-purple-600 to-indigo-600' : (tuteeMap[l.tutee_id]?.color || 'from-gray-400 to-gray-500'),
        tutee_icon: l.tutee_id === 'admin' ? 'Shield' : (tuteeMap[l.tutee_id]?.icon || 'User')
      })));
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const handleTestNotification = async (subscriptionId?: string) => {
    try {
      if (subscriptionId) {
        setTestingDeviceId(subscriptionId);
      } else {
        setLoading(true);
      }
      setStatus(null);

      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: { 
          test: true,
          subscriptionId,
          title: subscriptionId ? 'Device Test! 📱' : 'System Broadcast! 🚀',
          message: subscriptionId 
            ? 'Testing this specific device for connectivity.' 
            : 'The notification system is working for all devices.',
          triggeredBy: 'admin',
          triggeredFromDevice: navigator.userAgent
        },
      });

      if (error) throw error;

      const results = data.results || [];
      const successCount = results.filter((r: any) => r.success).length;
      const totalCount = results.length;

      if (totalCount === 0) {
        setStatus({
          type: 'error',
          message: subscriptionId 
            ? 'Failed to reach this specific device.' 
            : 'No devices found! Please enable notifications on at least one device first.'
        });
      } else {
        setStatus({
          type: 'success',
          message: subscriptionId 
            ? 'Test notification sent to this device!' 
            : `Successfully broadcasted to ${successCount}/${totalCount} devices.`
        });
        fetchLogs(); // Refresh logs after sending
      }
    } catch (err: any) {
      console.error('Failed to send test notification:', err);
      setStatus({
        type: 'error',
        message: err.message || 'Failed to trigger test notification.'
      });
    } finally {
      setLoading(false);
      setTestingDeviceId(null);
    }
  };

  const confirmDelete = async () => {
    if (!isDeletingId) return;
    
    try {
      setIsActionLoading(true);
      const { error } = await supabase.from('push_subscriptions').delete().eq('id', isDeletingId);
      if (error) throw error;
      setSubscriptions(prev => prev.filter(s => s.id !== isDeletingId));
      setIsDeletingId(null);
    } catch (err) {
      console.error('Error deleting subscription:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const startEditing = (sub: Subscription) => {
    setEditingId(sub.id);
    setEditLabel(sub.label || '');
  };

  const saveLabel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ label: editLabel })
        .eq('id', id);
      
      if (error) throw error;
      
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, label: editLabel } : s));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating label:', err);
    }
  };

  const toggleEnable = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_enabled: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, is_enabled: !currentStatus } : s));
    } catch (err) {
      console.error('Error toggling device status:', err);
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Globe className="w-5 h-5" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobi') || ua.includes('iphone') || ua.includes('android')) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      sent: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700'
    }[status] || 'bg-gray-100 text-gray-700';

    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${colors}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-indigo-100 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-indigo-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800">Notification Hub</h2>
              <p className="text-gray-500 font-medium text-sm">Control and monitor system alerts</p>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('test')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'test' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Test</span>
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'devices' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>Devices</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'logs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Logs</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 min-h-[400px]">
        {/* TAB: SYSTEM TEST */}
        {activeTab === 'test' && (
          <div className="max-w-2xl mx-auto py-8">
            <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100 text-center">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <Send className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-2">Ready to broadcast?</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Send a test push notification to all <strong>{subscriptions.length}</strong> currently registered devices. 
                This will help verify the end-to-end delivery system.
              </p>

              <button
                onClick={handleTestNotification}
                disabled={loading}
                className={`w-full max-w-sm py-4 rounded-2xl font-black text-xl shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] mx-auto ${
                  loading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-6 h-6" />
                    <span>Broadcast Test</span>
                  </>
                )}
              </button>

              {status && (
                <div className={`mt-8 p-4 rounded-2xl flex items-center justify-center gap-3 animate-fade-in max-w-sm mx-auto ${
                  status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  <p className="text-sm font-bold">{status.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: DEVICES */}
        {activeTab === 'devices' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Active Subscriptions ({subscriptions.length})
              </h3>
              <button onClick={fetchSubscriptions} className="text-xs font-bold text-indigo-600 hover:underline">Refresh List</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptions.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-gray-400 font-medium bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  No devices registered yet.
                </div>
              ) : subscriptions.map(sub => {
                const TuteeIcon = iconMap[sub.tutee_icon || 'User'] || User;
                const isTesting = testingDeviceId === sub.id;
                const isEnabled = sub.is_enabled !== false; // Default to true if undefined
                return (
                  <div key={sub.id} className={`bg-white border ${isTesting ? 'border-indigo-300 ring-2 ring-indigo-100' : isEnabled ? 'border-gray-100' : 'border-gray-200 bg-gray-50/50'} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}>
                    {!isEnabled && (
                      <div className="absolute top-0 right-0 px-2 py-0.5 bg-gray-200 text-gray-500 text-[8px] font-black uppercase tracking-tighter rounded-bl-lg">
                        Disabled
                      </div>
                    )}
                    {isTesting && (
                      <div className="absolute inset-0 bg-indigo-50/30 animate-pulse" />
                    )}
                    <div className="flex items-start justify-between gap-4 relative">
                      <div className={`p-3 rounded-xl transition-colors ${!isEnabled ? 'bg-gray-200 text-gray-400' : isTesting ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                        {getDeviceIcon(sub.user_agent)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gradient-to-r ${sub.tutee_color} ${!isEnabled ? 'grayscale opacity-50' : ''} text-white shadow-sm`}>
                            <TuteeIcon className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {sub.tutee_name}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {format(new Date(sub.created_at), 'MMM d, p')}
                          </span>
                        </div>
                        
                        {editingId === sub.id ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className="flex-1 text-sm font-bold border-b-2 border-indigo-500 focus:outline-none bg-indigo-50 text-gray-900 rounded-t px-2 py-1"
                              autoFocus
                              placeholder="Device Label (e.g. iPad Pro)"
                            />
                            <button onClick={() => saveLabel(sub.id)} className="p-1 text-green-600 hover:bg-green-50 rounded-lg"><Save className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded-lg"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className={`text-base font-bold truncate ${!isEnabled ? 'text-gray-400' : 'text-gray-800'}`}>
                              {sub.label || 'Unnamed Device'}
                            </h4>
                            <button onClick={() => startEditing(sub)} className="p-1 text-gray-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all">
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-[10px] text-gray-400 truncate mt-1 leading-tight max-w-[200px]">
                          {sub.user_agent || 'Unknown browser'}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 self-start sm:self-center">
                        <button
                          onClick={() => handleTestNotification(sub.id)}
                          disabled={isTesting || loading || !isEnabled}
                          className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                            !isEnabled ? 'hidden' :
                            isTesting 
                              ? 'bg-indigo-100 text-indigo-600' 
                              : 'text-gray-300 hover:text-indigo-500 hover:bg-indigo-50'
                          }`}
                          title="Test this device"
                        >
                          {isTesting ? (
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleEnable(sub.id, isEnabled)}
                          className={`p-1.5 sm:p-2 rounded-xl transition-all ${isEnabled ? 'text-indigo-600 hover:bg-indigo-50' : 'text-gray-400 hover:bg-gray-200'}`}
                          title={isEnabled ? "Disable Device" : "Enable Device"}
                        >
                          {isEnabled ? <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6" /> : <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
                        </button>
                        <button
                          onClick={() => setIsDeletingId(sub.id)}
                          disabled={isTesting}
                          className="p-1.5 sm:p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"
                          title="Remove Device"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs flex items-center gap-2">
                <History className="w-4 h-4" />
                Notification History
              </h3>
              <button onClick={fetchLogs} className="text-xs font-bold text-indigo-600 hover:underline">Refresh Logs</button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Device</th>
                    <th className="px-6 py-4">Triggered By</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Content</th>
                    <th className="px-6 py-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">No logs available.</td>
                    </tr>
                  ) : logs.map(log => {
                    const TuteeIcon = iconMap[log.tutee_icon || 'User'] || User;
                    return (
                      <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gradient-to-r ${log.tutee_color} text-white shadow-sm`}>
                            <TuteeIcon className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{log.tutee_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-3 h-3 text-gray-400" />
                            <span className="text-xs font-bold text-gray-600">
                              {log.device_label || 'Default Device'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700 capitalize">{log.triggered_by || 'System'}</span>
                            {log.triggered_from_device && (
                              <span className="text-[10px] text-gray-400 truncate max-w-[100px]">{log.triggered_from_device}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                            {log.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="text-xs font-black text-gray-800 truncate">{log.title}</p>
                            <p className="text-[10px] text-gray-500 line-clamp-1">{log.message}</p>
                            {log.error_message && (
                              <p className="text-[10px] text-red-500 font-bold mt-1">Error: {log.error_message}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-xs font-bold text-gray-700">{format(new Date(log.created_at), 'MMM d')}</span>
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                              {format(new Date(log.created_at), 'h:mm a')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                disabled={logPage === 0}
                onClick={() => { setLogsPage(p => p - 1); fetchLogs(); }}
                className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Page {logPage + 1}</span>
              <button
                disabled={logs.length < logsPerPage}
                onClick={() => { setLogsPage(p => p + 1); fetchLogs(); }}
                className="p-2 rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!isDeletingId}
        onClose={() => setIsDeletingId(null)}
        onConfirm={confirmDelete}
        title="Remove Device?"
        message="Are you sure you want to remove this device? It will no longer receive system alerts or review reminders."
        confirmText="Remove Device"
        type="danger"
        isLoading={isActionLoading}
      />
    </div>
  );
};

export default NotificationAdmin;
