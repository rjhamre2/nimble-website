import { useState, useCallback } from 'react';

export function useTemplates(userId) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all templates
  const fetchTemplates = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${userId}/templates`);
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Upload media to S3 and Meta
  const uploadMedia = async (file) => {
    if (!file || !userId) return null;
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/users/${userId}/templates/upload_media`, {
        method: 'POST',
        body: formData, // Browser sets multipart headers automatically
      });
      const result = await response.json();
      
      if (result.success) {
        return result.data; // Returns { media_id, s3_url, uploaded_file_handle }
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload media');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Submit the final template
  const submitTemplate = async (templateObject, mediaId) => {
    if (!userId) return false;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}/templates/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object: templateObject, media_id: mediaId }),
      });
      const result = await response.json();

      if (result.success) {
        await fetchTemplates(); // Refresh the list automatically
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit template');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    templates,
    isLoading,
    isUploading,
    isSubmitting,
    error,
    fetchTemplates,
    uploadMedia,
    submitTemplate
  };
}