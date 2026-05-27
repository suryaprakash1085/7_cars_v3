"use client";
import React, { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import {
  Box,
  useMediaQuery,
  IconButton,
  Modal,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import ConformationDialogue from "./conformationDialogue.js";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import AddIcon from "@mui/icons-material/Add";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { PhotoCamera, AttachFile, Delete } from "@mui/icons-material";
import imageCompression from "browser-image-compression";
import { v4 as uuidv4 } from "uuid";
import LightboxComponent from "./lightbox";
import { getCompanyCodeFromCookies, buildHeadersWithCompanyCode } from "@/utils/companyCodeHelper";

export default function VisualInspectionPhotos({
  setmainpageimage,
  appointmentId,
  visualInspectionData,
  visualInspectionComments,
  setimage_delete,
}) {
  const pathname = usePathname();
  let currentRoute = pathname.split("/")[2];

  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedInspectionImage, setSelectedInspectionImage] = useState(null);
  const [imagePreviews, setImagePreviews] = useState({});
  const [imageSizes, setImageSizes] = useState({});
  const [imageBase64, setImageBase64] = useState({});
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [openinspection, setopeninspection] = useState(false);
  const [openConformationDialogue, setOpenConformationDialogue] =
    useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const compressImage = async (image) => {
    const options = {
      maxSizeMB: 0.4, // Maximum size in MB
      maxWidthOrHeight: 595, // Maximum width or height
      useWebWorker: true, // Use a web worker for better performance
    };
    // console.log("current size of image", image.size);
    const compressedFile = await imageCompression(image, options);
    // console.log("compressed size of image", compressedFile.size);
    return compressedFile;
  };

  const [comments, setComments] = useState({});

  const handleImageClick = (imageId) => {
    setSelectedImage(imageId);
    fileInputRef.current?.click();
  };

  const handleInspectionImageClick = (imageId) => {
    setSelectedInspectionImage(imageId);
    fileInputRef.current?.click();
  };

  const handleCommentChange = (e, index) => {
    const newComments = { ...comments };
    newComments[index] = e.target.value;
    setComments(newComments);
  };

  const handleSendComment = async (comment) => {
    console.log({ comments });
    if (!comments[comment]) {
      console.log("No Comment");
      return;
    }
    try {
      const companyCode = getCompanyCodeFromCookies();
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/visual_inspection_comments/`,
        {
          name: comment,
          comment: comments[comment] || "",
          company_code: companyCode,
        },
        {
          headers: {
            ...buildHeadersWithCompanyCode(),
            "x-company-code": companyCode,
          },
        }
      );
      console.log("Comment sent to backend:", response.data);
    } catch (error) {
      console.error("Error sending comment to backend:", error);
    }
  };
  const handleDeleteSuccess = (idValue) => {
    setOpenConformationDialogue(false);

    // setImagePreviews

    console.log("calling on delete success");
    // setimage_delete(Math.random());
    window.location.reload();
  };

  // { console.log({ miscellaneousItems }) }
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && selectedImage) {
      try {
        const final = await convertToBase64(file);
        const companyCode = getCompanyCodeFromCookies();
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/visual_inspection`,
          {
            name: selectedImage,
            images: [final],
            comments: comments[selectedImage] || "", // Append comments
            company_code: companyCode,
          },
          {
            headers: {
              ...buildHeadersWithCompanyCode(),
              "x-company-code": companyCode,
            },
          }
        );
        console.log("Response from backend:", response.data);

        // Update the imagePreviews state to reflect the new image
        setImagePreviews((prev) => ({
          ...prev,
          [selectedImage]: final, // Replace the existing image with the new one
        }));
      } catch (error) {
        console.error(
          "Error converting file to base64 or sending to backend:",
          error
        );
      }
    }
  };

  const handleInspectionFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && selectedInspectionImage) {
      try {
        const final = await convertToBase64(file);
        const companyCode = getCompanyCodeFromCookies();
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/visual_inspection`,
          {
            name: selectedInspectionImage,
            images: [final],
            comments: comments[selectedInspectionImage] || "", // Append comments
            company_code: companyCode,
          },
          {
            headers: {
              ...buildHeadersWithCompanyCode(),
              "x-company-code": companyCode,
            },
          }
        );
        console.log("Response from backend:", response.data);

        // Update the imagePreviews state to reflect the new image
        setImagePreviews((prev) => ({
          ...prev,
          [selectedInspectionImage]: final, // Replace the existing image with the new one
        }));
      } catch (error) {
        console.error(
          "Error converting file to base64 or sending to backend:",
          error
        );
      }
    }
  };

  const handleClearrow = (index) => {
    const newItems = [...miscellaneousItems];
    // clear the row when the clear button is clicked
    // newItems[index].images = [];
    newItems.splice(index, 1);
    setMiscellaneousItems(newItems);
  };
  const handleImageChange = async (e, index) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newItems = [...miscellaneousItems];

      // Initialize the images array if it doesn't exist
      if (!newItems[index].images) {
        newItems[index].images = [];
      }

      for (const file of files) {
        try {
          // Compress the image using the compressImage function
          const compressedFile = await compressImage(file);

          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result; // Get the base64 string
            newItems[index].images.push(base64String); // Append the base64 string to the images array

            // Update imageBase64 to include the name and base64 string
            setImageBase64((prev) => ({
              ...prev,
              [newItems[index].name]: base64String, // Associate the name with the base64 string
            }));

            setMiscellaneousItems(newItems); // Update the state
          };
          reader.readAsDataURL(compressedFile); // Read the compressed file as a data URL
        } catch (error) {
          console.error("Error processing file:", error);
        }
      }
    }
  };
  const handleSubmit = () => {
    // You can handle form submission logic here (e.g., send data to a server)
    // console.log('Name:', name);
    // console.log('Image:', image);
    setopeninspection(false); // Close modal after submission
  };

  const convertToBase64 = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        resolve(reader.result); // This will be the base64 string
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // const getimagebyprefix = (prefix) => {
  //   // Iterate through the keys in visualInspectionData to match the prefix
  //   for (const key in visualInspectionData) {
  //     // Check if the image path contains the prefix (case-insensitive)
  //     if (visualInspectionData[key].toLowerCase().includes(prefix.toLowerCase())) {
  //       const imagePath = visualInspectionData[key];
  //       const fileName = imagePath.split('\\').pop(); // Extract the filename
  //       return fileName;
  //     }
  //   }
  //   return null;
  // };

  // console.log("getimagebyprefix", getimagebyprefix("front"));

  console.log("visualInspectionData", visualInspectionData);
  console.log("visualInspectionComments", visualInspectionComments);
  // const get_comments = JSON.parse(visualInspectionComments);
  // console.log("get_comments",get_comments);

  // Define separate views

  const inView = [
    {
      id: "front",
      name: "Front-View",
      defaultSrc: process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/appointment/visual_inspection/image/${appointmentId}/Front-View.png`
        : "/assets/images/frontView.png", // Fallback image
    },
    {
      id: "right",
      name: "Right-View",
      defaultSrc: process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/appointment/visual_inspection/image/${appointmentId}/Right-View.png`
        : "/assets/images/rightView.png", // Fallback image
    },
    {
      id: "back",
      name: "Back-View",
      defaultSrc: process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/appointment/visual_inspection/image/${appointmentId}/Back-View.png`
        : "/assets/images/backView.png", // Fallback image
    },
    {
      id: "left",
      name: "Left-View",
      defaultSrc: process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/appointment/visual_inspection/image/${appointmentId}/Left-View.png`
        : "/assets/images/leftView.png", // Fallback image
    },
    // {
    //   id: "dashboard",
    //   name: "Dashboard View",
    //   defaultSrc: "/assets/images/dashboardView.png",
    // },
  ];

  const out_view = [
    {
      id: "front",
      name: "out_Front-View",
      defaultSrc: process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/appointment/visual_inspection/image/${appointmentId}/out_Front-View.png`
        : "/assets/images/frontView.png", // Fallback image
    },
    {
      id: "right",
      name: "out_Right-View",
      defaultSrc: process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/appointment/visual_inspection/image/${appointmentId}/out_Right-View.png`
        : "/assets/images/rightView.png", // Fallback image
    },
    {
      id: "back",
      name: "out_Back-View",
      defaultSrc: process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/appointment/visual_inspection/image/${appointmentId}/out_Back-View.png`
        : "/assets/images/backView.png", // Fallback image
    },
    {
      id: "left",
      name: "out_Left-View",
      defaultSrc: process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/appointment/visual_inspection/image/${appointmentId}/out_Left-View.png`
        : "/assets/images/leftView.png", // Fallback image
    },
    // {
    //   id: "dashboard",
    //   name: "Dashboard View",
    //   defaultSrc: "/assets/images/dashboardView.png",
    // },
  ];

  // const inView_interior = [
  //   {
  //     id: "mat",
  //     name: "Mat",
  //     defaultSrc: "/assets/images/seat.jpg",
  //   },
  //   {
  //     id: "seat",
  //     name: "Seat",
  //     defaultSrc: "/assets/images/seat.jpg",
  //   },
  //   {
  //     id: "back bonnet",
  //     name: "Back Bonnet",
  //     defaultSrc: "/assets/images/back-bonnet.jpg",
  //   },
  //   {
  //     id: "windshield",
  //     name: "Windshield",
  //     defaultSrc: "/assets/images/wind-shield.jpg",
  //   },
  //   {
  //     id: "dashboard",
  //     name: "Dashboard",
  //     defaultSrc: "/assets/images/dashboardView.png",
  //   },
  // ];

  // add a add icon to add miscellaneous items
  const [miscellaneousItems, setMiscellaneousItems] = useState([]);
  const addMiscellaneousItem = () => {
    setopeninspection(true);
    setMiscellaneousItems([
      ...miscellaneousItems,
      { id: Date.now(), name: "", images: [] },
    ]);
  };

  // Function to check if the current image is a fallback
  const isFallbackImage = (src, viewName) => {
    return src === `/assets/images/${viewName.toLowerCase()}View.png`;
  };

  useEffect(() => {
    // if (imageBase64) {
    setmainpageimage(imageBase64);
    console.log("1st");
    // }

    // Prefill images from visualInspectionData
    if (visualInspectionData) {
      const parsedData = JSON.parse(visualInspectionData);
      const updatedPreviews = {};
      Object.entries(parsedData).forEach(([key, imagePath]) => {
        const imageUrl = `${
          process.env.NEXT_PUBLIC_API_URL
        }/appointment/visual_inspection/image/${appointmentId}/${imagePath.replace(
          /\\/g,
          "/"
        )}`;
        updatedPreviews[key] = imageUrl;
      });
      setImagePreviews(updatedPreviews);
    }
  }, [imageBase64, visualInspectionData]);

  // Initialize comments with parsed visualInspectionComments
  useEffect(() => {
    if (visualInspectionComments) {
      setComments(JSON.parse(visualInspectionComments));
    }
  }, [visualInspectionComments]);

  return (
    <div>
      {openConformationDialogue && (
        <ConformationDialogue
          openConformationModal={openConformationDialogue}
          setOpenConformationModal={setOpenConformationDialogue}
          details={{ action: "delete", name: "attachment" }}
          selectedRow={selectedRow}
          deleteurl={`${process.env.NEXT_PUBLIC_API_URL}/appointment/delete_item/${appointmentId}/visual_inspection/${selectedRow}`}
          deleteMethod="DELETE"
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
      {/* showing the modal when the add icon is clicked */}
      <Modal open={openinspection} onClose={() => setopeninspection(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600, // increased width for a larger modal
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
            maxHeight: "80vh", // Set a max height for the modal
            overflow: "auto", // Make the content scrollable
          }}
        >
          <Typography variant="h6" component="h2" mb={2}>
            Miscellaneous Items
          </Typography>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addMiscellaneousItem}
            sx={{ mb: 2 }}
          >
            Add More Items
          </Button>
          <Box sx={{ mb: 2 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                    Name
                  </th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                    Image Previews
                  </th>
                  <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {miscellaneousItems.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...miscellaneousItems];
                          newItems[index].name = e.target.value;
                          setMiscellaneousItems(newItems);
                        }}
                      />
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      {item.images.length === 0 && (
                        <Button
                          variant="contained"
                          component="label"
                          startIcon={<PhotoCamera />}
                        >
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            multiple
                            onChange={(e) => handleImageChange(e, index)}
                          />
                        </Button>
                      )}
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "center",
                          mt: 1,
                        }}
                      >
                        {item.images &&
                          item.images.map((img, imgIndex) => (
                            <img
                              key={imgIndex}
                              src={img}
                              alt={`Preview ${imgIndex}`}
                              style={{
                                maxWidth: "100px",
                                maxHeight: "100px",
                                margin: "5px",
                              }}
                            />
                          ))}
                      </Box>
                    </td>
                    <td
                      style={{
                        border: "1px solid #ccc",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      <IconButton
                        variant="contained"
                        color="error"
                        onClick={() => handleClearrow(index)}
                      >
                        {/* showing delete icon only if contains images  */}

                        <DeleteIcon
                        // disabled={miscellaneousItems.length > 0}
                        />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
          <Button
            fullWidth
            variant="contained"
            sx={{
              width: "100px",
              alignContent: "center",
              marginLeft: "auto",
              marginRight: "auto",
            }}
            color="primary"
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </Box>
      </Modal>

      <Box
        sx={{
          backgroundColor: "white",
          justifyContent: "center",
          alignItems: "center",
          margin: "20px",
          padding: "10px",
          borderRadius: "10px",
        }}
      >
        {/* <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <h2>Exterior Visual Inspection</h2>
          <IconButton
            style={{ marginLeft: "auto" }}
            size="large"
            color="primary"
            aria-label="add"
            type="outlined"
            onClick={addMiscellaneousItem}
          >
            <AttachFile /> 
            <Typography>Add Attachments </Typography>
          </IconButton>
        </div> */}

        {/* //? OUT VIEW SECTION */}
        {currentRoute == "serviceInspection" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h3>Vehicle Out</h3>
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row", // Flex direction based on screen size
                justifyContent: "center",
                gap: 3, // Slightly increased gap for better visual balance
                flexWrap: "wrap", // Ensure items wrap on smaller screens
                alignItems: "flex-start", // Align items to the top for a neat appearance
              }}
            >
              {out_view.map((view) => (
                <Box
                  key={view.id}
                  sx={{
                    textAlign: "center",
                    width: isMobile ? "100%" : "auto", // Adjust width based on screen size
                    maxWidth: "250px", // Limit max width of each view box
                    padding: 2, // Add padding for better spacing
                    backgroundColor: "#f9f9f9", // Light background color for each box
                    borderRadius: "8px", // Rounded corners for the box
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
                  }}
                >
                  <Box
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <h4>{view.name}</h4>
                    <IconButton
                      // disabled={currentRoute == "serviceInspection"}
                      variant="contained"
                      style={{
                        cursor: "pointer", // Change cursor when disabled
                      }}
                      onClick={() => {
                        if (currentRoute !== "serviceInspection") {
                          handleImageClick(view.name);
                        } else {
                          handleInspectionImageClick(view.name);
                        }
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `/assets/images/${view.id}View.png`; // Fallback image
                      }}
                    >
                      <CameraAltIcon />
                    </IconButton>{" "}
                    <IconButton
                    // disabled={}
                    >
                      <DeleteIcon
                        // disabled={true}
                        onClick={() => {
                          // handleDeleteImage(view.name);
                          setOpenConformationDialogue(true);
                          setSelectedRow(view.name);
                          console.log("view.name", view.name);
                        }}
                        style={{ marginLeft: 10 }} // Optional: Add space between icons
                      />
                    </IconButton>
                  </Box>

                  <LightboxComponent
                    imageUrl={imagePreviews[view.name] || view.defaultSrc}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mt: 2,
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    <TextField
                      // disabled={currentRoute == "serviceInspection"}
                      variant="outlined"
                      placeholder="Add a comment"
                      value={comments[view.name] || ""}
                      multiline
                      rows={2}
                      onChange={(e) => handleCommentChange(e, view.name)}
                      sx={{
                        flexGrow: 1,
                        fontSize: "14px",
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        "& .MuiOutlinedInput-root": {
                          padding: "4px 8px",
                        },
                        minWidth: "120px",
                      }}
                      onBlur={() => {
                        handleSendComment(view.name);
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}

        {/* //? IN VIEW SECTION */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h3>Vehicle In</h3>
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row", // Flex direction based on screen size
              justifyContent: "center",
              gap: 3, // Slightly increased gap for better visual balance
              flexWrap: "wrap", // Ensure items wrap on smaller screens
              alignItems: "flex-start", // Align items to the top for a neat appearance
            }}
          >
            {inView.map((view) => (
              // console.log('inview', inView),
              <Box
                key={view.id}
                sx={{
                  textAlign: "center",
                  width: isMobile ? "100%" : "auto", // Adjust width based on screen size
                  maxWidth: "250px", // Limit max width of each view box
                  padding: 2, // Add padding for better spacing
                  backgroundColor: "#f9f9f9", // Light background color for each box
                  borderRadius: "8px", // Rounded corners for the box
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
                }}
              >
                <Box
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h4>{view.name}</h4>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {" "}
                    {/* Added this div */}
                    <IconButton
                      disabled={currentRoute === "serviceInspection"}
                      variant="contained"
                      style={{
                        cursor:
                          currentRoute === "serviceInspection"
                            ? "zoom-in"
                            : "pointer",
                      }}
                      onClick={() => {
                        if (currentRoute !== "serviceInspection") {
                          handleImageClick(view.name);
                        }
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `/assets/images/${view.id}View.png`; // Fallback image
                      }}
                    >
                      <CameraAltIcon />
                    </IconButton>
                    {console.log({ inView })}
                    <IconButton disabled={currentRoute === "serviceInspection"}>
                      <DeleteIcon
                        // disabled={true}
                        onClick={() => {
                          // handleDeleteImage(view.name);
                          setOpenConformationDialogue(true);
                          setSelectedRow(view.name);
                          console.log("view.name", view.name);
                        }}
                        style={{ marginLeft: 10 }} // Optional: Add space between icons
                      />
                    </IconButton>
                  </div>
                </Box>

                {/* <img
                  disabled={currentRoute == "serviceInspection"}
                  src={imagePreviews[view.name] || view.defaultSrc}
                  alt={view.name}
                  width={imageSizes[view.name]?.width || 300}
                  height={imageSizes[view.name]?.height || 150}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "8px", // Rounded corners for images
                    cursor: "pointer",
                  }}
                  onClick={() => handleImageClick(view.name)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/assets/images/${view.id}View.png`; // Fallback image
                  }}
                />
                 */}
                {/* <img
                  src={imagePreviews[view.name] || view.defaultSrc}
                  alt={view.name}
                  width={imageSizes[view.name]?.width || 300}
                  height={imageSizes[view.name]?.height || 150}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "8px",
                    cursor:
                      currentRoute === "serviceInspection"
                        ? "zoom-in"
                        : "pointer", // Change cursor when disabled
                  }}
                  onClick={() => {
                    if (currentRoute !== "serviceInspection") {
                      handleImageClick(view.name);
                    }
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/assets/images/${view.id}View.png`; // Fallback image
                  }}
                /> */}

                <LightboxComponent
                  imageUrl={imagePreviews[view.name] || view.defaultSrc}
                />

                <Box
                  sx={{
                    display: "flex", // Ensure items are aligned horizontally
                    alignItems: "center", // Align the items vertically in the center
                    gap: 2, // Space between the input field and the button
                    mt: 2, // Space between image and input box
                    justifyContent: "center", // Center content horizontally
                    width: "100%", // Make sure the container takes full width available
                  }}
                >
                  <TextField
                    disabled={currentRoute == "serviceInspection"}
                    variant="outlined"
                    placeholder="Add a comment"
                    value={comments[view.name] || ""}
                    multiline
                    rows={2}
                    onChange={(e) => handleCommentChange(e, view.name)}
                    sx={{
                      flexGrow: 1, // Allow the input field to expand and take available space
                      fontSize: "14px", // Smaller font for cleaner appearance
                      backgroundColor: "#fff", // White background for input box
                      borderRadius: "8px", // Rounded corners for the input box
                      "& .MuiOutlinedInput-root": {
                        padding: "4px 8px", // Padding for better legibility
                      },
                      minWidth: "120px", // Ensures a minimum width even if the screen size is small
                    }}
                    onBlur={() => {
                      handleSendComment(view.name);
                    }}
                  />

                  {/* <IconButton
                    disabled={currentRoute == "serviceInspection"}
                    color="primary"
                    onClick={() => handleSendComment(view.name)}
                    sx={{
                      display:
                        currentRoute == "serviceInspection" ? "none" : "block",
                      padding: "8px", // Slightly larger padding for more comfortable interaction
                      backgroundColor: "#007aff", // Blue background color for the button
                      borderRadius: "50%", // Make the button round
                      "&:hover": {
                        backgroundColor: "#005bb5", // Darker blue on hover
                      },
                    }}
                  >
                    <SendIcon sx={{ color: "#fff" }} />
                  </IconButton> */}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        {console.log(currentRoute)}

        {/* OUT VIEW SECTION */}
        {/* <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            marginTop: "20px",
          }}
        >
          <h3>Vehicle In</h3>
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              // flexDirection: "column",
              justifyContent: "center",
              gap: 4,
            }}
          > */}
        {/* {inView_interior.map((view) => (
              <Box
                key={view.id}
                onClick={() => handleImageClick(view.name)}
                sx={{
                  cursor: "pointer",
                  textAlign: "center",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                <h4>{view.name}</h4>
                <img
                  src={imagePreviews[view.name] || view.defaultSrc}
                  alt={view.name}
                  width={imageSizes[view.name]?.width || 300}
                  height={imageSizes[view.name]?.height || 150}
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: "10px",
                  }}
                />
              </Box>
            ))} */}
        {/* </Box>
        </Box> */}
      </Box>

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={(e) => {
          if (currentRoute == "jobCard") {
            handleFileChange(e);
          } else {
            handleInspectionFileChange(e);
          }
        }}
      />
    </div>
  );
}
