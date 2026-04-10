import apiClient from "src/http/axios";

export interface UploadResponse {
  url: string;
  public_id?: string;
  key?: string;
}

export const uploadCampaignImage = async (
  image: File,
  folder: string = 'campaigns'
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('folder', folder);

  const response = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data; // { url, public_id }
};

/** Upload image to Cloudinary via /api/upload */
export const uploadImage = async (
  file: File,
  folder: string = 'convocatoria'
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const { data } = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true,
  });
  return { url: data.url, public_id: data.public_id };
};

/** Upload PDF to S3 via /api/upload/pdf */
export const uploadPDF = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post('/upload/pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true,
  });
  return { url: data.url, key: data.key };
};
