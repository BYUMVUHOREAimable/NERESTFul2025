const PdfPrinter = require('pdfmake');
const fs = require('fs'); // Not strictly needed if streaming, but good for font definition
const path = require('path');

// Define font files. pdfmake requires these to be explicitly defined.
// You might need to download these font files (e.g., from Google Fonts) and place them in your project.
// For simplicity, pdfmake has some built-in fonts like Roboto, but for more control, define them.
const fonts = {
    Roboto: {
        normal: path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-Regular.ttf'), // Adjust path
        bold: path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-Medium.ttf'),
        italics: path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-Italic.ttf'),
        bolditalics: path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-MediumItalic.ttf'),
    },
    // Add other fonts if needed
};

const printer = new PdfPrinter(fonts);


const generateParkingTicketPdf = async (ticketData) => {
    return new Promise((resolve, reject) => {
        const { user, vehicle, parkingSlot, slotRequest, appName = "XYZ LTD PM Systems" } = ticketData;

        const requestDate = slotRequest.requested_at ? new Date(slotRequest.requested_at).toLocaleString() : 'N/A';
        const approvalDate = slotRequest.resolved_at ? new Date(slotRequest.resolved_at).toLocaleString() : 'N/A';
        const ticketNumber = slotRequest.id.substring(0, 8).toUpperCase(); 
        const documentDefinition = {
            content: [
                { text: appName, style: 'header', alignment: 'center' },
                { text: 'Parking Ticket / Receipt', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] },

                { text: `Ticket Number: ${ticketNumber}`, style: 'infoBold' },
                { text: `Approval Date: ${approvalDate}`, style: 'info', margin: [0, 0, 0, 15] },

                { text: 'User Details', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['auto', '*'],
                        body: [
                            [{ text: 'Name:', style: 'tableLabel' }, user.name || 'N/A'],
                            [{ text: 'Email:', style: 'tableLabel' }, user.email || 'N/A'],
                        ],
                    },
                    layout: 'noBorders',
                    margin: [0, 5, 0, 15],
                },

                { text: 'Vehicle Details', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['auto', '*'],
                        body: [
                            [{ text: 'Plate Number:', style: 'tableLabel' }, vehicle.plate_number || 'N/A'],
                            [{ text: 'Type:', style: 'tableLabel' }, vehicle.vehicle_type || 'N/A'],
                            [{ text: 'Size:', style: 'tableLabel' }, vehicle.size || 'N/A'],
                        ],
                    },
                    layout: 'noBorders',
                    margin: [0, 5, 0, 15],
                },

                { text: 'Assigned Slot Details', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['auto', '*'],
                        body: [
                            [{ text: 'Slot Number:', style: 'tableLabel' }, parkingSlot.slot_number || 'N/A'],
                            [{ text: 'Location:', style: 'tableLabel' }, parkingSlot.location || 'N/A'],
                        ],
                    },
                    layout: 'noBorders',
                    margin: [0, 5, 0, 15],
                },

                { text: 'Booking Details', style: 'sectionHeader' },
                {
                    table: {
                        widths: ['auto', '*'],
                        body: [
                            [{ text: 'Expected Duration:', style: 'tableLabel' }, `${slotRequest.expected_duration_hours || 'N/A'} hours`],
                            [{ text: 'Cost per Hour:', style: 'tableLabel' }, parkingSlot.cost_per_hour ? `$${parseFloat(parkingSlot.cost_per_hour).toFixed(2)}` : 'Free'],
                            [{ text: 'Total Calculated Cost:', style: 'tableLabelBold' }, slotRequest.calculated_cost ? `$${parseFloat(slotRequest.calculated_cost).toFixed(2)}` : 'N/A'],
                        ],
                    },
                    layout: 'noBorders',
                    margin: [0, 5, 0, 20],
                },

                { text: 'Thank you for using XYZ LTD PMS Systems!', style: 'footer', alignment: 'center', margin: [0, 20, 0, 0] },
                { text: 'Please keep this ticket for your records. Valid for the specified duration.', style: 'finePrint', alignment: 'center' },
            ],
            styles: {
                header: { fontSize: 24, bold: true, margin: [0, 0, 0, 5], color: '#2C3340'  },
                subheader: { fontSize: 16, bold: false, margin: [0, 0, 0, 15], color: '#596070'  },
                sectionHeader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5], color: '#2C3340' },
                info: { fontSize: 10, margin: [0, 0, 0, 3], color: '#596070' },
                infoBold: { fontSize: 10, bold: true, margin: [0, 0, 0, 3], color: '#2C3340' },
                tableLabel: { bold: false, color: '#596070', margin: [0, 0, 5, 0] },
                tableLabelBold: { bold: true, color: '#2C3340', margin: [0, 0, 5, 0] },
                footer: { fontSize: 10, italics: true, color: '#596070' },
                finePrint: { fontSize: 8, color: '#8C919E' , margin: [0, 5, 0, 0] }
            },
            defaultStyle: {
                font: 'Roboto', 
                fontSize: 10,
                lineHeight: 1.3,
            },
        };

        try {
            const pdfDoc = printer.createPdfKitDocument(documentDefinition);
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err) => reject(err));
            pdfDoc.end();
        } catch (error) {
            reject(error);
        }
    });
};

