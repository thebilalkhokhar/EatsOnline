import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const generatePDF = (reportData, period, restaurantDetails) => {
  const doc = new jsPDF();

  const {
    restaurantName = "Unknown Restaurant",
    contactNumber = "+92-333-1234567",
  } = restaurantDetails;

  const now = new Date();
  const generatedOn = now.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  });

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${restaurantName}`, 105, 20, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(255, 87, 51);
  doc.text("Sales Report", 105, 30, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Generated on: ${generatedOn}`, 14, 40);
  doc.text(
    `Report Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`,
    14,
    46
  );

  // Summary
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Summary", 14, 60);

  const cardWidth = 58;
  const cardHeight = 25;
  const gap = 4;
  const startX = 14;
  const startY = 65;

  doc.setFontSize(12);

  // Card 1: Total Sales
  doc.setFillColor(240, 240, 240);
  doc.rect(startX, startY, cardWidth, cardHeight, "F");
  doc.setTextColor(0);
  doc.text("Total Sales", startX + cardWidth / 2, startY + 10, {
    align: "center",
  });
  doc.setTextColor(255, 87, 51);
  doc.text(
    `PKR ${reportData.totalSales.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`,
    startX + cardWidth / 2,
    startY + 18,
    { align: "center" }
  );

  // Card 2: Total Orders
  const secondX = startX + cardWidth + gap;
  doc.setFillColor(240, 240, 240);
  doc.rect(secondX, startY, cardWidth, cardHeight, "F");
  doc.setTextColor(0);
  doc.text("Total Orders", secondX + cardWidth / 2, startY + 10, {
    align: "center",
  });
  doc.setTextColor(255, 87, 51);
  doc.text(`${reportData.totalOrders}`, secondX + cardWidth / 2, startY + 18, {
    align: "center",
  });

  // Card 3: Avg Order
  const thirdX = startX + (cardWidth + gap) * 2;
  doc.setFillColor(240, 240, 240);
  doc.rect(thirdX, startY, cardWidth, cardHeight, "F");
  doc.setTextColor(0);
  doc.text("Avg Order", thirdX + cardWidth / 2, startY + 10, {
    align: "center",
  });
  doc.setTextColor(255, 87, 51);
  doc.text(
    `PKR ${reportData.avgOrderValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`,
    thirdX + cardWidth / 2,
    startY + 18,
    { align: "center" }
  );

  // Sales by Period
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Sales by Period", 14, 100);

  if (reportData.salesByPeriod?.length > 0) {
    autoTable(doc, {
      startY: 105,
      head: [["Period", "Sales (PKR)", "Orders"]],
      body: reportData.salesByPeriod.map((item) => [
        item.period,
        item.sales.toLocaleString("en-US", { minimumFractionDigits: 2 }),
        item.orders,
      ]),
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 87, 51], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("No data available for Sales by Period", 14, 110);
  }

  // Top Selling Products
  const startYProducts = (doc.lastAutoTable?.finalY || 115) + 10;
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Top Selling Products", 14, startYProducts);

  if (reportData.topProducts?.length > 0) {
    autoTable(doc, {
      startY: startYProducts + 5,
      head: [["Product", "Sales (PKR)", "Units Sold"]],
      body: reportData.topProducts.map((product) => [
        product.name,
        product.totalSales.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        }),
        product.unitsSold,
      ]),
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 87, 51], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(
      "No data available for Top Selling Products",
      14,
      startYProducts + 10
    );
  }

  // Borders
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  doc.setLineWidth(0.7);
  doc.setDrawColor(255, 87, 51);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20); // Outer
  doc.setLineWidth(0.3);
  doc.rect(11, 11, pageWidth - 22, pageHeight - 22); // Inner

  // Footer ABOVE border
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(
    `Powered by ${restaurantName} | Contact: ${contactNumber}`,
    105,
    pageHeight - 14,
    { align: "center" }
  );

  doc.save("sales-report.pdf");
};

export default generatePDF;
