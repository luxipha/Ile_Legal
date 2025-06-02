import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { Upload, X, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const kycSchema = z.object({
  idType: z.enum(['national_id', 'passport', 'drivers_license']),
  idNumber: z.string().min(5, 'ID number is required'),
  address: z.string().min(10, 'Full address is required'),
  documents: z.array(z.any()).min(1, 'At least one document is required'),
});

type KYCFormData = z.infer<typeof kycSchema>;

const KYCVerificationForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
  });

  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState<{ [key: string]: number }>({});

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    setValue('documents', acceptedFiles);
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 5000000, // 5MB
  });

  const uploadToStorage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `kyc-documents/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      return data.path;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const onSubmit = async (data: KYCFormData) => {
    try {
      // Upload all documents
      const uploadPromises = uploadedFiles.map(file => uploadToStorage(file));
      const documentUrls = await Promise.all(uploadPromises);

      // Submit KYC data with document URLs
      const kycData = {
        ...data,
        documentUrls,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      // Save KYC data to your backend
      const response = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kycData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit KYC data');
      }

      // Handle success
      alert('KYC verification submitted successfully');
    } catch (error) {
      console.error('Error submitting KYC:', error);
      alert('Failed to submit KYC verification');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            ID Type
          </label>
          <select
            {...register('idType')}
            className="mt-1 input"
          >
            <option value="national_id">National ID</option>
            <option value="passport">Passport</option>
            <option value="drivers_license">Driver's License</option>
          </select>
          {errors.idType && (
            <p className="mt-1 text-sm text-error-500">{errors.idType.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            ID Number
          </label>
          <input
            type="text"
            {...register('idNumber')}
            className="mt-1 input"
          />
          {errors.idNumber && (
            <p className="mt-1 text-sm text-error-500">{errors.idNumber.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            {...register('address')}
            rows={3}
            className="mt-1 input"
          />
          {errors.address && (
            <p className="mt-1 text-sm text-error-500">{errors.address.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Upload Documents
          </label>
          <div
            {...getRootProps()}
            className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag & drop files here, or click to select files
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PDF, JPG, or PNG up to 5MB
            </p>
          </div>
          {errors.documents && (
            <p className="mt-1 text-sm text-error-500">{errors.documents.message}</p>
          )}
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
            <ul className="mt-2 divide-y divide-gray-200">
              {uploadedFiles.map((file, index) => (
                <li key={index} className="py-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                    <span className="text-sm text-gray-900">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFiles(files => files.filter((_, i) => i !== index));
                    }}
                    className="text-gray-400 hover:text-error-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
          >
            Submit Verification
          </button>
        </div>
      </form>
    </div>
  );
};

export default KYCVerificationForm;