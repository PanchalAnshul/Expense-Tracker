import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './dateFormatter';

/**
 * Generates a standard PDF Table Export for expenses.
 * 
 * @param {Array} expenses - List of transaction objects
 * @param {Object} folder - Optional folder meta-data to customize the header
 */
export const exportTransactionsToPDF = (expenses, folder = null) => {
    const doc = new jsPDF();

    // Custom Header
    doc.setFontSize(20);
    const title = folder ? `Report: ${folder.name}` : 'Global Financial Report';
    doc.text(title, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${formatDate(new Date())}`, 14, 30);

    if (folder) {
        doc.text(`Total Income: Rs.${folder.totalIncome.toFixed(2)}`, 14, 38);
        doc.text(`Total Expense: Rs.${folder.totalExpense.toFixed(2)}`, 14, 44);
        doc.text(`Net Balance: Rs.${folder.balance.toFixed(2)}`, 14, 50);
    }

    // Construct Table Data
    const tableColumn = ["Date", "Type", "Category", "Description", "Amount (Rs.)"];
    const tableRows = expenses.map(e => [
        formatDate(e.date),
        e.type.charAt(0).toUpperCase() + e.type.slice(1),
        e.category,
        e.description || '-',
        `${e.type === 'income' ? '+' : '-'}${e.amount.toFixed(2)}`
    ]);

    // Generate AutoTable
    autoTable(doc, {
        startY: folder ? 58 : 38,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40] },
        willDrawCell: function (data) {
            if (data.section === 'body' && data.column.index === 4) {
                // Color amount based on Income vs Expense
                const val = data.cell.raw;
                if (val.startsWith('+')) {
                    doc.setTextColor(52, 199, 89); // var(--success)
                } else {
                    doc.setTextColor(255, 59, 48); // var(--danger)
                }
            }
        }
    });

    doc.save(`${folder ? folder.name.replace(/\s+/g, '_') : 'Global'}_Report.pdf`);
};
