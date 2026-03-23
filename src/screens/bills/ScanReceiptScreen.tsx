import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBillStore } from '../../store';
import { ScreenHeader, Button } from '../../components';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../theme';
import { simulateOCR } from '../../utils/ocr';

export function ScanReceiptScreen() {
    const navigation = useNavigation<any>();
    const { setItems } = useBillStore();
    const [photo, setPhoto] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleTakePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission needed',
                    'Camera access is required to take photos of receipts.'
                );
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                quality: 0.8,
                allowsEditing: false,
            });
            if (!result.canceled && result.assets[0]) {
                setPhoto(result.assets[0].uri);
                processImage(result.assets[0].uri);
            }
        } catch {
            Alert.alert('Error', 'Failed to open camera. Try picking from gallery instead.');
        }
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
                setPhoto(result.assets[0].uri);
                processImage(result.assets[0].uri);
            }
        } catch {
            Alert.alert('Error', 'Failed to open gallery.');
        }
    };

    const processImage = async (_uri: string) => {
        setProcessing(true);
        try {
            // TODO: Replace with real OCR API (Google Cloud Vision / AWS Textract)
            // For v1.0 launch, OCR is simulated. Users can still add items manually.
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const items = simulateOCR();
            setItems(items);
            navigation.navigate('EditItems');
        } catch {
            Alert.alert(
                'Scan Failed',
                'Could not read the receipt. Please add items manually.',
                [{ text: 'Add Manually', onPress: () => navigation.navigate('EditItems') }]
            );
        } finally {
            setProcessing(false);
        }
    };

    const handleSkip = () => {
        navigation.navigate('EditItems');
    };

    // Processing state
    if (processing) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ScreenHeader title="Scan Receipt" onBack={() => navigation.goBack()} />
                <View style={styles.centered}>
                    {photo && (
                        <Image source={{ uri: photo }} style={styles.previewImage} />
                    )}
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color={Colors.teal} />
                        <Text style={styles.processingText}>Reading your receipt...</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScreenHeader title="Scan Receipt" onBack={() => navigation.goBack()} />
            <View style={styles.centered}>
                <Text style={styles.emoji}>📷</Text>
                <Text style={styles.heading}>Capture your receipt</Text>
                <Text style={styles.description}>
                    Take a photo or pick from your gallery to extract items automatically
                </Text>

                <Button
                    title="Take Photo"
                    onPress={handleTakePhoto}
                    icon={<Ionicons name="camera" size={20} color={Colors.white} />}
                    style={styles.actionButton}
                />
                <Button
                    title="Pick from Gallery"
                    onPress={handlePickImage}
                    variant="outline"
                    icon={<Ionicons name="images-outline" size={20} color={Colors.teal} />}
                    style={styles.actionButton}
                />

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                <Button
                    title="Add Items Manually"
                    onPress={handleSkip}
                    variant="ghost"
                    icon={<Ionicons name="create-outline" size={20} color={Colors.teal} />}
                    style={styles.actionButton}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    emoji: {
        fontSize: 56,
        marginBottom: Spacing.md,
    },
    heading: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    description: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    actionButton: {
        width: '100%',
        marginBottom: Spacing.sm,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: Spacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    dividerText: {
        paddingHorizontal: Spacing.md,
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
    },
    previewImage: {
        width: '80%',
        height: '50%',
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.lg,
    },
    processingOverlay: {
        alignItems: 'center',
        gap: Spacing.md,
    },
    processingText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
});
