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

  // no manual Content-Type: the browser sets multipart/form-data with the boundary
  const response = await apiClient.post('/upload', formData);

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
    withCredentials: true,
  });
  return { url: data.url, public_id: data.public_id };
};

/** Upload PDF to S3 via /api/upload/pdf */
export const uploadPDF = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  // x-service-secret now injected by the api-gateway; sending it from the
  // browser leaked the secret and forced a preflight the gateway didn't answer
  const { data } = await apiClient.post('/s3/upload', formData, {
    withCredentials: true,
  });
  return { url: data.url, key: data.key };
};
