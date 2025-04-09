import React, { useState, ChangeEvent, FormEvent } from 'react';

interface UploadResponse {
  success: boolean;
  filename: string;
  original_filename: string;
  file_path: string;
  analysis: string;
}

interface UploadStatus {
  success: boolean;
  message: string;
  data?: UploadResponse[];
}

export function ImageUploadComponent(): JSX.Element {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const urls = fileArray.map(file => URL.createObjectURL(file));

      setSelectedImages(fileArray);
      setPreviewUrls(urls);
      setUploadStatus(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (selectedImages.length === 0) {
      setUploadStatus({
        success: false,
        message: 'Please select one or more images first'
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();

    selectedImages.forEach(image => {
      formData.append('image', image);
    });

    try {
      const response = await fetch('https://groq-livekit-backend-417990686885.us-west1.run.app:5001/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json() as UploadResponse[]; // now expecting array
      setUploadStatus({
        success: true,
        message: 'Images uploaded successfully!',
        data
      });
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus({
        success: false,
        message: `Upload failed: ${(error as Error).message}`
      });
    } finally {
      setUploading(false);
    }
  };

  const clearImages = (): void => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setPreviewUrls([]);
    setUploadStatus(null);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
            </div>
            <input 
              type="file" 
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
          </label>
        </div>

        {previewUrls.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative">
                <img src={url} alt={`Preview ${idx}`} className="max-h-40 rounded shadow" />
              </div>
            ))}
            <button 
              type="button"
              onClick={clearImages}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={uploading || selectedImages.length === 0}
            className={`px-4 py-2 rounded-lg ${
              uploading || selectedImages.length === 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload Images'}
          </button>
        </div>

        {uploadStatus && (
          <div className={`mt-4 p-3 rounded ${uploadStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {uploadStatus.message}
            {uploadStatus.success && uploadStatus.data?.map((img, idx) => (
              <div key={idx} className="mt-2">
                <strong>{img.original_filename}</strong>: {img.analysis}
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
