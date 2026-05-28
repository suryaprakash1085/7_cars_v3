import {
  Document,
  Page,
  View,
  Text,
  Image as PDFImage,
  pdf,
} from "@react-pdf/renderer";
import toWords from "number-to-words";
import { formatDate } from "../../controllers/jobStatusIDControllers.js";

const getVehicleDetails = (customer, vehicleId, vehicleMake, vehicleModel) => {
  const selectedVehicle = customer?.vehicles?.find(
    (vehicle) => vehicle.vehicle_id === vehicleId,
  );

  return {
    vehicleMake:
      vehicleMake ??
      selectedVehicle?.make ??
      customer?.vehicle_make ??
      customer?.make ??
      "",
    vehicleModel:
      vehicleModel ??
      selectedVehicle?.model ??
      customer?.vehicle_model ??
      customer?.model ??
      "",
  };
};

// const allSpares = estimateItems.flatMap(item => item.spares);

const generatePDF = async ({
  printDate,
  printedBy,
  customer,
  estimateItems,
  appointmentId,
  vehicleId,
  km,
  nextServiceKm,
  grandTotal,
  PdfHeaderImage,
  pdfFooterImage,
  pdfLogo,
  companyDetails,
  vehicleMake,
  vehicleModel,
  paymentMethod,
  appointmentDate,
  openInNewTab = false,
}) => {
  console.log("Generating PDF with data:", {
    printDate,
    printedBy,
    customer,
    estimateItems,
    appointmentId,
    vehicleId,
    km,
    nextServiceKm,
    grandTotal,
    PdfHeaderImage,
    pdfFooterImage,
    pdfLogo,
    companyDetails,
    vehicleMake,
    vehicleModel,
    appointmentDate,
    paymentMethod,
  });
  const { vehicleMake: resolvedVehicleMake, vehicleModel: resolvedVehicleModel } =
    getVehicleDetails(customer, vehicleId, vehicleMake, vehicleModel);




 function amountInWordsIndian(num) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

  function twoDigit(n) {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }

  if (num === 0) return "Zero";

  let n = Math.floor(num);
  let result = "";

  let crore = Math.floor(n / 10000000);
  n %= 10000000;

  let lakh = Math.floor(n / 100000);
  n %= 100000;

  let thousand = Math.floor(n / 1000);
  n %= 1000;

  let hundred = Math.floor(n / 100);
  let rest = n % 100;

  if (crore) result += twoDigit(crore) + " Crore ";
  if (lakh) result += twoDigit(lakh) + " Lakh ";
  if (thousand) result += twoDigit(thousand) + " Thousand ";

  // combine hundred + rest as one final block
  if (hundred || rest) {
    if (result !== "") result += "and ";

    if (hundred) result += ones[hundred] + " Hundred";
    if (rest) result += (hundred ? " " : "") + twoDigit(rest);
  }

  return result.trim();
}
  // const getPageGrandTotal = (pageItems) =>
  //   pageItems.reduce((sum, item) => {
  //     const qty = Number(item.qty ?? item.spares?.[0]?.qty ?? 0);
  //     const price = Number(item.price ?? item.spares?.[0]?.price ?? 0);
  //     return sum + qty * price;
  //   }, 0);
  const getPageGrandTotal = (pageItems) =>
    pageItems.reduce((sum, spare) => {
      const qty = Number(spare.qty ?? 0);
      const rate = Number(spare.price ?? 0);
      const base = qty * rate;
      const gst = hasGST ? (base * GST_PERCENT) / 100 : 0;
      return sum + base + gst;
    }, 0);

  const hasGST = Boolean(customer?.gst_number);
  const GST_PERCENT = 18;

  const itemsPerPage = 25;
  const totalSpares = estimateItems.reduce(
    (acc, item) => acc + item.spares.length,
    0,
  );
  const totalPages = Math.ceil(totalSpares / itemsPerPage);
  const columns = hasGST
    ? {
        sno: "8%",
        particulars: "40%",
        qty: "12%",
        rate: "12.5%",
        gst: "12.5%",
        amount: "15%",
      }
    : {
        sno: "8%",
        particulars: "40%",
        qty: "12%",
        rate: "20%",
        amount: "20%",
      };
  const formatTextWithEllipsis = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };
  const fullAddress = [
    customer?.contact?.address?.street,
    customer?.contact?.address?.city,
    customer?.contact?.address?.state,
    customer?.contact?.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const filteredEstimateItems = estimateItems.flatMap(
    (item) => item.spares || [],
  );

  const MyDocument = () => (
    <Document>
      {Array.from({ length: totalPages }).map((_, pageIndex) => (
        <Page
          key={pageIndex}
          size="A4"
          style={{
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 5,
            paddingBottom: 25,
            fontSize: 10,
            fontFamily: "Times-Roman",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "100vh",
          }}
        >
          {/* Main Content */}
          <View style={{ textAlign: "center" }} fixed>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              {paymentMethod === "credit" ? "Credit Estimate" : "Estimate"}
            </Text>
          </View>
          {/* Watermark */}
          {/* <PDFImage
                        src="/icons/Arg_s7Cars Logo.png"
                        style={{
                            height: 300,
                            width: 450,
                            position: "absolute",
                            top: "30%",
                            left: "10%",
                            opacity: 0.1,
                            zIndex: 0,
                            pointerEvents: "none",
                        }}
                    /> */}
          <View
            style={{
              flex: 1,
              // margin: 20,
              borderWidth: 1,
              borderColor: "#000",
              // padding: 15,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "80%",
            }}
          >
            <PDFImage
              src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/logo/${pdfLogo}`}
              style={{
                height: 120,
                width: 450,
                position: "absolute",
                top: "30%",
                left: "10%",
                opacity: 0.1,
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            {/* Header */}
            <PDFImage
              src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/pdf_header/${PdfHeaderImage}`}
              style={{
                objectFit: "cover",
                width: "100%",
                height: 120,
                paddingLeft: 20,
              }}
            />

            {/* Patron and Vehicle Details Section */}
            <View
              style={{
                borderTop: "1px solid #000",
                borderBottom: "1px solid #000",
                // padding: 2,
                // marginBottom: 10,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  // justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    width: "60%",
                    borderRight: 1,
                    paddingTop: 5,
                    fontSize: 10,
                    paddingLeft: 10,
                    display: "flex",
                    gap: 5,
                    fontSize: 12,
                    // height:"100%"
                  }}
                >
                  {/* Patron */}
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ width: 90, fontFamily: "Helvetica-Bold" }}>
                      Patron
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text
                      style={{
                        width: 300, // important
                        fontFamily: "Helvetica-Bold",
                        flexWrap: "wrap",
                      }}
                    >
                      {formatTextWithEllipsis(
                        `${customer.prefix} ${customer.customer_name}`,
                        50,
                      )}
                    </Text>
                  </View>

                  {/* Address */}
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ width: 90 }} />
                    <Text style={{ width: 10 }} />
                    <Text
                      style={{
                        width: 300, // important
                        fontFamily: "Helvetica",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* {customer.contact.address.street},{" "}
                      {customer.contact.address.city} */}
                      {formatTextWithEllipsis(fullAddress, 100)}
                    </Text>
                  </View>

                  {/* Phone */}
                       <View style={{ flexDirection: "row" }}>
                     <Text style={{ width: 90 }} />   {/* empty space for "Patron" */}
    <Text style={{ width: 10 }} />   {/* empty space for ":" */}
    {/* <Text style={{ width: 100 }}></Text> */}
                    <Text style={{ fontFamily: "Helvetica-Bold", width: 300 }}>
                      {customer.contact.phone}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    width: "40%",
                    alignItems: "flex-start",
                    paddingTop: 5,
                    paddingLeft: 10,
                    fontSize: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Estimate No
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>
                      {appointmentId}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Estimate Date
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>
                      {appointmentDate}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Vehicle No
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>
                      {vehicleId}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Vehicle Make
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ width: 120, fontFamily: "Helvetica-Bold" }}>
                      {resolvedVehicleMake}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                      Vehicle Model
                    </Text>
                    <Text style={{ width: 10 }}>:</Text>
                    <Text style={{ width: 120, fontFamily: "Helvetica-Bold" }}>
                      {resolvedVehicleModel}
                    </Text>
                  </View>

                  {km != null && km !== "" && km !== undefined && km !== 0  && (
  <View style={{ flexDirection: "row", marginBottom: 2 }}>
    <Text style={{ width: 100, fontFamily: "Helvetica" }}>
      Vehicle Kms
    </Text>
    <Text style={{ width: 10 }}>:</Text>
    <Text style={{ width: 120, fontFamily: "Helvetica-Bold" }}>
      {km}
    </Text>
  </View>
)}



                  { nextServiceKm != null &&nextServiceKm > 0 && (
                    <View style={{ flexDirection: "row", marginBottom: 2 }}>
                      <Text style={{ width: 100, fontFamily: "Helvetica" }}>
                        Next Service KM
                      </Text>
                      <Text style={{ width: 10 }}>:</Text>
                      <Text style={{ width: 120, fontFamily: "Helvetica-Bold" }}>
                        {nextServiceKm}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* {customer.gst_number && <Text>GSTIN: {customer.gst_number}</Text>} */}
            </View>

            {/* Items Table */}
            <View style={{ flex: 1, position: "relative" }}>
              {/* 1. COLUMN LINES OVERLAY */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  flexDirection: "row",
                }}
              >
                <View
                  style={{ width: columns.sno, borderRight: "1px solid #000" }}
                />
                <View
                  style={{
                    width: columns.particulars,
                    borderRight: "1px solid #000",
                  }}
                />
                <View
                  style={{ width: columns.qty, borderRight: "1px solid #000" }}
                />
                <View
                  style={{ width: columns.rate, borderRight: "1px solid #000" }}
                />

                {hasGST && (
                  <View
                    style={{
                      width: columns.gst,
                      borderRight: "1px solid #000",
                    }}
                  />
                )}

                <View style={{ width: columns.amount }} />
              </View>

              {/* 2. TABLE HEADER */}
              <View
                style={{
                  flexDirection: "row",
                  borderBottom: "1px solid #000",
                  // backgroundColor: "#f0f0f0",
                  fontFamily: "Helvetica-Bold",
                  fontSize: 12,
                  zIndex: 1, // ensure header is above the border lines
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    borderBottom: "1px solid #000",
                  }}
                >
                  <View style={{ width: columns.sno, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>S.No</Text>
                  </View>

                  <View style={{ width: columns.particulars, padding: 4 }}>
                    <Text>Particulars</Text>
                  </View>

                  <View style={{ width: columns.qty, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>Qty</Text>
                  </View>

                  <View style={{ width: columns.rate, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>Rate</Text>
                  </View>

                  {hasGST && (
                    <View style={{ width: columns.gst, padding: 4 }}>
                      <Text style={{ textAlign: "center" }}>GST</Text>
                    </View>
                  )}

                  <View style={{ width: columns.amount, padding: 4 }}>
                    <Text style={{ textAlign: "center" }}>Amount</Text>
                  </View>
                </View>
              </View>

              {/* 3. ITEMS ROWS */}
              {/* 3. ITEMS ROWS */}
              <View style={{ zIndex: 1, fontSize: 12 }}>
                {estimateItems
                  .flatMap((item) => item.spares)
                  .slice(
                    pageIndex * itemsPerPage,
                    (pageIndex + 1) * itemsPerPage,
                  )
                  .map((spare, index) => {
                    // ✅ JS LOGIC HERE
                    const qty = Number(spare.qty ?? 0);
                    const rate = Number(spare.price ?? 0);
                    const baseAmount = qty * rate;

                    const gstAmount = hasGST
                      ? (baseAmount * GST_PERCENT) / 100
                      : 0;

                    const finalAmount = baseAmount + gstAmount;

                    const displayQty = qty % 1 === 0 ? qty : qty.toFixed(1);

                    // ✅ JSX RETURN
                    return (
                      <View key={index} style={{ flexDirection: "row" }}>
                        <View style={{ width: columns.sno, padding: 4 }}>
                          <Text style={{ textAlign: "center" }}>
                            {pageIndex * itemsPerPage + index + 1}
                          </Text>
                        </View>

                        <View
                          style={{ width: columns.particulars, padding: 4 }}
                        >
                          <Text style={{ fontFamily: "Helvetica" }}>
                            {spare.spareList || "N/A"}
                          </Text>
                        </View>
                        <View style={{ width: columns.qty, padding: 4 }}>
                          <Text style={{ textAlign: "center" }}>
                            {displayQty}
                          </Text>
                        </View>

                        <View style={{ width: columns.rate, padding: 4 }}>
                          <Text style={{ textAlign: "right", paddingRight: 4 }}>
                            {rate.toFixed(2)}
                          </Text>
                        </View>

                        {hasGST && (
                          <View style={{ width: columns.gst, padding: 4 }}>
                            <Text style={{ textAlign: "right" }}>
                              {gstAmount.toFixed(2)}
                            </Text>
                          </View>
                        )}

                        <View style={{ width: columns.amount, padding: 4 }}>
                          <Text style={{ textAlign: "right", paddingRight: 4 }}>
                            {finalAmount.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </View>

            {/* ===== PAGE-WISE GRAND TOTAL ===== */}
            {/* ===== PAGE GRAND TOTAL (ONLY WHEN MULTIPLE PAGES & NOT LAST PAGE) ===== */}
            {totalPages > 1 && pageIndex < totalPages - 1 && (
              <View
                style={{
                  borderTop: "1px solid #000",
                  paddingTop: 6,
                  paddingRight: 10,
                  alignItems: "flex-end",
                  fontFamily: "Helvetica-Bold",
                  fontSize: 11.5,
                }}
              >
                <Text>
                  Page Grand Total : Rs.
                  {getPageGrandTotal(
                    filteredEstimateItems.slice(
                      pageIndex * itemsPerPage,
                      (pageIndex + 1) * itemsPerPage,
                    ),
                  ).toFixed(2)}
                </Text>
              </View>
            )}

            {/* Total Section */}
            {pageIndex === totalPages - 1 && (
              <View
                style={{
                  borderTop: "1px solid #000",
                  //   marginTop: 6,
                  //   padding: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f5f5f5",
                  height: 50,
                  fontSize: 12,
                }}
              >
                {/* Amount in Words */}
                <View
                  style={{
                    width: "60%",
                    borderRight: "1px solid #000",
                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignSelf: "stretch",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Helvetica-Bold",
                      marginBottom: 4,
                    }}
                  >
                    Amount in Words
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <PDFImage
                      src="/assets/images/rupee.png"
                      style={{ width: 10, height: 10 }}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: "Helvetica",
                      }}
                    >
                      {`${amountInWordsIndian(grandTotal)} Only.`}
                    </Text>
                  </View>
                </View>

                {/* Total Box */}
                <View
                  style={{
                    width: "40%",

                    padding: 6,
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignSelf: "stretch",
                    fontSize: 12,
                  }}
                >
                  <Text
                    style={{
                      // fontSize: 10,
                      fontFamily: "Helvetica-Bold",
                      marginBottom: 3,
                    }}
                  >
                    Grand Total :
                  </Text>

                  <Text
                    style={{
                      // fontSize: 10,
                      fontFamily: "Helvetica",
                    }}
                  >
                    Rs.
                    {grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>
            )}

            {/* Footer Section */}
            {/* {pageIndex === totalPages - 1 && ( */}
          

                   <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "#000",
              backgroundColor: "#f0f0f0",
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 0, // remove padding
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 8,
                lineHeight: 1.7, //  IMPORTANT: match fontSize
                margin: 0,
                padding: 0,
              }}
            >
              Our Services: {companyDetails?.[0]?.services || "N/A"}
            </Text>
          </View>
            

            {/* {pageIndex === totalPages - 1 && ( */}



          {pdfFooterImage ? (
  <PDFImage
    src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/pdf_footer/${pdfFooterImage}`}
    style={{ width: "100%", height: 60, objectFit: "cover" }}
  />
) : (
  <View
    fixed
    style={{
      borderTop: "1px solid #000",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      paddingHorizontal: 10,
      backgroundColor: "#f5f5f5",
      alignItems: "center",
    }}
  >
    {/* ARG Racing */}
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
    


       <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 15 }}>
     ARG's 7 Fitness
      </Text>
    
    </View>

    {/* ARG Fitness */}
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
     
       <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 15 }}>
        ARG's Racing Corp
      </Text>
    </View>

    {/* Adhiyan Auto */}
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
     
      <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 15 }}>
        Adhiyan Auto Accessories
      </Text>
    </View>
  </View>
)}

            
          </View>
        </Page>
      ))}
    </Document>
  );

  const pdfBlob = await pdf(<MyDocument />).toBlob();
const url = URL.createObjectURL(pdfBlob);

if (openInNewTab) {
  window.open(url, "_blank");
} else {
  const link = document.createElement("a");
  link.href = url;
  const Timestamp = new Date().getTime();
  link.download = `Estimate_${appointmentId}_${Timestamp}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

};

export const previewPDF = async ({
  customer,
  estimateItems,
  appointmentId,
  vehicleId,
  km,
  nextServiceKm,
  grandTotal,
  PdfHeaderImage,
  pdfFooterImage,
  pdfLogo,
  companyDetails,
  printDate,
  printedBy,
  vehicleMake,
  vehicleModel,
  paymentMethod,
  appointmentDate,
}) => {
  // Simply call generatePDF with the same parameters
  return await generatePDF({
    printDate,
    printedBy,
    customer,
    estimateItems,
    appointmentId,
    vehicleId,
    km,
    nextServiceKm,
    grandTotal,
    PdfHeaderImage,
    pdfFooterImage,
    pdfLogo,
    companyDetails,
    vehicleMake,
    vehicleModel,
    paymentMethod,
    appointmentDate,
    openInNewTab: true, 
  });
};

export default generatePDF;
