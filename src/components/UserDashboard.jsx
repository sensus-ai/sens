import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getTokenBalance, getReferralStats, processReferral } from '../lib/token';
import { useAddress } from "@thirdweb-dev/react";
import NotificationModal from './NotificationModal';

const UserDashboard = () => {
  const [recordings, setRecordings] = useState([]);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [totalRewards, setTotalRewards] = useState('0');
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    dailyReferrals: 0,
    maxDailyReferrals: 0,
    rewardPerReferral: '0'
  });
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState('');
  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [claimingRewards, setClaimingRewards] = useState(false);
  const [claimableRewards, setClaimableRewards] = useState('0');
  const address = useAddress();

  useEffect(() => {
    if (address) {
      fetchUserData();
      generateReferralLink();
    }
  }, [address]);

  const generateReferralLink = () => {
    const baseUrl = window.location.origin;
    const referralCode = address.toLowerCase();
    setReferralLink(`${baseUrl}?ref=${referralCode}`);
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    showNotification('Success', 'Referral link copied to clipboard!');
  };

  const showNotification = (title, message, type = 'success') => {
    setNotification({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch recordings
      const { data: recordingsData, error: recordingsError } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', address)
        .order('created_at', { ascending: false });

      if (recordingsError) throw recordingsError;
      setRecordings(recordingsData);

      // Fetch token balance
      const balance = await getTokenBalance(address);
      setTokenBalance(balance);

      // Fetch referral stats
      const stats = await getReferralStats(address);
      setReferralStats(stats);

      // Calculate total potential rewards
      const totalPotentialRewards = stats.totalReferrals * parseFloat(stats.rewardPerReferral);
      setTotalRewards(totalPotentialRewards.toString());

      // Get pending referrals that can be claimed
      const { data: pendingReferrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', address.toLowerCase())
        .eq('status', 'pending');

      const claimableAmount = pendingReferrals?.length || 0;
      setClaimableRewards((claimableAmount * 10).toString()); // Assuming 100 SENS per referral

      // Get completed referrals for total stats
      const { data: completedReferrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', address.toLowerCase())
        .eq('status', 'completed');

      const totalEarned = completedReferrals?.length || 0;
      setTotalRewards((totalEarned * 10).toString());

    } catch (error) {
      console.error('Error fetching user data:', error);
      showNotification('Error', 'Failed to fetch user data', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReferralRewards = async () => {
    if (!address || claimingRewards) return;

    setClaimingRewards(true);
    try {
      // First verify the table exists and has proper structure
      const { data: tableInfo, error: tableError } = await supabase
        .from('referrals')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('Table error:', tableError);
        throw new Error('Referral system is temporarily unavailable');
      }

      // Then query pending referrals
      const { data: pendingReferrals, error: queryError } = await supabase
        .from('referrals')
        .select()
        .eq('referrer_id', address.toLowerCase())
        .eq('status', 'pending');

      console.log('Pending referrals:', { pendingReferrals, error: queryError });

      if (queryError) {
        throw new Error('Failed to fetch referrals');
      }

      if (!pendingReferrals?.length) {
        showNotification('Info', 'No pending referrals found', 'info');
        return;
      }

      // Process referrals
      let successCount = 0;
      for (const referral of pendingReferrals) {
        try {
          const result = await processReferral(
            address.toLowerCase(),
            referral.referred_id
          );
          
          if (result.success) {
            successCount++;
            // Update status immediately after successful processing
            await supabase
              .from('referrals')
              .update({ status: 'completed' })
              .eq('id', referral.id);
          }
        } catch (err) {
          console.error('Failed to process referral:', err);
        }
      }

      // Only show success if we processed at least one referral
      if (successCount > 0) {
        showNotification('Success', `Processed ${successCount} referral(s)!`);
        await fetchUserData(); // Refresh dashboard data
      } else {
        showNotification('Warning', 'No referrals were processed successfully', 'warning');
      }

    } catch (error) {
      console.error('Claim process error:', error);
      showNotification('Error', error.message || 'Failed to process referrals', 'error');
    } finally {
      setClaimingRewards(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total SENS Balance</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{tokenBalance}</p>
        </div>
        
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
          <div className="flex flex-col h-full">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Claimable Rewards</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {claimableRewards} <span className="text-sm font-normal">SENS</span>
            </p>
            <button
              onClick={handleClaimReferralRewards}
              disabled={claimingRewards || Number(claimableRewards) === 0}
              className={`mt-2 px-4 py-2 text-sm rounded-lg ${
                claimingRewards || Number(claimableRewards) === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white transition-colors`}
            >
              {claimingRewards ? 'Claiming...' : 'Claim Rewards'}
            </button>
            <p className="mt-1 text-xs text-gray-500">
              Total Earned: {totalRewards} SENS
            </p>
          </div>
        </div>
        
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Referrals</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{referralStats.totalReferrals}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Today: {referralStats.dailyReferrals}/{referralStats.maxDailyReferrals}
          </p>
        </div>
        
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Recordings</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{recordings.length}</p>
        </div>
      </div>

      {/* Referral Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Referral Link</h3>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
          />
          <button
            onClick={copyReferralLink}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Copy
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Share this link to earn {referralStats.rewardPerReferral} SENS for each new user who joins!
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Daily referrals: {referralStats.dailyReferrals}/{referralStats.maxDailyReferrals}
        </p>
      </div>

      {/* Recordings Table */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Recordings</h3>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          </div>
        ) : recordings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Topic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Video</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recordings.map((recording) => (
                  <tr key={recording.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{recording.topic}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDuration(recording.duration)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(recording.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {recording.verified ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                          Verified
                        </span>
                      ) : recording.flagged ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100">
                          Flagged
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                          Approved {/*Pending*/}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a href={recording.video_url} target="_blank" rel="noopener noreferrer" 
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">No recordings yet</p>
        )}
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};

export default UserDashboard;