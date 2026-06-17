import axios from 'axios';

const readSavedSessionToken = () => {
    try {
        return window.localStorage.getItem('med_app_auth_token') || '';
    } catch {
        return '';
    }
};

export const downloadTrackingReport = async ({ backendUrl, userId, startDate, endDate, filename }) => {
    const token = readSavedSessionToken();
    const response = await axios.get(`${backendUrl}/api/tracking/report/${userId}`, {
        params: { startDate, endDate },
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'Tracking_Report.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
};