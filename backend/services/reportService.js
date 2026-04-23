import PDFDocument from 'pdfkit';
import TrackingLog from '../models/TrackingLog.js';
import { calculateAdherencePercentage } from './trackingService.js';

export const generateAdherencePDF = async (userId, res, startDate, endDate) => {
    try {
        const stats = await calculateAdherencePercentage(userId, startDate, endDate);
        
        const matchCriteria = { userId: userId };
        if (startDate || endDate) {
            matchCriteria.scheduledTime = {};
            if (startDate) matchCriteria.scheduledTime.$gte = new Date(startDate);
            if (endDate) matchCriteria.scheduledTime.$lte = new Date(endDate);
        }

        const logs = await TrackingLog.find(matchCriteria)
                                    .sort({ scheduledTime: -1 })
                                    .limit(50); 

        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-disposition', 'attachment; filename="Adherence_Report.pdf"');
        res.setHeader('Content-type', 'application/pdf');
        
        doc.pipe(res);

        doc.fontSize(20).text('Tracking and Adherence Report', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12).text(`User ID: ${userId}`);
        doc.text(`Report Period Range: ${startDate ? new Date(startDate).toLocaleDateString() : 'All Time'} - ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`);
        doc.text(`Generated On: ${new Date().toLocaleString()}`);
        doc.moveDown(2);

        doc.fontSize(14).text('Adherence Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        
        doc.text(`Total Scheduled Doses: ${stats.total}`);
        doc.text(`Total Taken Doses: ${stats.taken}`);
        doc.text(`Total Missed/Skipped Doses: ${stats.missed + (stats.total - stats.taken - stats.missed)}`); 
        doc.fontSize(14).text(`Overall Adherence Percentage: ${stats.adherence}%`, { bold: true });
        doc.moveDown(2);

        doc.fontSize(14).text('Recent Medication Log History', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        
        logs.forEach(log => {
            const timeStr = log.scheduledTime ? new Date(log.scheduledTime).toLocaleString() : 'N/A';
            let color = 'black';
            if (log.status === 'Taken') color = 'green';
            if (log.status === 'Missed') color = 'red';
            
            doc.fillColor(color).text(`${timeStr}  -  [${log.status.toUpperCase()}]  -  ${log.medicationName || log.medicationId}`);
        });

        doc.end();

    } catch (error) {
        console.error("Failed PDF Build Stream:", error);
        res.status(500).json({ success: false, message: "PDF Stream Generation Error", details: error.message });
    }
};
