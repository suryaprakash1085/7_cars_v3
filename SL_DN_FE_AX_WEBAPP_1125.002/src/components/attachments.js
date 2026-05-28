"use client";
import React, { useRef, useState, useEffect } from "react";
import { Box, useMediaQuery, IconButton, Modal, Typography, TextField, Button } from "@mui/material";
import axios from "axios";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { PhotoCamera, AttachFile } from "@mui/icons-material";
import imageCompression from 'browser-image-compression';
import { v4 as uuidv4 } from 'uuid';
import LightboxComponent from "./lightbox.js";
import Cookies from "js-cookie";
import ConformationDialogue from "./conformationDialogue.js";
export default function Attachments({ setmainpageimage, appointmentDataLog, appointmentId, visualInspectionData }) {
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviews, setImagePreviews] = useState({});
  const [imageSizes, setImageSizes] = useState({});
  const [imageBase64, setImageBase64] = useState({});
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [openinspection, setopeninspection] = useState(false);
  const [openConformationDialogue, setOpenConformationDialogue] = useState(false);

  const handleImageClick = (imageId) => {
    setSelectedImage(imageId);
    fileInputRef.current?.click();
  };

  const [name, setName] = useState('');
  const [image, setImage] = useState(null);


  const [selectedRow, setSelectedRow] = useState(null);



  const handleDeleteSuccess = (idValue) => {
    const newItems = miscellaneousItems.filter(item => item.id !== idValue);
    setMiscellaneousItems(newItems);
    window.location.reload();
  };
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && selectedImage) {
      const objectURL = URL.createObjectURL(file);
      convertToBase64(file, selectedImage, objectURL);
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
          console.error('Error processing file:', error);
        }
      }
    }
  };

  //       const names = miscellaneousItems.map(item => item.name); // Collect names
  //       // remove the '[]' from the names
  //       const namesWithoutBrackets = names.map(name => name.replace('[', '').replace(']', ''));
  //       const images = miscellaneousItems.flatMap(item => item.images); // Collect all images

  //       await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/visual_inspection`, {
  //         name:namesWithoutBrackets, // Send the collected names
  //         images, // Send the collected images
  //       }, {
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       });
  //     } catch (error) {
  //       console.error('Error sending data to backend:', error);
  //     }
  // };

  const convertToBase64 = async (file, imageId, objectURL) => {
    // compress the image as small as possible before converting to base64
    const compressedFile = await compressImage(file);
    const reader = new FileReader();
    reader.readAsDataURL(compressedFile);
    reader.onloadend = () => {
      const base64String = reader.result;
      const img = new Image();
      img.src = base64String;
      // generate a unique id for the image
      const uniqueId = uuidv4();
      img.onload = () => {
        setImageSizes((prev) => ({
          ...prev,
          [imageId + '-' + uniqueId]: { width: img.width, height: img.height },
        }));
      };

      setImagePreviews((prev) => ({
        ...prev,
        [imageId]: objectURL,
      }));

      setImageBase64((prev) => ({
        ...prev,
        [imageId]: base64String,
      }));
    };
  };

  // Define separate views
  const inView = [
    {
      id: "front",
      name: "Front View",
      defaultSrc: "/assets/images/frontView.png",
    },
    {
      id: "right",
      name: "Right View",
      defaultSrc: "/assets/images/rightView.png",
    },
    {
      id: "back",
      name: "Back View",
      defaultSrc: "/assets/images/backView.png",
    },
    {
      id: "left",
      name: "Left View",
      defaultSrc: "/assets/images/leftView.png",
    },
    {
      id: "dashboard",
      name: "Dashboard View",
      defaultSrc: "/assets/images/dashboardView.png",
    },
  ];

  const inView_interior = [
    {
      id: "mat",
      name: "Mat",
      defaultSrc: "/assets/images/seat.jpg",
    },
    {
      id: "seat",
      name: "Seat",
      defaultSrc: "/assets/images/seat.jpg",
    },
    {
      id: "back bonnet",
      name: "Back Bonnet",
      defaultSrc: "/assets/images/back-bonnet.jpg",
    },
    {
      id: "windshield",
      name: "Windshield",
      defaultSrc: "/assets/images/wind-shield.jpg",
    },
    {
      id: "dashboard",
      name: "Dashboard",
      defaultSrc: "/assets/images/dashboardView.png",
    },
  ];

  // add a add icon to add miscellaneous items
  const [miscellaneousItems, setMiscellaneousItems] = useState([{ id: Date.now(), name: "", images: [] }]);

  const addMiscellaneousItem = () => {
    setopeninspection(true);
    setMiscellaneousItems([...miscellaneousItems, { id: Date.now(), name: "", images: [] }]);
  };


  useEffect(() => {
    // console.log({ imageBase64 });
    setmainpageimage(imageBase64);
  }, [imageBase64]);

  // Local state to manage attachments
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    // Initialize attachments from visualInspectionData if available
    if (visualInspectionData) {
      try {
        const parsedData = JSON.parse(visualInspectionData);
        setAttachments(Object.entries(parsedData).map(([key, value]) => ({
          name: value.split('\\').pop().replace('.png', '').replace(/-/g, ' '),
          // show valies after 5th 
          image: value,
        })));
      } catch (error) {
        console.error('Error parsing visualInspectionData:', error);
      }
    }
  }, [visualInspectionData]);

  const handleSubmit = async () => {
    // ... existing code ...
    try {
      const names = miscellaneousItems.map(item => item.name);
      const namesWithoutBrackets = names.map(name => name.replace('[', '').replace(']', ''));
      const images = miscellaneousItems.flatMap(item => item.images);
const companyCode = Cookies.get("companyCode");
      let response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/visual_inspection_attachments`, {
        name: namesWithoutBrackets,
        company_code:companyCode,
        images,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Update local attachments state
      setAttachments(prevAttachments => [
        ...prevAttachments,
        ...images.map((image, index) => ({
          name: namesWithoutBrackets[index],
          image,
        })),
      ]);
      // if  the atachment is successfully addded then load the page again
      if (response.status === 200) {
        window.location.reload();
      }
      setopeninspection(false);
    } catch (error) {
      console.error('Error sending data to backend:', error);
    }
  };

  return (
    <div>

      {console.log(selectedRow)}
      {openConformationDialogue && (
        <ConformationDialogue
          openConformationModal={openConformationDialogue}
          setOpenConformationModal={setOpenConformationDialogue}
          details={{ action: "delete", name: "attachment" }}
          selectedRow={selectedRow}
          deleteurl={`${process.env.NEXT_PUBLIC_API_URL}/appointment/delete_item/${appointmentId}/visual_inspection_in/${selectedRow}`}
          deleteMethod="DELETE"
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
      {/* showing the modal when the add icon is clicked */}
      <Modal open={openinspection} onClose={() => setopeninspection(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '90%' : 600,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          <Typography variant="h6" component="h2" mb={2}>
            Add More Attachments
          </Typography>
          <Box sx={{ mb: 2 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Image Previews</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {miscellaneousItems.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>
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
                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
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
                            capture="camera"
                            hidden
                            multiple
                            onChange={(e) => handleImageChange(e, index)}
                          />
                        </Button>
                      )}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
                        {item.images && item.images.map((img, imgIndex) => (
                          <img
                            key={imgIndex}
                            src={img}
                            alt={`Preview ${imgIndex}`}
                            style={{ maxWidth: '100px', maxHeight: '100px', margin: '5px' }}
                          />
                        ))}
                      </Box>
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                      <IconButton
                        variant="contained"
                        color="error"
                        onClick={() => handleClearrow(index)}
                      >
                        <DeleteIcon />
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
            sx={{ width: "100px", alignContent: "center", marginLeft: "auto", marginRight: "auto" }}
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
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* <h2>Exterior Visual Inspection</h2> */}
          <IconButton
            style={{ marginLeft: "auto" }}
            size="large"
            color="primary"
            aria-label="add"
            type="outlined"
            onClick={() => setopeninspection(true)}
          >
            <AttachFile />
            <Typography>Add Attachments </Typography>
          </IconButton>
        </div>
      </Box>

      <Box
        sx={{
          backgroundColor: "white",
          justifyContent: "center",
          alignItems: "center",
          margin: "0px",
          paddingRight: "26px",
          padding: "10px",
          borderRadius: "10px",
        }}
      >
        {/* <h2>Appointment Data Log</h2> */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Image Preview</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* removing the Front View	,Right View	,Back View	,Left View from the attachments */}
            {attachments.length > 0 ? (
              attachments.map((item, index) => {

                const nameSegments = item.name.split('/');
                const name = nameSegments[nameSegments.length - 1];
                if (name.includes('Front View') || name.includes('Right View') || name.includes('Back View') || name.includes('Left View')) {
                  return null;
                }
                // filter the item.name to remove the Front View	,Right View	,Back View	,Left View
                const normalizedPath = item.image.replace(/\\/g, '/');
                const pathSegments = normalizedPath.split('/');
                const imageName = pathSegments[pathSegments.length - 1];
                const imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/appointment/visual_inspection_attachments/image/${appointmentId}/${imageName}`;
                // do the same for the name
                // const nameSegments = item.name.split('/');
                // const name = nameSegments[nameSegments.length - 1];
                return (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ccc', padding: '8px' }}>{name}</td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                      <div style={{ width: '100px', height: '100px', overflow: 'hidden', display: 'inline-block' }}>
                        <LightboxComponent
                          imageUrl={imageUrl}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </td>

                    <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                      <IconButton
                        variant="contained"
                        color="error"
                        onClick={() => { setOpenConformationDialogue(true); setSelectedRow(item.name) }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="2" style={{ textAlign: 'center', padding: '8px' }}>
                  No Attachments Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Box>

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {/* showing the table with the already added attachments */}
      {appointmentDataLog?.attachments && appointmentDataLog?.attachments?.length > 0 && (
        <TableContainer className="table-container">
          <Table>
            <TableBody>
              {attachments.map((attachment, index) => (
                <TableRow key={index}>
                  <TableCell>{attachment.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        // if no attachments are added
      )}
      {!appointmentDataLog?.attachments || appointmentDataLog?.attachments?.length === 0 && (
        <div>No Attachments Added</div>
      )}

    </div>

  );
}
