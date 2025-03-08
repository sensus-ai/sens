import { ethers } from 'ethers';
import { supabase } from './supabase';  // Add this import

export const SENS_TOKEN_ADDRESS = '0x3Db3b0e8b9B4A2a0e1352e26dFD03DbA46FEE8DD';
export const REWARD_CONTRACT_ADDRESS = '0x046c988fdbadd71af36ca953247ffc31ae77ae54';
export const REFERRAL_CONTRACT_ADDRESS = '0x98158733d497d173bb8017eb723c2ded82131794';
const MIN_RECORDING_DURATION = 10; // Minimum 10 seconds for rewards
const TOKENS_PER_10_SECONDS = ethers.utils.parseUnits("1", 18); // 1 SENS per 10 seconds

// Contract ABIs
const REWARD_ABI = [
  "function rewardUser(uint256 _duration) external",
  "function getRewardAmount(uint256 _duration) external pure returns (uint256)",
  "function dailyRewardAmount(address) external view returns (uint256)",
  "function MAX_DAILY_REWARD() external pure returns (uint256)",
  "function sensToken() external view returns (address)"
];

const TOKEN_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

const REFERRAL_ABI = [
  "function processReferral(address referrer, address referred) external",
  "function getReferralCount(address user) external view returns (uint256)",
  "function referralCount(address) external view returns (uint256)",
  "function hasBeenReferred(address) external view returns (bool)",
  "function dailyReferralCount(address) external view returns (uint256)",
  "function lastReferralDay(address) external view returns (uint256)",
  "function REFERRAL_REWARD() external view returns (uint256)",
  "function MAX_DAILY_REFERRALS() external view returns (uint256)"
];

export const calculateReward = (durationInSeconds) => {
  if (durationInSeconds < MIN_RECORDING_DURATION) {
    return ethers.BigNumber.from(0);
  }
  const tenSecondIntervals = ethers.BigNumber.from(Math.floor(durationInSeconds / 10));
  return tenSecondIntervals.mul(TOKENS_PER_10_SECONDS);
};

