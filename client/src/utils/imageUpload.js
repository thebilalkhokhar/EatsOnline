export const handleImageUpload = async (file, endpoint) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const getImageUrl = (image) => {
  if (!image) return '/default-image.jpg';
  return typeof image === 'string' ? image : image.url;
}; 