import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FileText, Package, Truck, CheckCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface OrderProgressTimelineProps {
    status: string;
    orderDate?: string;
    completedDate?: string;
    isCompact?: boolean;
}

interface TimelineStep {
    id: string;
    label: string;
    description: string;
    icon: any;
}

const STEPS: TimelineStep[] = [
    { id: 'pending', label: 'RECEIVED', description: 'Order received', icon: FileText },
    { id: 'scheduled', label: 'PROCESSED', description: 'Order confirmed', icon: Package },
    { id: 'transit', label: 'PICKUP', description: 'Agent on the way', icon: Truck },
    { id: 'completed', label: 'COMPLETED', description: 'Order completed', icon: CheckCircle },
];

export const OrderProgressTimeline: React.FC<OrderProgressTimelineProps> = ({ 
    status, 
    orderDate,
    completedDate,
    isCompact = false 
}) => {
    const { colors, isDark } = useTheme();
    const normalizedStatus = (status || 'pending').toLowerCase();
    const isCancelled = normalizedStatus === 'cancelled';

    // Find current step index
    let currentStepIndex = STEPS.findIndex(step => step.id === normalizedStatus);
    if (currentStepIndex === -1 && !isCancelled) currentStepIndex = 0;

    const primaryColor = '#16a34a'; // Green theme
    const inactiveColor = isDark ? '#4b5563' : '#d1d5db';
    const activeTextColor = primaryColor;
    const inactiveTextColor = isDark ? '#6b7280' : '#9ca3af';

    if (isCancelled) {
        return (
            <View style={[styles.container, isCompact && styles.containerCompact]}>
                <View style={styles.cancelledContainer}>
                    <View style={[styles.cancelledIconContainer, { backgroundColor: '#fef2f2' }]}>
                        <XCircle size={24} color="#dc2626" />
                    </View>
                    <View style={styles.cancelledTextContainer}>
                        <Text style={[styles.cancelledTitle, { color: '#dc2626' }]}>ORDER CANCELLED</Text>
                        <Text style={[styles.cancelledSubtitle, { color: colors.textSecondary }]}>
                            This order has been cancelled
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <View style={[styles.container, isCompact && styles.containerCompact]}>
            {STEPS.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isLast = index === STEPS.length - 1;
                const Icon = step.icon;

                // Determine date to show
                let dateText = '';
                if (index === 0 && orderDate) {
                    dateText = formatDate(orderDate);
                } else if (index === STEPS.length - 1 && completedDate && isActive) {
                    dateText = formatDate(completedDate);
                }

                return (
                    <View key={step.id} style={styles.stepRow}>
                        {/* Left side - Icon */}
                        <View style={styles.iconColumn}>
                            <View style={[
                                styles.iconWrapper,
                                { 
                                    backgroundColor: isDark ? colors.surface : '#fff',
                                    borderColor: isActive ? primaryColor : inactiveColor,
                                    borderWidth: 2,
                                }
                            ]}>
                                <Icon 
                                    size={isCompact ? 16 : 20} 
                                    color={isActive ? primaryColor : inactiveColor} 
                                />
                            </View>
                            {/* Vertical line */}
                            {!isLast && (
                                <View style={[
                                    styles.verticalLine,
                                    { 
                                        backgroundColor: index < currentStepIndex ? primaryColor : inactiveColor,
                                    }
                                ]} />
                            )}
                        </View>

                        {/* Middle - Text content */}
                        <View style={[styles.contentColumn, !isLast && styles.contentWithMargin]}>
                            <Text style={[
                                styles.stepLabel,
                                isCompact && styles.stepLabelCompact,
                                { color: isActive ? activeTextColor : inactiveTextColor },
                                isCurrent && styles.stepLabelCurrent
                            ]}>
                                {step.label}
                            </Text>
                            {!isCompact && (
                                <Text style={[
                                    styles.stepDescription,
                                    { color: isActive ? colors.text : inactiveTextColor }
                                ]}>
                                    {step.description}
                                    {dateText ? ` on ${dateText}` : ''}
                                </Text>
                            )}
                        </View>

                        {/* Right side - Checkmark */}
                        <View style={styles.checkColumn}>
                            {isActive && (
                                <View style={[
                                    styles.checkCircle,
                                    { 
                                        backgroundColor: isCurrent ? primaryColor : '#dcfce7',
                                        borderColor: primaryColor,
                                    }
                                ]}>
                                    <CheckCircle 
                                        size={isCompact ? 12 : 16} 
                                        color={isCurrent ? '#fff' : primaryColor} 
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    containerCompact: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconColumn: {
        alignItems: 'center',
        width: 44,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    verticalLine: {
        width: 3,
        height: 40,
        marginVertical: 4,
        borderRadius: 1.5,
    },
    contentColumn: {
        flex: 1,
        paddingLeft: 12,
        paddingTop: 8,
    },
    contentWithMargin: {
        marginBottom: 8,
    },
    stepLabel: {
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'Inter-Bold',
        letterSpacing: 0.5,
    },
    stepLabelCompact: {
        fontSize: 12,
    },
    stepLabelCurrent: {
        fontSize: 15,
    },
    stepDescription: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        marginTop: 2,
        fontStyle: 'italic',
    },
    checkColumn: {
        width: 32,
        alignItems: 'center',
        paddingTop: 10,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    cancelledContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fef2f2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    cancelledIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelledTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    cancelledTitle: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'Inter-Bold',
        letterSpacing: 0.5,
    },
    cancelledSubtitle: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        marginTop: 2,
    },
});

export default OrderProgressTimeline;
