// API service — talks to the same Flask backend as the web app
const API_BASE = 'http://10.208.177.215:5000'; // Your laptop's local IP (auto-detected)

export async function checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function analyzeSkin(
  imageUri: string,
  skinType: string = 'Normal'
): Promise<any> {
  const formData = new FormData();

  // React Native requires this specific format for file uploads
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);
  formData.append('skin_type', skinType);

  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }

  return res.json();
}

export { API_BASE };