export const rewardUser = async (userAddress, durationInSeconds) => {
  try {
    if (!window.ethereum) {
      return { 
        success: false, 
        reason: 'NO_WALLET',
        message: 'Please install MetaMask to receive rewards.'
      };
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const network = await provider.getNetwork();
    if (network.chainId !== 11155111) {
      return {
        success: false,
        reason: 'WRONG_NETWORK',
        message: 'Please switch to Sepolia network to receive rewards.'
      };
    }

    const rewardContract = new ethers.Contract(REWARD_CONTRACT_ADDRESS, REWARD_ABI, signer);
    const tokenContract = new ethers.Contract(SENS_TOKEN_ADDRESS, TOKEN_ABI, provider);

    const rewardAmount = calculateReward(durationInSeconds);
    if (rewardAmount.isZero()) {
      return { 
        success: false, 
        reason: 'DURATION_TOO_SHORT',
        message: `Recording must be at least ${MIN_RECORDING_DURATION} seconds long to earn rewards.`
      };
    }

    const contractBalance = await tokenContract.balanceOf(REWARD_CONTRACT_ADDRESS);
    if (contractBalance.lt(rewardAmount)) {
      return { 
        success: false, 
        reason: 'INSUFFICIENT_CONTRACT_BALANCE',
        message: 'Reward pool is currently empty. Please try again later.'
      };
    }

    const tx = await rewardContract.rewardUser(durationInSeconds);
    const receipt = await tx.wait();

    return { 
      success: true,
      amount: ethers.utils.formatUnits(rewardAmount, 18),
      message: `Successfully claimed ${ethers.utils.formatUnits(rewardAmount, 18)} SENS tokens!`
    };

  } catch (error) {
    console.error('Error claiming reward:', error);
    
    if (error.code === 4001) {
      return {
        success: false,
        reason: 'USER_REJECTED',
        message: 'Transaction was rejected. Please try again.'
      };
    }
    
    if (error.code === -32002) {
      return {
        success: false,
        reason: 'PENDING_REQUEST',
        message: 'Please check MetaMask for pending requests.'
      };
    }

    return { 
      success: false,
      reason: 'CLAIM_FAILED',
      message: 'Failed to claim rewards. Please try again.',
      error: error
    };
  }
};

export const getTokenBalance = async (address) => {
  try {
    if (!window.ethereum) return '0';

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const tokenContract = new ethers.Contract(SENS_TOKEN_ADDRESS, TOKEN_ABI, provider);
    
    const balance = await tokenContract.balanceOf(address);
    return ethers.utils.formatUnits(balance, 18);
  } catch (error) {
    console.error('Error getting token balance:', error);
    return '0';
  }
};

export const processReferral = async (referrerId, referredId) => {
  try {
    if (!window.ethereum) {
      throw new Error('No wallet found');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Get the network to ensure we're on Sepolia
    const network = await provider.getNetwork();
    if (network.chainId !== 11155111) {
      throw new Error('Please switch to Sepolia network');
    }

    console.log('Processing referral reward:', { referrerId, referredId });

    const referralContract = new ethers.Contract(
      REFERRAL_CONTRACT_ADDRESS,
      REFERRAL_ABI,
      signer
    );

    // Call the contract to process reward
    const tx = await referralContract.processReferral(referrerId, referredId);
    await tx.wait();

    // Update the database
    await supabase
      .from('referrals')
      .update({ 
        status: 'completed',
        tx_hash: tx.hash
      })
      .eq('referrer_id', referrerId)
      .eq('referred_id', referredId);

    return { success: true, message: 'Referral processed successfully!' };

  } catch (error) {
    console.error('Error processing referral:', error);

    // Update with error status
    await supabase
      .from('referrals')
      .update({ 
        status: 'failed',
        error_message: error.message
      })
      .eq('referrer_id', referrerId)
      .eq('referred_id', referredId);

    return { 
      success: false, 
      message: error.message || 'Failed to process referral'
    };
  }
};

export const getReferralCount = async (address) => {
  try {
    if (!window.ethereum) return 0;

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const referralContract = new ethers.Contract(REFERRAL_CONTRACT_ADDRESS, REFERRAL_ABI, provider);
    
    const count = await referralContract.getReferralCount(address);
    return count.toNumber();
  } catch (error) {
    console.error('Error getting referral count:', error);
    return 0;
  }
};

export const getReferralStats = async (address) => {
  try {
    if (!window.ethereum) return {
      totalReferrals: 0,
      dailyReferrals: 0,
      maxDailyReferrals: 0,
      rewardPerReferral: '0'
    };

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const referralContract = new ethers.Contract(
      REFERRAL_CONTRACT_ADDRESS,
      REFERRAL_ABI,
      provider
    );

    // Get both contract and database stats
    const [contractStats, { data: dbReferrals }] = await Promise.all([
      Promise.all([
        referralContract.referralCount(address),
        referralContract.dailyReferralCount(address),
        referralContract.MAX_DAILY_REFERRALS(),
        referralContract.REFERRAL_REWARD()
      ]),
      supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', address.toLowerCase())
    ]);

    console.log('Stats:', { 
      contract: contractStats,
      database: dbReferrals 
    });

    const [totalReferrals, dailyReferrals, maxDaily, reward] = contractStats;

    return {
      totalReferrals: totalReferrals.toNumber(),
      dailyReferrals: dailyReferrals.toNumber(),
      maxDailyReferrals: maxDaily.toNumber(),
      rewardPerReferral: ethers.utils.formatUnits(reward, 18)
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      totalReferrals: 0,
      dailyReferrals: 0,
      maxDailyReferrals: 0,
      rewardPerReferral: '0'
    };
  }
};