const generateEntryTicketPdf = async (entryData) => {
    return new Promise((resolve, reject) => {
        const { plate_number, ticket_number, entry_time, parking, attendantName, appName = "XYZ LTD PM Systems" } = entryData;

        const entryTimeString = entry_time ? new Date(entry_time).toLocaleString() : 'N/A';

        const documentDefinition = {
            content: [
                { text: appName, style: 'header', alignment: 'center' },
                { text: 'PARKING ENTRY TICKET', style: 'subheader', alignment: 'center', margin: [0, 5, 0, 25] },

                {
                    columns: [
                        { width: '*', text: `Ticket No: ${ticket_number}`, style: 'ticketNumber' },
                        { width: 'auto', text: `Date: ${new Date(entry_time).toLocaleDateString()}`, style: 'infoRight' }
                    ],
                    margin: [0, 0, 0, 10]
                },
                {
                    columns: [
                        { width: '*', text: '' }, 
                        { width: 'auto', text: `Time: ${new Date(entry_time).toLocaleTimeString()}`, style: 'infoRight' }
                    ],
                    margin: [0, 0, 0, 20]
                },


                { text: 'Vehicle Details', style: 'sectionHeader' },
                { canvas: [{ type: 'line', x1: 0, y1: 2, x2: 515, y2: 2, lineWidth: 0.5, lineColor: '#cccccc' }] },
                {
                    table: {
                        widths: ['auto', '*'],
                        body: [
                            [{ text: 'Plate Number:', style: 'tableLabel' }, { text: plate_number.toUpperCase(), style: 'valueLarge' }],
                        ],
                    },
                    layout: 'noBorders',
                    margin: [0, 8, 0, 15],
                },

                { text: 'Parking Details', style: 'sectionHeader' },
                { canvas: [{ type: 'line', x1: 0, y1: 2, x2: 515, y2: 2, lineWidth: 0.5, lineColor: '#cccccc' }] },
                {
                    table: {
                        widths: ['auto', '*'],
                        body: [
                            [{ text: 'Parking Area:', style: 'tableLabel' }, `${parking.name} (${parking.code})`],
                            [{ text: 'Location:', style: 'tableLabel' }, parking.location || 'N/A'],
                        ],
                    },
                    layout: 'noBorders',
                    margin: [0, 8, 0, 20],
                },

                { qr: `TicketNo:${ticket_number},Plate:${plate_number},Entry:${entry_time}`, fit: '80', alignment: 'center', margin: [0, 0, 0, 20] },


                { text: 'IMPORTANT:', style: 'importantNoticeHeader', alignment: 'center' },
                { text: 'Please keep this ticket safe. You will need it to exit the parking facility. Standard parking terms and conditions apply.', style: 'finePrint', alignment: 'center', margin: [0, 5, 0, 20] },

                { text: `Issued by: ${attendantName || 'System'}`, style: 'footerInfo', alignment: 'left', margin: [0, 30, 0, 0] },
                { text: `Powered by ${appName}`, style: 'footerInfo', alignment: 'right' },

            ],
            styles: {
                header: { fontSize: 22, bold: true, margin: [0, 0, 0, 0], color: '#1E2433'  },
                subheader: { fontSize: 16, bold: true, margin: [0, 0, 0, 15], color: '#D99407'  },
                sectionHeader: { fontSize: 12, bold: true, margin: [0, 10, 0, 3], color: '#282E38' },
                ticketNumber: { fontSize: 14, bold: true, color: '#1E2433' },
                infoRight: { fontSize: 10, alignment: 'right', color: '#545B69' },
                tableLabel: { bold: true, color: '#545B69', margin: [0, 2, 10, 2], fontSize: 11 },
                valueLarge: { fontSize: 16, bold: true, color: '#1E2433' },
                importantNoticeHeader: { fontSize: 10, bold: true, color: '#C27C0B' },
                finePrint: { fontSize: 8, color: '#545B69', margin: [0, 5, 0, 0] },
                footerInfo: { fontSize: 7, color: '#878C99', italics: true }
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 10,
                lineHeight: 1.3,
            },
        };

        try {
            const pdfDoc = printer.createPdfKitDocument(documentDefinition);
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err) => reject(err));
            pdfDoc.end();
        } catch (error) {
            console.error("Error in generateEntryTicketPdf:", error);
            reject(error);
        }
    });
};


