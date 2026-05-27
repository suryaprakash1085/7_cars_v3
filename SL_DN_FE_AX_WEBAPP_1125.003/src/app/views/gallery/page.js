"use client";
// React and Next imports
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

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

const StyledContainer = styled(Container)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  '@media (max-width: 600px)': {
    padding: '10px',
  },
});

const SearchContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  marginBottom: '16px',
  '@media (min-width: 600px)': {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const StyledSearchField = styled(TextField)({
  width: '100%',
  maxWidth: '200px',
  backgroundColor: 'white',
  borderRadius: '4px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  marginTop: '8px',
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#ccc',
    },
    '&:hover fieldset': {
      borderColor: '#007bff',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#007bff',
    },
  },
});

const AddCategoryButton = styled(Button)({
  padding: '8px 16px',
  fontSize: '0.875rem',
  backgroundColor: '#007bff',
  color: 'white',
  '&:hover': {
    backgroundColor: '#0056b3',
  },
});

export default function Gallery() {
  const router = useRouter();

  // State for categories and modal
  const [openModal, setOpenModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [token, setToken] = useState(null); 
  // Fetch categories from the backend
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const token = Cookies.get("token"); // Retrieve token first
      setToken(token); // Set token state

      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const searchCategories = async (searchTerm) => {
    if (searchTerm.length === 0) {
      fetchCategories();
      return;
    }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category/search/${searchTerm}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    setCategories(data);
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
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
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

    const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
    {/* <Navbar pageName="Gallery Categories" /> */}
     {pageType !== "tab" && <Navbar pageName="Gallery Categories" />}
    
    <StyledContainer>
      
      <SearchContainer>
        <AddCategoryButton onClick={() => setOpenModal(true)}>
          ADD Category
        </AddCategoryButton>
        <StyledSearchField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              searchCategories(searchTerm);
            }
          }}
        />
      </SearchContainer>
      <Box display="flex" flexWrap="wrap" justifyContent="center">
        {categories
          .filter(category => category.name && category.image)
          .map((category) => (
            <StyledCard 
              key={category.id} 
              onClick={() => router.push(`/views/gallery/${category.id}`)}
            >
              <CategoryImage src={`${process.env.NEXT_PUBLIC_API_URL}/category/image/file/${category.image}`} alt={category.name} />
              <CategoryName>{category.name}</CategoryName>
              <Button 
                color="error" 
                onClick={async (e) => {
                  e.stopPropagation();
                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category/${category.id}`, {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  });
                  if (response.ok) {
                    setCategories(categories.filter(cat => cat.id !== category.id));
                  }
                }}
              >
                <DeleteIcon />
              </Button>
            </StyledCard>
          ))}
      </Box>
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
                headers: {
                  Authorization: `Bearer ${token}`,
                  // "Content-Type": "application/json",
                },
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
    </StyledContainer>
    </div>
  );
}
