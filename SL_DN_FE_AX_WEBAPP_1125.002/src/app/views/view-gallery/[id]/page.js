"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardMedia,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import DeleteIcon from "@mui/icons-material/Delete";
import Navbar from "@/components/navbar";
import { styled } from "@mui/system";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

// Styled component for the card
const StyledCard = styled(Card)({
  width: '200px',
  margin: '10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
  },
});

// Styled component for category image
const CategoryImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '8px', // Optional: for rounded corners
});

// Styled component for the upload box
const UploadBox = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  border: '2px dashed #ccc',
  borderRadius: '10px',
  textAlign: 'center',
  cursor: 'pointer',
  flex: '1',
});

export default function SubcategoryPage() {
  const router = useRouter();
  const { id } = useParams();
  const [openModal, setOpenModal] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [newSubcategories, setNewSubcategories] = useState([{ name: "", image: null }]); // State for new subcategories

  useEffect(() => {
    const fetchSubcategories = async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subcategory/${id}`);
      const data = await response.json();
      const parsedData = data.map(subcategory => ({
        ...subcategory,
        images: JSON.parse(subcategory.images)
      }));
      setSubcategories(parsedData);
    };
    if (id) fetchSubcategories();
  }, [id]);

  const handleAddRow = () => {
    setNewSubcategories([...newSubcategories, { name: "", image: null }]); // Add a new row
  };

  const handleChange = (index, field, value) => {
    const updatedSubcategories = [...newSubcategories];
    updatedSubcategories[index][field] = value;
    setNewSubcategories(updatedSubcategories);
  };

  const handleImageChange = (index, event) => {
    handleChange(index, "image", event.target.files[0]); // Store the selected image
  };

  const handleSubmit = async () => {
    // Validation for blank fields and no image
    const hasEmptyFields = newSubcategories.some(subcat => !subcat.name.trim() || !subcat.image);
    if (hasEmptyFields) {
      alert("Please fill in all subcategory names and upload images for each.");
      return; // Exit if validation fails
    }

    const formData = new FormData();
    
    newSubcategories.forEach((subcat) => {
      if (subcat.image) {
        formData.append("images", subcat.image); // Append each image
        formData.append("name", subcat.name); // Append the unique name for each subcategory
      }
    });

    formData.append("categoryName", id); // Use the category ID outside the loop

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subcategory`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setOpenModal(false);
      setNewSubcategories([{ name: "", image: null }]); // Reset the form
      // fetchSubcategories(); // Refresh the subcategories
      window.location.reload();
    } else {
      console.error("Failed to add subcategory");
    }
  };

  return (
    <div>
      <Navbar pageName="Gallery Subcategories" />
      {/* <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <Button variant="contained" onClick={() => setOpenModal(true)}>
          ADD Subcategory
        </Button>
      </div> */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} sx={{ borderRadius: '10px', overflow: 'hidden' }}>
        <DialogTitle sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', textAlign: 'center' }}>Add Subcategory</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
          {newSubcategories.map((subcat, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "10px", width: '100%' }}>
              <TextField
                fullWidth
                label="Subcategory Name"
                value={subcat.name}
                onChange={(e) => handleChange(index, "name", e.target.value)}
                variant="outlined"
                sx={{ marginRight: "10px", borderRadius: '5px' }}
              />
              <UploadBox sx={{ border: '2px dashed #ccc', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', flex: '1' }}>
                <input
                  type="file"
                  onChange={(e) => handleImageChange(index, e)}
                  style={{ display: "none" }}
                  id={`subcategory-image-upload-${index}`}
                />
                <label htmlFor={`subcategory-image-upload-${index}`}>
                  {subcat.image ? (
                    <img src={URL.createObjectURL(subcat.image)} alt="Preview" style={{ Width: "50px", height: '50px', borderRadius: '10px' }} />
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ fontSize: '40px', color: '#007bff' }} />
                      <Typography variant="body1" sx={{ color: '#555' }}>Upload Image</Typography>
                    </>
                  )}
                </label>
              </UploadBox>
            </div>
          ))}
          <Button variant="outlined" onClick={handleAddRow} sx={{ marginTop: '10px' }}>Add Another Subcategory</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ marginTop: '20px', backgroundColor: '#007bff', '&:hover': { backgroundColor: '#0056b3' } }}
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>
      {/* Display existing subcategories */}
      <Box display="flex" flexWrap="wrap" justifyContent="center">
        {subcategories.map((subcategory) => (
          <StyledCard key={subcategory.id} onClick={() => router.push(`/views/view-gallery/${id}/${subcategory.id}`)}>
            <CardMedia
              component="img"
              height="200"
              image={`${process.env.NEXT_PUBLIC_API_URL}/subcategory/image/${subcategory.images[0]}`} // Display the first image
              alt={subcategory.name}
            />
            <Typography variant="h6" sx={{ p: 1, textAlign: 'center' }}>
              {subcategory.name}
            </Typography>
            <Button 
              // variant="outlined" 
              color="error" 
              onClick={async (e) => {
                e.stopPropagation(); // Prevent card click
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subcategory/delete/${subcategory.id}`, {
                  method: "DELETE",
                });
                if (response.ok) {
                  // Optionally refresh subcategories or update state to remove the deleted subcategory
                  setSubcategories(subcategories.filter(item => item.id !== subcategory.id));
                } else {
                  console.error("Failed to delete subcategory");
                }
              }}
              sx={{ margin: '10px' }}
            >
              {/* <DeleteIcon /> */}
            </Button>
          </StyledCard>
        ))}
      </Box>
    </div>
  );
}