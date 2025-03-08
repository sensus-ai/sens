import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AdminDashboard = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, flagged, verified
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month

  useEffect(() => {
    fetchRecordings();
  }, [filter, dateRange]);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('recordings')
        .select(`
          *,
          user_daily_recordings(total_duration)
        `)
        .order('created_at', { ascending: false });

      // Apply date filter
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (dateRange) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      // Apply status filter
      if (filter === 'flagged') {
        query = query.eq('flagged', true);
      } else if (filter === 'verified') {
        query = query.eq('verified', true);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setRecordings(data);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      alert('Error fetching recordings');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      const { error } = await supabase
        .from('recordings')
        .update({ verified: true, flagged: false })
        .eq('id', id);
      
      if (error) throw error;
      fetchRecordings();
    } catch (error) {
      console.error('Error verifying recording:', error);
      alert('Error verifying recording');
    }
  };

  const handleFlag = async (id) => {
    try {
      const { error } = await supabase
        .from('recordings')
        .update({ flagged: true, verified: false })
        .eq('id', id);
      
      if (error) throw error;
      fetchRecordings();
    } catch (error) {
      console.error('Error flagging recording:', error);
      alert('Error flagging recording');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage and verify user recordings
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm"
        >
          <option value="all">All Recordings</option>
          <option value="flagged">Flagged</option>
          <option value="verified">Verified</option>
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {recordings.map((recording) => (
              <li key={recording.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {recording.topic}
                    </h3>
                    <div className="mt-1 text-sm text-gray-500">
                      <p>User: {recording.user_id}</p>
                      <p>Duration: {recording.duration}s</p>
                      <p>Created: {new Date(recording.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={recording.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleVerify(recording.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleFlag(recording.id)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      Flag
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;