import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FileText, Package, Truck, CheckCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

interface OrderProgressBarProps {
    status: string;
    isCompact?: boolean;
}

const STEPS = [
    { id: 'pending', label: 'Received', icon: FileText },
    { id: 'scheduled', label: 'Processed', icon: Package },
    { id: 'transit', label: 'Pickup', icon: Truck },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
];

export const OrderProgressBar: React.FC<OrderProgressBarProps> = ({ status, isCompact = false }) => {
    const { colors, isDark } = useTheme();

    const normalizedStatus = (status || 'pending').toLowerCase();
    const isCancelled = normalizedStatus === 'cancelled';

    // Find current step index
    let currentStepIndex = STEPS.findIndex(step => step.id === normalizedStatus);
    if (currentStepIndex === -1 && !isCancelled) currentStepIndex = 0;

    const primaryColor = '#16a34a';
    const inactiveColor = isDark ? '#4b5563' : '#d1d5db';

    if (isCancelled) {
        return (
            <View style={styles.container}>
                <View style={[styles.cancelledContainer, { backgroundColor: isDark ? '#451a1a' : '#fef2f2' }]}>
                    <XCircle size={isCompact ? 16 : 20} color="#dc2626" />
                    <Text style={[styles.cancelledText, { fontSize: isCompact ? 13 : 15 }]}>
                        Order Cancelled
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, isCompact && styles.containerCompact]}>
            {/* Steps */}
            <View style={styles.stepsContainer}>
                {STEPS.map((step, index) => {
                    const isActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isLast = index === STEPS.length - 1;
                    const Icon = step.icon;

                    return (
                        <React.Fragment key={step.id}>
                            <View style={styles.stepWrapper}>
                                <View
                                    style={[
                                        styles.iconContainer,
                                        isCompact ? styles.iconContainerCompact : styles.iconContainerFull,
                                        {
                                            backgroundColor: isActive ? primaryColor : (isDark ? colors.surface : '#fff'),
                                            borderColor: isActive ? primaryColor : inactiveColor,
                                        }
                                    ]}
                                >
                                    <Icon
                                        size={isCompact ? 12 : 16}
                                        color={isActive ? '#fff' : inactiveColor}
                                    />
                                </View>
                                {!isCompact && (
                                    <Text style={[
                                        styles.stepLabel,
                                        {
                                            color: isActive ? primaryColor : inactiveColor,
                                            fontWeight: isCurrent ? '600' : '400'
                                        }
                                    ]}>
                                        {step.label}
                                    </Text>
                                )}
                            </View>
                            
                            {/* Connector Line */}
                            {!isLast && (
                                <View style={[
                                    styles.connector,
                                    isCompact && styles.connectorCompact,
                                    { backgroundColor: index < currentStepIndex ? primaryColor : inactiveColor }
                                ]} />
                            )}
                        </React.Fragment>
                    );
                })}
            </View>

            {/* Compact Label */}
            {isCompact && (
                <View style={styles.compactLabelContainer}>
                    <Text style={[styles.compactLabel, { color: primaryColor }]}>
                        {STEPS[currentStepIndex]?.label || 'Pending'}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 12,
    },
    containerCompact: {
        paddingVertical: 8,
    },
    cancelledContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    cancelledText: {
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
        color: '#dc2626',
    },
    stepsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    stepWrapper: {
        alignItems: 'center',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainerCompact: {
        width: 28,
        height: 28,
        borderRadius: 8,
    },
    iconContainerFull: {
        width: 36,
        height: 36,
        borderRadius: 10,
    },
    stepLabel: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 6,
        fontFamily: 'Inter-Medium',
        maxWidth: 60,
    },
    connector: {
        height: 3,
        width: 40,
        marginTop: 16,
        marginHorizontal: 4,
        borderRadius: 1.5,
    },
    connectorCompact: {
        width: 24,
        height: 2,
        marginTop: 13,
        marginHorizontal: 2,
    },
    compactLabelContainer: {
        marginTop: 8,
        alignItems: 'center',
        width: '100%',
    },
    compactLabel: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    }
});

export default OrderProgressBar;
