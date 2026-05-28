"use client";
// React and Next imports
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Function imports
import { handleImageUpload } from "../../../../controllers/galleryControllers"; // Keep only necessary imports

// Component imports
import BackButton from "@/components/backButton";
import Navbar from "@/components/navbar";
import DeleteIcon from "@mui/icons-material/Delete";
// UI package imports
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/system";

const UploadBox = styled(Box)(/* styles */);

// Styled component for category image
const CategoryImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: '8px', // Optional: for rounded corners
});

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

// Styled component for category name
const CategoryName = styled(Typography)({
  marginTop: '8px',
  fontWeight: 'bold',
  textAlign: 'center',
  color: '#333',
});

export default function Gallery() {
  const router = useRouter();

  // State for categories and modal
  const [openModal, setOpenModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [categoryName, setCategoryName] = useState("");

  // Fetch categories from the backend
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category`);
      const data = await response.json();
      setCategories(data);
    };
    fetchCategories();
  }, []);

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
      {/* <Navbar pageName="Gallery Categories" /> */}
      {/* <Button variant="contained" sx={{ position: 'absolute', top: 100, right: 10 }} onClick={() => setOpenModal(true)}>
        ADD Category
      </Button> */}
      <Container>
        <Box display="flex" flexWrap="wrap" justifyContent="space-between">
          {categories
            .filter(category => category.name && category.image) // Filter out blank categories
            .map((category) => (
              <StyledCard 
                key={category.id} 
                onClick={() => router.push(`/views/view-gallery/${category.id}`)}
              >
                <CategoryImage src={`${process.env.NEXT_PUBLIC_API_URL}/category/image/file/${category.image}`} alt={category.name} />
                <CategoryName>{category.name}</CategoryName>
                <Button 
                  // variant="outlined" 
                  color="error" 
                  onClick={async (e) => {
                    e.stopPropagation(); // Prevent card click
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category/${category.id}`, {
                      method: "DELETE",
                    });
                    if (response.ok) {
                      // Optionally refresh categories or update state to remove the deleted category
                      setCategories(categories.filter(cat => cat.id !== category.id));
                    }
                  }}
                >
                  {/* <DeleteIcon /> */}
                </Button>
              </StyledCard>
            ))}
        </Box>
      </Container>
      <Dialog open={openModal} onClose={() => setOpenModal(false)} sx={{ width:'100%', borderRadius: '10px', overflow: 'hidden' }}>
        <DialogTitle sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', textAlign: 'center' }}>Add Category</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
          <TextField
            fullWidth
            label="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            variant="outlined"
            sx={{ marginBottom: '20px', borderRadius: '5px' }}
          />
          <UploadBox sx={{ border: '2px dashed #ccc', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, setSelectedImage)}
              style={{ display: "none" }}
              id="category-image-upload"
            />
            <label htmlFor="category-image-upload">
              {selectedImage ? (
                <img src={selectedImage} alt="Preview" style={{ maxWidth: "100%", borderRadius: '10px' }} />
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: '40px', color: '#007bff' }} />
                  <Typography variant="body1" sx={{ color: '#555' }}>Upload Category Image</Typography>
                </>
              )}
            </label>
          </UploadBox>
          <Button
            variant="contained"
            onClick={async () => {
              // Validation for blank fields and no image
              if (!categoryName.trim() || !document.getElementById("category-image-upload").files.length) {
                alert("Please fill in the category name and upload an image.");
                return; // Exit if validation fails
              }

              const formData = new FormData();
              const file = document.getElementById("category-image-upload").files[0];
              formData.append("image", file);
              formData.append("name", categoryName);

              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category`, {
                method: "POST",
                body: formData,
              });

              if (response.ok) {
                setOpenModal(false);
                setCategoryName("");
                setSelectedImage(null);
                // Optionally refresh categories
                window.location.reload();
              }
            }}
            sx={{ marginTop: '20px', backgroundColor: '#007bff', '&:hover': { backgroundColor: '#0056b3' } }}
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
