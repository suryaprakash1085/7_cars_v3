// "use client";
// import React, { useRef, useState, useEffect } from "react";
// import { Box, useMediaQuery } from "@mui/material";

// export default function VisualInspectionPhotos() {
//   const fileInputRef = useRef(null);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [imagePreviews, setImagePreviews] = useState({});
//   const [imageSizes, setImageSizes] = useState({});
//   const [imageBase64, setImageBase64] = useState({}); // Stores base64 values
//   const isMobile = useMediaQuery("(max-width: 768px)");

//   const handleImageClick = (imageId) => {
//     setSelectedImage(imageId);
//     fileInputRef.current?.click();
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file && selectedImage) {
//       const objectURL = URL.createObjectURL(file);
//       convertToBase64(file, selectedImage, objectURL);
//     }
//   };

//   const convertToBase64 = (file, imageId, objectURL) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onloadend = () => {
//       const base64String = reader.result;
//       const img = new Image();
//       img.src = base64String;
//       img.onload = () => {
//         setImageSizes((prev) => ({
//           ...prev,
//           [imageId]: { width: img.width, height: img.height },
//         }));
//       };

//       setImagePreviews((prev) => ({
//         ...prev,
//         [imageId]: objectURL,
//       }));

//       setImageBase64((prev) => ({
//         ...prev,
//         [imageId]: base64String,
//       }));
//     };
//   };

//   // Define views with named slots
//   const views = [
//     {
//       id: "front",
//       slots: [{ name: "Front View (In)" }, { name: "Front View (Out)" }],
//       defaultSrc: "/assets/images/frontView.png",
//     },
//     {
//       id: "right",
//       slots: [{ name: "Right View (In)" }, { name: "Right View (Out)" }],
//       defaultSrc: "/assets/images/rightView.png",
//     },
//     {
//       id: "back",
//       slots: [{ name: "Back View (In)" }, { name: "Back View (Out)" }],
//       defaultSrc: "/assets/images/backView.png",
//     },
//     {
//       id: "left",
//       slots: [{ name: "Left View (In)" }, { name: "Left View (Out)" }],
//       defaultSrc: "/assets/images/leftView.png",
//     },
//     {
//       id: "dashboard",
//       slots: [
//         { name: "Dashboard View (Left)" },
//         { name: "Dashboard View (Right)" },
//       ],
//       defaultSrc: "/assets/images/dashboardView.png",
//     },
//   ];

//   useEffect(() => {
//     console.log({ imageBase64 });
//   }, [imageBase64]);

//   return (
//     <div>
//       <Box
//         sx={{
//           backgroundColor: "white",
//           justifyContent: "center",
//           alignItems: "center",
//           margin: "20px",
//           padding: "10px",
//           borderRadius: "10px",
//         }}
//       >
//         <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
//           {views.map((view) => (
//             <Box
//               key={view.id}
//               sx={{
//                 display: "flex",
//                 flexDirection: isMobile ? "column" : "row",
//                 justifyContent: "center",
//                 gap: 4,
//               }}
//             >
//               {view.slots.map((slot) => {
//                 const imageId = `${slot.name}`;
//                 return (
//                   <Box
//                     key={imageId}
//                     onClick={() => handleImageClick(imageId)}
//                     sx={{
//                       cursor: "pointer",
//                       textAlign: "center",
//                       width: isMobile ? "100%" : "auto",
//                     }}
//                   >
//                     <h3>{slot.name}</h3>
//                     <img
//                       src={imagePreviews[imageId] || view.defaultSrc}
//                       alt={slot.name}
//                       width={imageSizes[imageId]?.width || 300}
//                       height={imageSizes[imageId]?.height || 150}
//                       style={{
//                         maxWidth: "100%",
//                         height: "auto",
//                         borderRadius: "10px",
//                       }}
//                     />
//                   </Box>
//                 );
//               })}
//             </Box>
//           ))}
//         </Box>
//       </Box>

//       {/* Hidden File Input */}
//       <input
//         type="file"
//         accept="image/*"
//         capture="environment"
//         ref={fileInputRef}
//         style={{ display: "none" }}
//         onChange={handleFileChange}
//       />
//     </div>
//   );
// }

"use client";
import React, { useRef, useState, useEffect } from "react";
import { Box, useMediaQuery } from "@mui/material";

export default function VisualInspectionPhotos() {
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviews, setImagePreviews] = useState({});
  const [imageSizes, setImageSizes] = useState({});
  const [imageBase64, setImageBase64] = useState({});
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleImageClick = (imageId) => {
    setSelectedImage(imageId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && selectedImage) {
      const objectURL = URL.createObjectURL(file);
      convertToBase64(file, selectedImage, objectURL);
    }
  };

  const convertToBase64 = (file, imageId, objectURL) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64String = reader.result;
      const img = new Image();
      img.src = base64String;
      img.onload = () => {
        setImageSizes((prev) => ({
          ...prev,
          [imageId]: { width: img.width, height: img.height },
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
      name: "Front View (In)",
      defaultSrc: "/assets/images/frontView.png",
    },
    {
      id: "right",
      name: "Right View (In)",
      defaultSrc: "/assets/images/rightView.png",
    },
    {
      id: "back",
      name: "Back View (In)",
      defaultSrc: "/assets/images/backView.png",
    },
    {
      id: "left",
      name: "Left View (In)",
      defaultSrc: "/assets/images/leftView.png",
    },
    {
      id: "dashboard",
      name: "Dashboard View",
      defaultSrc: "/assets/images/dashboardView.png",
    },
  ];

  const outView = [
    {
      id: "front",
      name: "Front View (Out)",
      defaultSrc: "/assets/images/frontView.png",
    },
    {
      id: "right",
      name: "Right View (Out)",
      defaultSrc: "/assets/images/rightView.png",
    },
    {
      id: "back",
      name: "Back View (Out)",
      defaultSrc: "/assets/images/backView.png",
    },
    {
      id: "left",
      name: "Left View (Out)",
      defaultSrc: "/assets/images/leftView.png",
    },
    {
      id: "dashboard",
      name: "Dashboard View",
      defaultSrc: "/assets/images/dashboardView.png",
    },
  ];

  useEffect(() => {
    console.log({ imageBase64 });
  }, [imageBase64]);

  return (
    <div>
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
        <h2>Exterior Visual Inspection</h2>

        {/* IN VIEW SECTION */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h3>Vehicle In</h3>
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              // flexDirection: "column",
              justifyContent: "center",
              gap: 4,
            }}
          >
            {inView.map((view) => (
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
            ))}
          </Box>
        </Box>

        {/* OUT VIEW SECTION */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            marginTop: "20px",
          }}
        >
          <h3>Vehicle Out</h3>
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              // flexDirection: "column",
              justifyContent: "center",
              gap: 4,
            }}
          >
            {outView.map((view) => (
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
            ))}
          </Box>
        </Box>
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
    </div>
  );
}
