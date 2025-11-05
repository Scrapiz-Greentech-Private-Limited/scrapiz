import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Coins,
  TrendingUp,
  Gift,
  Clock,
  CheckCircle,
  History,
  Zap,
  Sparkles,
  Target,
  Award,
  IndianRupee,
  ArrowUpRight,
  Info,
  AlertCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useReferral } from '../../context/ReferralContext';

const { width } = Dimensions.get('window');

export default function RewardsWalletScreen() {
  const router = useRouter();
  
  // Get data from ReferralContext
  const {
    referralBalance,
    pendingBalance,
    transactions,
    isLoading,
    isRefreshing,
    error,
    refreshReferralData,
    canRedeem,
  } = useReferral();

  // Calculate totals from transactions
  const { totalEarned, totalSpent } = useMemo(() => {
    const earned = transactions
      .filter(t => t.type === 'earned')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const spent = Math.abs(
      transactions
        .filter(t => t.type === 'redeemed')
        .reduce((sum, t) => sum + t.amount, 0)
    );
    
    return { totalEarned: earned, totalSpent: spent };
  }, [transactions]);

  const getTransactionIcon = (type: 'earned' | 'redeemed' | 'pending') => {
    switch (type) {
      case 'earned':
        return <Gift size={18} color="#16a34a" />;
      case 'redeemed':
        return <ArrowUpRight size={18} color="#6b7280" />;
      case 'pending':
        return <Clock size={18} color="#f59e0b" />;
      default:
        return <Coins size={18} color="#16a34a" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
    }
  };

  // Loading state
  if (isLoading && transactions.length === 0) {
    return (
      <View className='flex-1 bg-gray-100'>
        <LinearGradient
          colors={['#16a34a', '#15803d', '#166534']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className='pt-14 px-5 pb-6'
        >
          <View className='flex-row items-center justify-between mb-6'>
            <TouchableOpacity
              className='w-10 h-10 rounded-full bg-white/25 items-center justify-center'
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text className='text-xl font-bold text-white tracking-wider'>Rewards Wallet</Text>
            <View className='w-10' />
          </View>
        </LinearGradient>
        
        <View className='flex-1 justify-center items-center px-5'>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className='text-base text-gray-600 mt-4 font-inter-medium'>Loading wallet data...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && transactions.length === 0) {
    return (
      <View className='flex-1 bg-gray-100'>
        <LinearGradient
          colors={['#16a34a', '#15803d', '#166534']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className='pt-14 px-5 pb-6'
        >
          <View className='flex-row items-center justify-between mb-6'>
            <TouchableOpacity
              className='w-10 h-10 rounded-full bg-white/25 items-center justify-center'
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text className='text-xl font-bold text-white tracking-wider'>Rewards Wallet</Text>
            <View className='w-10' />
          </View>
        </LinearGradient>
        
        <View className='flex-1 justify-center items-center px-5'>
          <AlertCircle size={64} color="#ef4444" />
          <Text className='text-xl font-bold text-gray-900 mt-4 font-inter-bold'>Oops! Something went wrong</Text>
          <Text className='text-base text-gray-600 mt-2 text-center font-inter-regular'>{error}</Text>
          <TouchableOpacity
            className='bg-green-600 rounded-xl py-4 px-8 mt-6'
            onPress={refreshReferralData}
            activeOpacity={0.8}
          >
            <Text className='text-base font-bold text-white font-inter-bold'>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-gray-100'>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#16a34a', '#15803d', '#166534']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className='pt-14 px-5 pb-6'
      >
        <View className='flex-row items-center justify-between mb-6'>
          <TouchableOpacity
            className='w-10 h-10 rounded-full bg-white/25 items-center justify-center'
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className='text-xl font-bold text-white tracking-wider'>Rewards Wallet</Text>
          <View className='w-10' />
        </View>

        {/* Main Balance Card */}
        <View className='bg-white/15 rounded-xl p-6 border border-white/25'>
          <View className='flex-row items-center mb-4'>
            <View className='w-12 h-12 rounded-full bg-amber-500/20 justify-center items-center mr-3'>
              <Coins size={28} color="#f59e0b" strokeWidth={2.5} />
            </View>
            <Text className='text-[15px] font-semibold text-white/90 tracking-[0.3] font-inter-semibold'>Available Balance</Text>
          </View>

          <View className='flex-row items-center mb-3'>
            <IndianRupee size={36} color="white" strokeWidth={3} />
            <Text className='text-[56px] font-extrabold text-white ml-2 tracking-tighter font-inter-bold'>{referralBalance.toFixed(2)}</Text>
          </View>

          <Text className='text-sm text-white/80 font-inter-regular mb-3'>
            💰 Extra earnings from referrals - withdraw anytime to your bank
          </Text>

          {/* Pending Badge */}
          {pendingBalance > 0 && (
            <View className='flex-row items-center bg-amber-400/25 px-3 py-2 rounded-lg self-start gap-1.5 border border-amber-400/40'>
              <Clock size={14} color="white" />
              <Text className='text-xs font-semibold text-white font-inter-semibold'>
                ₹{pendingBalance.toFixed(2)} pending verification
              </Text>
            </View>
          )}

          {/* Withdraw Button */}
          {canRedeem && (
            <TouchableOpacity
              className='flex-row items-center justify-center bg-white/25 border-2 border-white rounded-xl py-[14px] px-5 mt-4 gap-2'
              activeOpacity={0.8}
              onPress={() => {
                // Withdraw functionality
                console.log('Withdraw to bank');
              }}
            >
              <IndianRupee size={18} color="white" strokeWidth={2.5} />
              <Text className='text-[15px] font-bold text-white font-inter-bold'>Withdraw to Bank</Text>
            </TouchableOpacity>
          )}

          {!canRedeem && referralBalance > 0 && (
            <View className='bg-white/10 border border-white/30 rounded-xl py-3 px-4 mt-4 items-center'>
              <Text className='text-sm font-semibold text-white/70 font-inter-semibold'>
                ₹{(120 - referralBalance).toFixed(2)} more to withdraw (Min ₹120)
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        className='flex-1'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshReferralData}
            tintColor="#16a34a"
            colors={['#16a34a']}
          />
        }
      >
        {/* Stats */}
        <View className='flex-row gap-3 mb-5'>
          <View className='flex-1 bg-white rounded-2xl p-[18px] items-center shadow-lg shadow-black/5'>
            <View className='w-11 h-11 rounded-full bg-emerald-50 justify-center items-center mb-3'>
              <TrendingUp size={20} color="#16a34a" />
            </View>
            <Text className='text-2xl font-bold text-gray-900 font-inter-bold mb-1'>₹{totalEarned.toFixed(2)}</Text>
            <Text className='text-xs text-gray-500 font-inter-medium'>Referrals Earned</Text>
          </View>

          <View className='flex-1 bg-white rounded-2xl p-[18px] items-center shadow-lg shadow-black/5'>
            <View className='w-11 h-11 rounded-full bg-emerald-50 justify-center items-center mb-3'>
              <Zap size={20} color="#f59e0b" />
            </View>
            <Text className='text-2xl font-bold text-gray-900 font-inter-bold mb-1'>₹{totalSpent.toFixed(2)}</Text>
            <Text className='text-xs text-gray-500 font-inter-medium'>Withdrawn</Text>
          </View>
        </View>

        {/* How It Works */}
        <View className='bg-white rounded-xl p-5 mb-4 shadow-xl shadow-black/10'>
          <View className='flex-row items-center mb-4'>
            <View className='w-10 h-10 rounded-full bg-emerald-50 justify-center items-center mr-3'>
              <Info size={20} color="#16a34a" />
            </View>
            <Text className='text-lg font-bold text-gray-900 font-inter-bold'>How Referral Wallet Works</Text>
          </View>

          <View className='gap-3 mb-4'>
            <View className='flex-row items-start'>
              <View className='w-1.5 h-1.5 rounded-full bg-green-600 mt-[7px] mr-3' />
              <Text className='flex-1 text-sm text-gray-500 font-inter-regular leading-relaxed'>
                <Text className='font-semibold text-gray-900 font-inter-semibold'>Sell scrap, get paid directly</Text> to your bank account
              </Text>
            </View>

            <View className='flex-row items-start'>
              <View className='w-1.5 h-1.5 rounded-full bg-green-600 mt-[7px] mr-3' />
              <Text className='flex-1 text-sm text-gray-500 font-inter-regular leading-relaxed'>
                <Text className='font-semibold text-gray-900 font-inter-semibold'>Referral bonus is separate</Text> - earn extra ₹20 per referral
              </Text>
            </View>

            <View className='flex-row items-start'>
              <View className='w-1.5 h-1.5 rounded-full bg-green-600 mt-[7px] mr-3' />
              <Text className='flex-1 text-sm text-gray-500 font-inter-regular leading-relaxed'>
                <Text className='font-semibold text-gray-900 font-inter-semibold'>Withdraw anytime</Text> - minimum ₹100 to bank account
              </Text>
            </View>
          </View>

          {/* Example Card */}
          <View className='bg-gray-50 rounded-xl p-[14px] border border-gray-200'>
            <Text className='text-sm font-semibold text-gray-900 font-inter-semibold mb-2.5'>💡 How it works:</Text>
            <View className='flex-row justify-between items-center mb-1.5'>
              <Text className='text-sm text-gray-500 font-inter-regular'>Scrap Payment:</Text>
              <Text className='text-sm font-semibold text-gray-900 font-inter-semibold'>Direct to Bank ✅</Text>
            </View>
            <View className='h-px bg-gray-200 my-2' />
            <View className='flex-row justify-between items-center mb-1.5'>
              <Text className='text-sm text-gray-500 font-inter-regular'>Referral Bonus:</Text>
              <Text className='text-sm font-bold text-gray-900 font-inter-bold'>In Wallet ₹{referralBalance.toFixed(2)}</Text>
            </View>
            <View className='h-px bg-gray-200 my-2' />
            <View className='flex-row justify-between items-center mb-1.5'>
              <Text className='text-sm font-bold text-gray-900 font-inter-bold'>Withdraw Option:</Text>
              <Text className='text-base font-bold text-green-600 font-inter-bold'>Min ₹120</Text>
            </View>
          </View>
        </View>

        {/* Earn More CTA */}
        <TouchableOpacity
          className='rounded-2xl overflow-hidden mb-5 shadow-xl shadow-amber-500/30'
          onPress={() => router.push('/profile/refer-friends' as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#f59e0b', '#f97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className='flex-row items-center justify-between p-5'
          >
            <View className='flex-row items-center flex-1'>
              <View className='w-[52px] h-[52px] rounded-full bg-white/25 justify-center items-center mr-[14px]'>
                <Gift size={24} color="white" />
              </View>
              <View className='flex-1'>
                <Text className='text-base font-bold text-white font-inter-bold mb-1'>Invite Friends & Earn</Text>
                <Text className='text-sm text-white/90 font-inter-medium'>Get ₹20 per referral</Text>
              </View>
            </View>
            <View className='w-10 h-10 rounded-full bg-white/25 justify-center items-center'>
              <ArrowUpRight size={24} color="white" strokeWidth={2.5} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Transaction History */}
        <View className='mb-5'>
          <View className='flex-row items-center mb-4'>
            <View className='w-9 h-9 rounded-full bg-emerald-50 justify-center items-center mr-2.5'>
              <History size={20} color="#16a34a" />
            </View>
            <Text className='text-lg font-bold text-gray-900 font-inter-bold'>Transaction History</Text>
          </View>

          {transactions.length === 0 ? (
            // Empty state
            <View className='bg-white rounded-xl p-8 items-center shadow-md shadow-black/5'>
              <View className='w-16 h-16 rounded-full bg-gray-100 justify-center items-center mb-4'>
                <History size={32} color="#9ca3af" />
              </View>
              <Text className='text-lg font-bold text-gray-900 font-inter-bold mb-2'>No Transactions Yet</Text>
              <Text className='text-sm text-gray-500 text-center font-inter-regular mb-5'>
                Start referring friends to earn rewards and see your transaction history here!
              </Text>
              <TouchableOpacity
                className='bg-green-600 rounded-xl py-3 px-6'
                onPress={() => router.push('/profile/refer-friends' as any)}
                activeOpacity={0.8}
              >
                <Text className='text-sm font-bold text-white font-inter-bold'>Invite Friends Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className='gap-2.5'>
              {transactions.map((transaction) => (
                <View key={transaction.id} className='bg-white rounded-xl p-4 flex-row justify-between items-center shadow-md shadow-black/5'>
                  <View className='flex-row items-center flex-1 mr-3'>
                    <View style={[
                      styles.transactionIcon,
                      transaction.type === 'earned' && styles.transactionIconEarned,
                      transaction.type === 'redeemed' && styles.transactionIconSpent,
                      transaction.type === 'pending' && styles.transactionIconPending,
                    ]}>
                      {getTransactionIcon(transaction.type)}
                    </View>

                    <View className='flex-1'>
                      <Text className='text-sm font-semibold text-gray-900 font-inter-semibold mb-[3px]'>
                        {transaction.type === 'earned' ? 'Referral Bonus' : transaction.type === 'redeemed' ? 'Redeemed to Bank' : 'Referral Pending'}
                      </Text>
                      <Text className='text-xs text-gray-500 font-inter-regular mb-[3px]'>{transaction.description}</Text>
                      <Text className='text-xs text-gray-400 font-inter-regular'>{formatDate(transaction.date)}</Text>
                    </View>
                  </View>

                  <View className='items-end'>
                    <Text style={[
                      styles.transactionAmount,
                      transaction.type === 'earned' && styles.transactionAmountEarned,
                      transaction.type === 'redeemed' && styles.transactionAmountSpent,
                      transaction.type === 'pending' && styles.transactionAmountPending,
                    ]}>
                      {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
                    </Text>
                    {transaction.type === 'pending' && (
                      <View className='bg-amber-100 px-2 py-[3px] rounded-md mt-1'>
                        <Text className='text-[10px] font-semibold text-amber-500 font-inter-semibold'>Pending</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Tip */}
        <View className='bg-emerald-50 rounded-xl p-4 flex-row border-l-3 border-l-green-600'>
          <View className='w-8 h-8 rounded-full bg-white justify-center items-center mr-3 mt-0.5'>
            <Target size={18} color="#16a34a" />
          </View>
          <Text className='flex-1 text-sm text-green-800 font-inter-regular leading-5'>
            <Text className='font-semibold font-inter-semibold'>Remember:</Text> Your scrap selling payments go directly to your bank account. This wallet is only for referral bonuses - withdraw anytime once you reach ₹100!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconEarned: {
    backgroundColor: '#ecfdf5',
  },
  transactionIconSpent: {
    backgroundColor: '#f3f4f6',
  },
  transactionIconPending: {
    backgroundColor: '#fef3c7',
  },

  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  transactionAmountEarned: {
    color: '#16a34a',
  },
  transactionAmountSpent: {
    color: '#6b7280',
  },
  transactionAmountPending: {
    color: '#f59e0b',
  },

});
