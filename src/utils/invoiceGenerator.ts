import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (order: any) => {
    const doc = new jsPDF();

    // --- Header ---
    doc.setFontSize(20);
    doc.text('SZÁMLA', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text('iThrifted Webshop', 14, 30);
    doc.text('Email: info@ithrifted.hu', 14, 35);
    doc.text('Web: www.ithrifted.hu', 14, 40);

    doc.text(`Számlaszám: INV-${order.id.slice(0, 8).toUpperCase()}`, 140, 30);
    doc.text(`Rendelés azonosító: #${order.id.slice(0, 8)}`, 140, 35);
    doc.text(`Kiállítás dátuma: ${new Date().toLocaleDateString('hu-HU')}`, 140, 40);

    // --- Customer Info ---
    doc.line(14, 45, 196, 45);
    doc.setFontSize(12);
    doc.text('Vevő adatai:', 14, 55);
    doc.setFontSize(10);
    doc.text(`Név: ${order.customer_name}`, 14, 62);
    doc.text(`Email: ${order.customer_email}`, 14, 67);
    doc.text(`Telefon: ${order.customer_phone}`, 14, 72);

    const address = order.shipping_address;
    if (address) {
        doc.text(`Cím: ${address.postal_code} ${address.city}, ${address.street}`, 14, 77);
        doc.text(`Ország: ${address.country}`, 14, 82);
        if (address.tax_id) {
            doc.text(`Adószám: ${address.tax_id}`, 14, 87);
        }
    }

    // --- Payment Info ---
    let paymentMethodName = 'Egyéb';
    if (address?.payment_method === 'credit_card') paymentMethodName = 'Bankkártya';
    else if (address?.payment_method === 'transfer') paymentMethodName = 'Átutalás';
    else if (address?.payment_method === 'cod') paymentMethodName = 'Utánvét';

    doc.text(`Fizetési mód: ${paymentMethodName}`, 140, 62);
    doc.text(`Teljesítés dátuma: ${new Date(order.created_at).toLocaleDateString('hu-HU')}`, 140, 67);
    doc.text(`ÁFA kód: AAM (Alanyi Adómentes)`, 140, 72);


    // --- Items Table ---
    const tableColumn = ["Termék", "Cikkszám", "Mennyiség", "Egységár", "Összesen"];
    const tableRows: any[] = [];

    order.order_items.forEach((item: any) => {
        const productData = [
            item.products?.name || 'Ismeretlen termék',
            item.products?.id || 'N/A',
            item.quantity,
            `${item.price.toLocaleString()} Ft`,
            `${(item.quantity * item.price).toLocaleString()} Ft`,
        ];
        tableRows.push(productData);
    });

    // @ts-ignore
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 95,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 9 },
        headStyles: { fillColor: [66, 66, 66] },
    });

    // --- Footer / Totals ---
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.text(`Részösszeg:`, 140, finalY);
    doc.text(`${order.total_amount.toLocaleString()} Ft`, 196, finalY, { align: 'right' });

    doc.text(`ÁFA (0%):`, 140, finalY + 5);
    doc.text(`0 Ft`, 196, finalY + 5, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Végösszeg:`, 140, finalY + 12);
    doc.text(`${order.total_amount.toLocaleString()} Ft`, 196, finalY + 12, { align: 'right' });

    // Save the PDF
    doc.save(`szamla_${order.id.slice(0, 8)}.pdf`);
};
