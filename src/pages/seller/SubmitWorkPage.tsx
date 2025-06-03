import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Upload, FileText, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useMockDataStore } from '../../store/mockData';

const submitWorkSchema = z.object({
  description: z.string()
    .min(50, { message: "Description must be at least 50 characters" })
    .max(1000, { message: "Description cannot exceed 1000 characters" }),
  files: z.array(z.any()).optional(),
});

type SubmitWorkFormData = z.infer<typeof submitWorkSchema>;

const SubmitWorkPage: React.FC = () => {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const { getGigById, updateGig } = useMockDataStore();
  const gig = getGigById(gigId || '');
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<SubmitWorkFormData>({
    resolver: zodResolver(submitWorkSchema),
  });

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    setValue('files', acceptedFiles);
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10000000, // 10MB
  });

  if (!gig) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-card rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800">Gig Not Found</h2>
          <p className="mt-2 text-gray-600">The gig you're trying to submit work for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="mt-6 btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: SubmitWorkFormData) => {
    try {
      // Update gig status and add deliverables
      updateGig(gig.id, {
        status: 'completed',
        deliverables: {
          description: data.description,
          files: uploadedFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
          })),
          submittedAt: new Date().toISOString(),
        },
      });

      // Navigate to dashboard
      navigate('/seller/dashboard');
    } catch (error) {
      console.error('Error submitting work:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <Link
          to="/seller/dashboard"
          className="flex items-center text-primary-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Submit Work</h1>
      </div>

      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        {/* Gig Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">{gig.title}</h2>
          <p className="mt-2 text-sm text-gray-500">Client: {gig.client.name}</p>
        </div>

        {/* Submit Work Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description of Work
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                rows={5}
                className={`input ${errors.description ? 'border-error-500' : ''}`}
                placeholder="Describe the work you've completed and any important notes for the client..."
                {...register('description')}
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-error-500">{errors.description.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Files
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'}`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag & drop files here, or click to select files
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PDF, DOC, DOCX, JPG, or PNG up to 10MB
              </p>
            </div>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
              <ul className="mt-2 divide-y divide-gray-200">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="py-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
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

          <div className="flex justify-end space-x-3">
            <Link
              to="/seller/dashboard"
              className="btn-ghost flex items-center justify-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </span>
              ) : (
                'Submit Work'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitWorkPage;