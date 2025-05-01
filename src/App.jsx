import React, { useState, useEffect } from 'react';
import { ConnectWallet, useAddress } from "@thirdweb-dev/react";
import VideoRecorder from './components/VideoRecorder';
import UserDashboard from './components/UserDashboard';
import { useTheme } from './context/ThemeContext';
import logoLight from './assets/logo-light.png';
import logoDark from './assets/logo-dark.png';
import { processReferral, REFERRAL_CONTRACT_ADDRESS } from './lib/token';
import { supabase } from './lib/supabase';  // Add this if missing
import { ethers } from 'ethers';  // Add this import
import Documentation from './components/Documentation';

function App() {
  const address = useAddress();
  const [activeTab, setActiveTab] = useState('record'); // 'record', 'dashboard', 'documentation', or 'howto'
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (address) {
      handleReferral();
    }
  }, [address]);

  const handleReferral = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const referrerAddress = urlParams.get('ref');
    
    if (!referrerAddress || !address || referrerAddress.toLowerCase() === address.toLowerCase()) {
      return;
    }

    try {
      // Get current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session) {
        console.log('No session, attempting to create user...');
        // Create user if doesn't exist
        const { error: signUpError } = await supabase.auth.signUp({
          email: `${address.toLowerCase()}@wallet.local`,
          password: `${address.toLowerCase()}_secret`,
        });

        if (signUpError) throw signUpError;
      }

      // Create referral record
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', address.toLowerCase())
        .maybeSingle();

      if (!existingReferral) {
        console.log('Creating new referral record...');
        
        const { error: insertError } = await supabase
          .from('referrals')
          .insert({
            referrer_id: referrerAddress.toLowerCase(),
            referred_id: address.toLowerCase(),
            status: 'pending'
          });

        if (insertError) throw insertError;

        // Now trigger the smart contract transaction
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== 11155111) {
          alert('Please switch to Sepolia network');
          return;
        }

        console.log('Setting up contract with address:', REFERRAL_CONTRACT_ADDRESS);
        const contract = new ethers.Contract(
          REFERRAL_CONTRACT_ADDRESS,
          ["function processReferral(address referrer, address referred) external"],
          signer
        );

        console.log('Sending transaction...');
        const tx = await contract.processReferral(
          referrerAddress.toLowerCase(),
          address.toLowerCase()
        );
        
        console.log('Transaction sent:', tx.hash);
        
        await supabase
          .from('referrals')
          .update({ 
            status: 'processing',
            tx_hash: tx.hash 
          })
          .eq('referred_id', address.toLowerCase());

        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);

        await supabase
          .from('referrals')
          .update({ 
            status: 'completed',
            tx_hash: tx.hash 
          })
          .eq('referred_id', address.toLowerCase());

        window.dispatchEvent(new CustomEvent('referralProcessed'));
      } else {
        console.log('Referral already exists:', existingReferral);
      }
    } catch (error) {
      console.error('Referral error:', error);
      
      if (error.message.includes('network')) {
        alert('Please connect to Sepolia network');
      } else if (error.code === 4001) {
        alert('Please accept the transaction to complete the referral');
      } else {
        alert('Error processing referral. Please try again.');
      }
    }
  };

  const handleLogoClick = () => {
    if (address) {
      setActiveTab('record');
    }
  };

  const HowToGuide = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Training Examples</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Video 1: Coffee Tutorial */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="aspect-w-16 aspect-h-9">
            <video 
              controls 
              className="w-full h-full object-cover"
            >
              <source src="/tutorials/Coffee.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Coffee Preparation</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Example of recording coffee preparation for household AI training.</p>
          </div>
        </div>

        {/* Video 2: Tea Tutorial */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="aspect-w-16 aspect-h-9">
            <video 
              controls 
              className="w-full h-full object-cover"
            >
              <source src="/tutorials/Tea.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tea Preparation</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Example of recording tea preparation for household AI training.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-cyan-100 via-blue-100 to-purple-100 dark:from-indigo-900 dark:via-purple-900 dark:to-blue-900 transition-colors duration-200">
      {/* Dynamic vector background */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" className="text-gray-600 dark:text-white"/>
              <circle cx="18" cy="18" r="1" fill="currentColor" className="text-gray-600 dark:text-white"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Main content with padding-bottom for footer */}
      <div className="relative z-10 pb-16">
        <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg transition-colors duration-200">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div 
              onClick={handleLogoClick}
              className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img 
                src={theme === 'dark' ? logoDark : logoLight} 
                alt="SensusAI Logo" 
                className="h-12 w-auto transition-opacity duration-200" 
              />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SensusAI</h1>
            </div>
            <ConnectWallet 
              theme={theme}
              modalTitle="Connect Your Wallet"
              modalTitleIconUrl="/vite.svg"
              auth={{
                loginOptional: false,
                onLogin: () => {},
                onLogout: () => {},
              }}
            />
          </div>
        </header>

        {address && activeTab !== 'documentation' && activeTab !== 'howto' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('record')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'record'
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Record
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Dashboard
              </button>
            </div>
            
            {activeTab === 'record' ? (
              <VideoRecorder />
            ) : (
              <UserDashboard />
            )}
          </div>
        )}

        {/* Documentation page */}
        {activeTab === 'documentation' && (
          <Documentation />
        )}

        {/* How To page */}
        {activeTab === 'howto' && (
          <HowToGuide />
        )}

        {!address && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
              Please connect your wallet to start recording
            </h2>
          </div>
        )}

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              © 2025 SensusAI. All rights reserved.
            </p>
            {/* Add links section */}
            <div className="flex items-center space-x-6">
              <a
                href="https://github.com/sensus-ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </a>
              <a
                href="#howto"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('howto');
                }}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                How To
              </a>
              <a
                href="#documentation"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('documentation');
                }}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Docs
              </a>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-mina hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
                  </svg>
                  <span className="text-sm">Light Mode</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
                  </svg>
                  <span className="text-sm">Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default App;

export const getReferralStats = async (address) => {
  try {
    // Get both pending and completed referrals
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', address.toLowerCase());

    console.log('Fetched referral stats:', { referrals });

    const validReferrals = referrals?.filter(r => 
      r.tx_status === 'completed' || r.tx_status === 'pending'
    ) || [];

    const today = new Date().toISOString().split('T')[0];
    const dailyReferrals = validReferrals.filter(r => 
      r.created_at.startsWith(today)
    ).length;

    return {
      totalReferrals: validReferrals.length,
      dailyReferrals,
      maxDailyReferrals: 10, // Or fetch from contract
      rewardPerReferral: '100' // Or fetch from contract
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      totalReferrals: 0,
      dailyReferrals: 0,
      maxDailyReferrals: 10,
      rewardPerReferral: '100'
    };
  }
};