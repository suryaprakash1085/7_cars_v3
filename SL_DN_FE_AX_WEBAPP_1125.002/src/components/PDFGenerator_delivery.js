import {
  Document,
  Page,
  View,
  Text,
  Image as PDFImage,
  pdf,
} from "@react-pdf/renderer";
import toWords from "number-to-words";
import Cookies from "js-cookie";
import { formatDate } from "../../controllers/jobStatusIDControllers.js";
const printDates = new Date() || "UNKNOWN Date";
const printedBys = Cookies.get("userName") || "UNKNOWN User";

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

const delivery_challan_pdf = async ({
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
  services,
  printDate,
  printedBy,
  companyDetails,
  vehicleMake,
  vehicleModel,
  appointmentDate,
  openInNewTab = false,
}) => {
  const { vehicleMake: resolvedVehicleMake, vehicleModel: resolvedVehicleModel } =
    getVehicleDetails(customer, vehicleId, vehicleMake, vehicleModel);

  const amountInWords = (amount) => {
    const wholeNumber = Math.round(amount);
    return (
      toWords.toWords(wholeNumber).charAt(0).toUpperCase() +
      toWords.toWords(wholeNumber).slice(1)
    );
  };

  const itemsPerPage = 15;
  const totalSpares =
    estimateItems?.reduce((acc, item) => acc + item.spares.length, 0) ||
    Math.ceil(services.length / itemsPerPage);
  const totalPages = Math.ceil(totalSpares / itemsPerPage);

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

  const MyDocument = () => (
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
          <View>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 16,
                textAlign: "center",
              }}
            >
              Delivery Challan
            </Text>
          </View>
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
                height: 300,
                width: 450,
                position: "absolute",
                top: "30%",
                left: "10%",
                opacity: 0.1,
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            {/* Header Section */}
            {/* <View style={{ textAlign: "center", marginBottom: 10 }} fixed>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingBottom: 10,
                                borderBottom: "2px solid #000",
                            }}
                        >
                            <PDFImage
                                src="/icons/pdf_head.png"
                                style={{ height: 75, width: 75 }}
                            />
                            <PDFImage
                                src="/icons/Arg_s7Cars Logo.png"
                                style={{ height: 100, width: 150 }}
                            />
                            <View style={{ textAlign: "center", flexGrow: 1 }}>
                                <PDFImage
                                    src="/icons/ayyanar.png"
                                    style={{ height: 30, width: 130, marginRight: 350 }}
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
                    </View> */}

            <PDFImage
              src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/pdf_header/${PdfHeaderImage}`}
              style={{
                objectFit: "cover",
                width: "100%",
                height: 120,
                paddingLeft: 20,
              }}
            />

            {/* Patron and Vehicle Details */}
            <View
              style={{
                borderTop: "1px solid #000",
                borderBottom: "1px solid #000",
                // padding: 10,
                // marginBottom: 10,
                flexDirection: "row",
                justifyContent: "space-between",
                fontSize: 11.5,
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
                {" "}
                <View
                  style={{
                    width: "60%",
                    borderRight: 1,
                    paddingTop: 5,
                    // fontSize: 10,
                    paddingLeft: 10,
                    display: "flex",
                    gap: 5,
                  }}
                >
                  {/* Patron */}
   <View style={{ flexDirection: "column" }}>
  
  {/* Row 1 */}
  <View style={{ flexDirection: "row" }}>
    <Text style={{ width: 60, fontFamily: "Helvetica-Bold" }}>
      Patron
    </Text>
    <Text style={{ width: 10 }}>:</Text>
    <Text style={{ width: 300, fontFamily: "Helvetica-Bold" }}>
      {customer.prefix} {customer.customer_name}
    </Text>
  </View>

  {/* Row 2 (aligned properly) */}
  <View style={{ flexDirection: "row" }}>
    <Text style={{ width: 60 }} />   {/* empty space for "Patron" */}
    <Text style={{ width: 10 }} />   {/* empty space for ":" */}
    <Text style={{ width: 300 }}>
      {customer.contact.address.street},{" "}
      {customer.contact.address.city}
    </Text>
  </View>

</View>

                 

                  {/* Phone */}
                  <View style={{ flexDirection: "row" }}>
                     <Text style={{ width: 60 }} />   {/* empty space for "Patron" */}
    <Text style={{ width: 10 }} />   {/* empty space for ":" */}
    {/* <Text style={{ width: 100 }}></Text> */}
                    <Text style={{ fontFamily: "Helvetica-Bold", width: 300 }}>
                      {customer.contact.phone}
                    </Text>
                  </View>

                  {customer.gst_number && (
                    // <View style={{ flexDirection: "row", marginBottom: 2 }}>
                    //   <Text style={{ width: 70 }}>GSTIN</Text>
                    //   <Text style={{ width: 10 }}>:</Text>

                    //   <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>
                    //     {customer.gst_number || "N/A"}
                    //     </Text>
                    // </View>

                    <View style={{ flexDirection: "row" }}>
                      <Text style={{ width: 60, fontFamily: "Helvetica-Bold" }}>
                        GSTIN
                      </Text>
                      <Text style={{ width: 10 }}>:</Text>
                      <Text
                        style={{ fontFamily: "Helvetica-Bold", width: 300 }}
                      >
                        {customer.gst_number || "N/A"}
                      </Text>
                    </View>
                  )}
                </View>
                {/* <View
         style={{
           flexDirection: "column",
           width: "40%",
           justifyContent: "center", // Center vertically
           alignItems: "center", // Center horizontally
           // minHeight: 150, // Ensures space even if data is missing
         }}
       >
         {[
           { label: "Appointment No :", value: appointmentId || "N/A" },
           { label: "Delivery Date :", value: new Date().toLocaleDateString("en-GB") },
           { label: "Vehicle No :", value: vehicleId || "N/A" },
           { label: "Vehicle Kms :", value: km || "N/A" },
         
         ].map((item, index) => (
           <View
             key={index}
             style={{
               flexDirection: "row",
               justifyContent: "center",
               alignItems: "center",
               width: "100%",
             }}
           >
             <Text style={{ fontWeight: "bold", minWidth: 130, textAlign: "right" }}>
               {item.label}
             </Text>
             <Text style={{ textAlign: "left", flex: 1, marginLeft: 5 }}>
               {item.value}
             </Text>
           </View>
         ))}
       </View> */}
                <View
                  style={{
                    width: "50%",
                    alignItems: "flex-start",
                    paddingTop: 5,
                    paddingLeft: 10,
                  }}
                >
                  {[
                    { label: "Appointment No", value: appointmentId || "N/A" },
                    {
                      label: "Delivery Date",
                      value:  appointmentDate || "N/A",
                    },
                    { label: "Vehicle No", value: vehicleId },
                    { label: "Vehicle Make", value: resolvedVehicleMake },
                    { label: "Vehicle Model", value: resolvedVehicleModel },
                    ...(km != null
  ? [{ label: "Vehicle Kms", value: km }]
  : []),

...(nextServiceKm > 0
  ? [
      {
        label: "Next Service",
        value: `${nextServiceKm} KM`,
      },
    ]
  : []),
                  ]
                    .filter((item) => item.value)
                    .map((item, index) => (
                      <View key={index} style={{ flexDirection: "row", marginBottom: 2 }}>
                        <Text style={{ width: 100 }}>{item.label}</Text>
                        <Text style={{ width: 10 }}>:</Text>
                        <Text style={{ width: 120, fontFamily: "Helvetica-Bold" }}>
                          {item.value}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            </View>

            {/* Items Table */}
            {/* Items Table */}
            <View style={{ flex: 1, position: "relative" }}>
              {/* 1. COLUMN LINES OVERLAY */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  flexDirection: "row",
                  pointerEvents: "none", // so table rows are clickable/selectable if needed
                }}
              >
                <View
                  style={{
                    width: "8%",
                    borderRight: "1px solid #000",
                    height: "100%",
                  }}
                />
                <View
                  style={{
                    width: "40%",
                    borderRight: "1px solid #000",
                    height: "100%",
                  }}
                />
                <View
                  style={{
                    width: "12%",
                    borderRight: "1px solid #000",
                    height: "100%",
                  }}
                />
                <View
                  style={{
                    width: "20%",
                    borderRight: "1px solid #000",
                    height: "100%",
                  }}
                />
                <View style={{ width: "20%", height: "100%" }} />{" "}
                {/* last column no right border */}
              </View>

              {/* 2. TABLE HEADER */}
              <View
                style={{
                  flexDirection: "row",
                  borderBottom: "1px solid #000",
                  // backgroundColor: "#f0f0f0",
                  fontFamily: "Helvetica-Bold",
                  zIndex: 1, // ensure header is above the border lines
                  fontSize: 11,
                }}
              >
                <View style={{ width: "8%", padding: 4 }}>
                  <Text style={{ textAlign: "center" }}>S.No</Text>
                </View>
                <View
                  style={{ width: "40%", padding: 4, alignItems: "center" }}
                >
                  <Text>Particulars</Text>
                </View>
                <View style={{ width: "12%", padding: 4 }}>
                  <Text style={{ textAlign: "center" }}>Quantity</Text>
                </View>
                <View style={{ width: "20%", padding: 4 }}>
                  <Text style={{ textAlign: "center" }}>Inspection Status</Text>
                </View>
                <View style={{ width: "20%", padding: 4 }}>
                  <Text style={{ textAlign: "center" }}>Comments</Text>
                </View>
              </View>

              {/* Render items for the current page */}
              {/* 3. ITEMS ROWS */}
              <View style={{ zIndex: 1 }}>
                {services
                  .slice(
                    pageIndex * itemsPerPage,
                    (pageIndex + 1) * itemsPerPage,
                  )
                  .map((service, index) => {
                    // Safely get the first item name or use a default value
                    const itemName =
                      service.items_required && service.items_required[0]
                        ? service.items_required[0].item_name
                        : "No items";

                    // Safely parse comments
                    let comments = "-"; // Default value in case no comments or invalid JSON

                    if (service.comments) {
                      try {
                        // Attempt to parse the comments as JSON
                        const parsedComments = JSON.parse(service.comments);
                        comments = parsedComments[0]?.comments || "-"; // Access the comment or use default "-"
                      } catch (error) {
                        // If JSON parsing fails, use the comments directly
                        comments = service.comments;
                        // console.error("Error parsing comments, displaying as raw text:", error);
                      }
                    }

                    return (
                      <View
                        key={index}
                        style={{
                          flexDirection: "row",
                          padding: 1,
                          fontSize: 12,
                        }}
                      >
                        <View style={{ width: "8%", padding: 4 }}>
                          <Text style={{ textAlign: "center" }}>
                            {index + 1 + pageIndex * itemsPerPage}
                          </Text>
                        </View>
                        <View style={{ width: "40%", padding: 4 }}>
                          <Text style={{ textAlign: "left" }}>
                            {`${itemName} - ${
                              service.service_description || ""
                            }`}
                          </Text>
                        </View>
                        <View style={{ width: "12%", padding: 4 }}>
                          <Text style={{ textAlign: "center" }}>
                            {(() => {
                              const qty = Number(
                                service.items_required?.[0]?.qty ?? 0,
                              ); // get qty from first required item safely
                              return qty % 1 === 0 ? qty : qty.toFixed(1);
                            })()}
                          </Text>
                        </View>
                        <View style={{ width: "20%", padding: 4 }}>
                          <Text
                            style={{
                              textAlign: "center",
                            }}
                          >
                            {service.service_status === "Completed"
                              ? "Checked Ok"
                              : "Deffered"}
                          </Text>
                        </View>
                        <View style={{ width: "20%", padding: 4 }}>
                          <Text style={{ textAlign: "center" }}>
                            {comments}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </View>

            {/* Signature section */}
            {/* Signature Section */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderTop: "1px solid #000",
                fontSize: 11,

                alignItems: "flex-end",
                height: 60,
                marginBottom: 10,
              }}
            >
              {/* Prepared By */}
              <View style={{ width: "40%", alignItems: "center" }}>
                <View
                  style={{
                    width: "100%",
                  }}
                />
                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                  Prepared By
                </Text>
              </View>

              {/* Received By */}
              <View style={{ width: "40%", alignItems: "center" }}>
                <View
                  style={{
                    width: "100%",
                  }}
                />
                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                  Received By
                </Text>
              </View>
            </View>

            {/* Footer Section */}
            {/* <View style={{ width: "100%", textAlign: "right" }}>
                       <Text>
                         Printed by : {userId} - {user}
                       </Text>
                     </View> */}
            {/* Footer Section */}

            {pageIndex === totalPages - 1 && (
              // <View
              //   style={{
              //     backgroundColor: "#f0f0f0",
              //     height: 40,
              //     justifyContent: "center",
              //     alignItems: "center",
              //     borderTop: "1px solid #000",
              //   }}
              // >
              //   <Text
              //     style={{
              //       fontSize: 8,
              //       fontWeight: "bold",
              //       textAlign: "center",
              //     }}
              //   >
              //     Our Services: {companyDetails?.[0]?.services || ""}
              //   </Text>
              // </View>

               <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "#000",
              backgroundColor: "#f0f0f0",
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 0, //  remove padding
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
              Our Services: {companyDetails[0].services}
            </Text>
          </View>
            )}
            {/* <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                backgroundColor: "#f5f5f5",
                borderTop: "1px solid #000",
                paddingVertical: 6,
                paddingHorizontal: 10,
                fontSize: 8,
              }}
            >
              <Text
                style={{ fontSize: 9 }}
                render={({ pageNumber, totalPages }) =>
                  `Page ${pageNumber} of ${totalPages}`
                }
              />
              <Text>Date: {formatDate(printDate || printDates)}</Text>

              <Text>Printed By: {printedBy || printedBys}</Text>

              <Text>Print Type: Reprint</Text>
            </View> */}
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

  // const pdfBlob = await pdf(<MyDocument />).toBlob();
  // const url = URL.createObjectURL(pdfBlob);
  // const link = document.createElement("a");
  // link.href = url;
  // const Timestamp = new Date().getTime();
  // link.download = `Delivery_Challan_${appointmentId}_${Timestamp}.pdf`;
  // document.body.appendChild(link);
  // link.click();
  // document.body.removeChild(link);

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

export default delivery_challan_pdf;