const generateExitBillPdf = async (billData) => {
    return new Promise((resolve, reject) => {
        const { processedByForDisplay, vehicleEntry, appName = "XYZ LTD PM Systems" } = billData;

        const entryTime = vehicleEntry.entry_time ? new Date(vehicleEntry.entry_time).toLocaleString() : 'N/A';
        const exitTime = vehicleEntry.exit_time ? new Date(vehicleEntry.exit_time).toLocaleString() : 'N/A';
        const durationMinutes = vehicleEntry.calculated_duration_minutes || 0;
        const durationHours = Math.ceil(durationMinutes / 60); 

        const attendantName = `${processedByForDisplay?.firstName || ''} ${processedByForDisplay?.lastName || ''}`.trim() || 'System';


        const documentDefinition = {
            content: [
                { text: appName, style: 'header', alignment: 'center' },
                { text: 'PARKING EXIT BILL / RECEIPT', style: 'subheader', alignment: 'center', margin: [0, 5, 0, 20] },

                { text: `Ticket Number: ${vehicleEntry.ticket_number}`, style: 'infoBold' },
                { text: `Bill Date: ${new Date().toLocaleString()}`, style: 'info', margin: [0, 0, 0, 15] },

                { text: 'Vehicle Details', style: 'sectionHeader' },
                { canvas: [{ type: 'line', x1: 0, y1: 2, x2: 515, y2: 2, lineWidth: 0.5, lineColor: '#cccccc' }] },
                {
                    table: {
                        widths: ['auto', '*'],
                        body: [
                            [{ text: 'Plate Number:', style: 'tableLabel' }, { text: vehicleEntry.plate_number.toUpperCase(), style: 'valueLarge' }],
                        ],
                    },
                    layout: 'noBorders', margin: [0, 8, 0, 15],
                },

                { text: 'Parking Facility Details', style: 'sectionHeader' },
                { canvas: [{ type: 'line', x1: 0, y1: 2, x2: 515, y2: 2, lineWidth: 0.5, lineColor: '#cccccc' }] },
                {
                    table: {
                        widths: ['auto', '*'],
                        body: [
                            [{ text: 'Facility:', style: 'tableLabel' }, `${vehicleEntry.parking.name} (${vehicleEntry.parking.code})`],
                            [{ text: 'Location:', style: 'tableLabel' }, vehicleEntry.parking.location || 'N/A'],
                        ],
                    },
                    layout: 'noBorders', margin: [0, 8, 0, 15],
                },

                { text: 'Parking Session & Charges', style: 'sectionHeader' },
                { canvas: [{ type: 'line', x1: 0, y1: 2, x2: 515, y2: 2, lineWidth: 0.5, lineColor: '#cccccc' }] },
                {
                    table: {
                        widths: ['auto', '*'],
                        body: [
                            [{ text: 'Entry Time:', style: 'tableLabel' }, entryTime],
                            [{ text: 'Exit Time:', style: 'tableLabel' }, exitTime],
                            [{ text: 'Duration:', style: 'tableLabel' }, `${durationMinutes} minutes (~${durationHours} billed hr/s)`],
                            [{ text: 'Charge Per Hour:', style: 'tableLabel' }, vehicleEntry.parking.charge_per_hour ? `$${parseFloat(vehicleEntry.parking.charge_per_hour).toFixed(2)}` : 'N/A'],
                            [{ text: 'Total Amount Due:', style: 'tableLabelTotal' }, vehicleEntry.charged_amount ? `$${parseFloat(vehicleEntry.charged_amount).toFixed(2)}` : 'N/A'],
                        ],
                    },
                    layout: 'noBorders', margin: [0, 8, 0, 20],
                },

                { qr: `BillForTicketNo:${vehicleEntry.ticket_number},Plate:${vehicleEntry.plate_number},Amount:${vehicleEntry.charged_amount || 0}`, fit: '80', alignment: 'center', margin: [0, 0, 0, 20] },


                { text: 'Thank you for parking with XYZ LTD PM Systems!', style: 'footer', alignment: 'center', margin: [0, 20, 0, 0] },
                { text: 'Please retain this bill for your records.', style: 'finePrint', alignment: 'center' },
                { text: `Processed by: ${attendantName}`, style: 'footerInfo', alignment: 'left', margin: [0, 20, 0, 0] },
                { text: `Powered by ${appName}`, style: 'footerInfo', alignment: 'right' },
            ],
            styles: { 
                header: { fontSize: 22, bold: true, margin: [0, 0, 0, 0], color: '#1E2433' },
                subheader: { fontSize: 16, bold: true, margin: [0, 0, 0, 15], color: '#DAA520' },
                sectionHeader: { fontSize: 12, bold: true, margin: [0, 10, 0, 3], color: '#282E38' },
                infoBold: { fontSize: 11, bold: true, color: '#1E2433' },
                info: { fontSize: 10, color: '#545B69' },
                tableLabel: { bold: false, color: '#545B69', margin: [0, 2, 10, 2], fontSize: 10 },
                valueLarge: { fontSize: 14, bold: true, color: '#1E2433' },
                tableLabelTotal: { bold: true, color: '#1E2433', margin: [0, 2, 10, 2], fontSize: 12 },
                finePrint: { fontSize: 8, color: '#545B69', margin: [0, 5, 0, 0] },
                footer: { fontSize: 10, italics: true, color: '#545B69' },
                footerInfo: { fontSize: 7, color: '#878C99', italics: true }
            },
            defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.3 },
        };

        try {
            const pdfDoc = printer.createPdfKitDocument(documentDefinition);
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err) => reject(err));
            pdfDoc.end();
        } catch (error) {
            console.error("Error in generateExitBillPdf:", error);
            reject(error);
        }
    });
};



module.exports = { generateParkingTicketPdf, generateEntryTicketPdf, generateExitBillPdf };