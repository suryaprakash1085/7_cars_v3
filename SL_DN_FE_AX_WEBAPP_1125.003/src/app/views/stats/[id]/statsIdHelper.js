import { Document, Page, View, Text, Image, pdf } from "@react-pdf/renderer";
export const generatePDF = async () => {
    const taxDetails = {
      value: grandTotal,
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      totalTax: totalTax,
    };

    const amountInWords = (amount) => {
      // convert amount to whole number if decimal is there ex 55.51 => 56
      const wholeNumber = Math.round(amount);
      const toWords = require("number-to-words");
      return toWords.toWords(wholeNumber).charAt(0).toUpperCase() + toWords.toWords(wholeNumber).slice(1);
    };


    const MyDocument = () => {
      const itemsPerPage = 20; // Set the number of items per page
      const totalPages = Math.ceil(estimateItems.length / itemsPerPage); // Calculate total pages

      return (
        <Document>
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <Page
              key={pageIndex}
              size="A4"
              style={{
                padding: 20,
                fontSize: 10,
                fontFamily: "Times-Roman",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "100vh",
              }}
            >
              {/* Watermark */}
              <Image
                src="/icons/Arg_s7Cars Logo.png"
                style={{
                  height: 300,
                  width: 450,
                  position: 'absolute',
                  top: '30%',
                  left: '10%',
                  opacity: 0.1,
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />

              {/* Header Section */}
              <View style={{ textAlign: "center", marginBottom: 10 }} fixed>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: 10,
                    borderBottom: "2px solid #000",
                  }}
                >
                  <Image
                    src="/icons/pdf_head.png"
                    style={{ height: 75, width: 75 }}
                  />
                  <Image
                    src="/icons/Arg_s7Cars Logo.png"
                    style={{ height: 100, width: 150 }}
                  />
                  <View style={{ textAlign: "center", flexGrow: 1 }}>
                    <Image
                      src="/icons/ayyanar.png"
                      style={{ height: 30, width: 130, marginLeft: 100 }}
                    />
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "bolder",
                        marginLeft: 80,
                      }}
                    >
                      ARG's 7 Cars
                    </Text>
                    <Text
                      style={{
                        fontWeight: "light",
                        fontStyle: "italic",
                        marginLeft: 80,
                      }}
                    >
                      Perfectus Immutatio
                    </Text>
                    <Text style={{ marginLeft: 80 }}>
                      No 366, Thiruthangal Road, Sivakasi - 626130
                    </Text>
                    <Text style={{ marginLeft: 80 }}>
                      Contact: 77080 03008, 72003 77707
                    </Text>
                    <Text style={{ marginLeft: 80 }}>
                      GSTIN: 33BGFPA9032E1ZY
                    </Text>
                  </View>
                </View>
              </View>

              {/* Patron and Vehicle Details */}
              <View
                style={{
                  border: "1px solid #000",
                  padding: 10,
                  marginBottom: 10,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    alignContent: "space-between",
                  }}
                >
                  <View style={{ width: "60%" }}>
                    <Text>Patron: Mr./Mrs./Ms.</Text>
                    <Text>
                      {customer.customer_name}
                    </Text>
                    <Text
                    >
                      Address:
                    </Text>
                    <Text>
                      {customer.contact.address.street},{" "}
                      {customer.contact.address.city}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'column', width: "40%", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
                      <Text>Estimate No</Text>
                      <Text style={{ textAlign: 'left' }}>{appointmentId}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
                      <Text>Estimate Date</Text>
                      <Text style={{ textAlign: 'left' }}>{new Date().toLocaleDateString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
                      <Text>Vehicle No</Text>
                      <Text style={{ textAlign: 'left' }}>{vehicleId}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
                      <Text>Vehicle Kms</Text>
                      <Text style={{ textAlign: 'left' }}>{km}</Text>
                    </View>
                  </View>
                </View>
                <View style={{
                  padding: 1,
                  width: "30%",
                  marginBottom: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}>
                  <Text>GSTIN: {customer.gst_number || "N/A"}</Text>
                </View>
              </View>

              {/* Items Table */}
              <View
                style={{ border: "1px solid #000", marginBottom: 10, flex: 1 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    borderBottom: "1px solid #000",
                    backgroundColor: "#f0f0f0",
                    padding: 5,
                  }}
                >
                  <Text style={{ width: "10%", textAlign: "center" }}>
                    S.No
                  </Text>
                  <Text style={{ width: "40%", textAlign: "left" }}>
                    Particulars
                  </Text>
                  <Text style={{ width: "10%", textAlign: "center" }}>Qty</Text>
                  <Text style={{ width: "10%", textAlign: "center" }}>UOM</Text>
                  <Text style={{ width: "10%", textAlign: "center" }}>
                    Rate
                  </Text>
                  {customer.gst_number ? (
                    <Text style={{ width: "10%", textAlign: "center" }}>
                      GST%
                    </Text>
                  ) : null}
                  <Text style={{ width: "20%", textAlign: "center" }}>
                    Amount
                  </Text>
                </View>

                {/* Render items for the current page */}
                {estimateItems
                  .slice(
                    pageIndex * itemsPerPage,
                    (pageIndex + 1) * itemsPerPage
                  )
                  .map((item, index) => (
                    <View
                      key={index}
                      style={{ flexDirection: "row", padding: 1 }}
                    >
                      <Text style={{ width: "10%", textAlign: "center" }}>
                        {index + 1 + pageIndex * itemsPerPage}
                      </Text>
                      <Text
                        style={{ width: "40%", textAlign: "left" }}
                      >{`${item.spareList} - ${item.reportedIssue}`}</Text>
                      <Text style={{ width: "10%", textAlign: "center" }}>
                        {item.qty}
                      </Text>
                      <Text style={{ width: "10%", textAlign: "center" }}>
                        {item.type === "Services"
                          ? inventory.find(
                            (invItem) => invItem.part_name === item.spareList
                          )?.uom || "N/A"
                          : inventory.find(
                            (invItem) => invItem.part_name === item.spareList
                          )?.uom || "N/A"}
                      </Text>
                      <Text style={{ width: "10%", textAlign: "right" }}>
                        {parseFloat(item.price).toFixed(2)}
                      </Text>
                      {customer.gst_number ? (
                        <Text style={{ width: "10%", textAlign: "right" }}>
                          {item.tax}%
                        </Text>
                      ) : null}
                      <Text style={{ width: "20%", textAlign: "right" }}>
                        {parseFloat(item.estimatedAmount).toFixed(2)}
                      </Text>
                    </View>
                  ))}
              </View>

              {/* Only add the footer on the last page */}
              {pageIndex === totalPages - 1 && (
                <>
                  {/* Total Section */}
                  <View
                    style={{
                      flexDirection: "row",
                      borderTop: "1px solid #000",
                      padding: 5,
                    }}
                  >
                    <View style={{ width: "80%", fontWeight: "bold" }}>
                      <Text style={{ textAlign: "left", fontSize: 8 }}>Amount in Words : </Text>
                      <Text style={{ textAlign: "left", fontSize: 10 }}>{amountInWords(grandTotal)}</Text>
                    </View>
                    <Text
                      style={{
                        width: "80%",
                        textAlign: "right",
                        fontWeight: "bold",
                        fontSize: 16,
                      }}
                    >
                      Total : {grandTotal.toLocaleString( undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>

                  {/* Footer Section */}
                  <View
                    style={{
                      borderTop: "1px solid #000",
                      paddingTop: 10,
                      backgroundColor: "#f0f0f0",
                      padding: 10,
                      marginTop: "auto",
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                      <View style={{ width: "50%" }}>
                        <Text style={{ fontWeight: "bold", marginBottom: 5, fontStyle: "underline" }}>Bank Details:</Text>
                        <Text style={{ fontWeight: "bold" }}>ARG's 7 Cars & Sree Jaya Finserve</Text>
                        <Text>City Union Bank, Thiruthangal</Text>
                        <Text>Account No: 51090010124030</Text>
                        <Text>IFSC Code: CIUB0000648</Text>
                        <Text>GPay: +91 7708003008</Text>
                      </View>
                      {customer.gst_number && (
                        <>
                          <View style={{ width: "1px", height: "100%", backgroundColor: "#000", marginLeft: 10, marginRight: 10 }}></View>
                          <View style={{ width: "45%", border: "1px solid #000", padding: 5 }}>
                            <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Tax Details:</Text>
                            <Text>Value: {taxDetails.value.toFixed(2)}</Text>
                            <Text>CGST: {taxDetails.cgst.toFixed(2)}</Text>
                            <Text>SGST: {taxDetails.sgst.toFixed(2)}</Text>
                            <Text>Total Tax: {taxDetails.totalTax.toFixed(2)}</Text>
                          </View>
                        </>
                      )}
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                      <View style={{ width: "50%", textAlign: "left" }}>
                        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Our Services:</Text>
                        <Text>Multi Brand Car Service & Accessories, Bodyshop work (Painting, Tinkering, Electrical & AC Repair)</Text>
                        <Text style={{ marginBottom: 5 }}>HDFC Bank & Kotak Mahindra Bank Car Loans Service, Insurance Renewal & Claim Service</Text>
                      </View>
                      <View style={{ width: "50%", textAlign: "right", alignSelf: "flex-start" }}>
                        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>For ARG's 7 Cars</Text>
                        <Text style={{ marginBottom: 5, paddingTop: 50 }}>Authorized Signature</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: "auto",
                  }}>
                    <View style={{ width: "100%" }}>
                      <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Subscidary:</Text>
                    </View>
                  </View>
                  <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between", }}>
                    <View style={{ width: "50%", marginLeft: 0, position: "static" }}>
                      <Image
                        src="/icons/ARG_s 7Fitness2.jpg"
                        style={{ height: 50, width: 250 }}
                      />
                    </View>
                    <View style={{ width: "50%", marginLeft: 50, position: "static" }}>
                      <Image
                        src="/icons/ARG_s 7Fitness2.jpg"
                        style={{ height: 50, width: 250 }}
                      />
                    </View>
                  </View>
                </>
              )}
            </Page>
          ))}
        </Document>
      );
    };

    const pdfBlob = await pdf(<MyDocument />).toBlob();
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    const Timestamp = new Date().getTime();
    link.download = `Estimate_${appointmentId}_${Timestamp}.pdf`;
    document.body.appendChild(link);
    // Open the file in a new tab
    // window.open(url, `Estimate_${appointmentId}_${Timestamp}.pdf`);
    link.click();
    document.body.removeChild(link)
  };