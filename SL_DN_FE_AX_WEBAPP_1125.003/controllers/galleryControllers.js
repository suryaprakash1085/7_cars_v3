// import { galleryData } from "./[id]/data";

export const getCategoriesFromGalleryData = () => {
  return Object.entries(galleryData).map(([id, data]) => {
    const displayName = id
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const firstSubcategory = Object.values(data)[0];
    const imageurl = firstSubcategory[0]?.url || '';

    return {
      id,
      name: displayName,
      imageurl
    };
  });
};

export const handleImageUpload = (event, setSelectedImage) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  }
};

export const handleDrop = (event, setSelectedImage) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  }
};

export const handleDragOver = (event) => {
  event.preventDefault();
};
