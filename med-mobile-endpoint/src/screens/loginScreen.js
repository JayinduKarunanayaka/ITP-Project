import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const LoginScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Manual login disabled</Text>
            <Text style={styles.subtitle}>
                This screen is kept only as a placeholder. The app now restores the logged-in web session automatically.
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#f7f9fc',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#12203a',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#5b667a',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default LoginScreen;
