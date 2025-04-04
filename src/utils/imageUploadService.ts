export async function uploadToImgbb(file: File): Promise<string> {
  const API_KEY = "05b947ec40805816cb8f95006fa85760"; // Replace with your actual imgbb API key
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to upload image');
    }
    
    return data.data.url;
  } catch (error) {
    throw new Error(`Failed to upload image to server: ${error}`);
  }
}
