import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';

// Form validation schema
const gigSchema = z.object({
  title: z.string().min(10, { message: "Title must be at least 10 characters" }),
  description: z.string().min(50, { message: "Description must be at least 50 characters" }),
  categories: z.array(z.string()).min(1, { message: "Please select at least one category" }),
  budget: z.string().min(1, { message: "Budget is required" }),
  deadline: z.string().min(1, { message: "Deadline is required" }),
  attachments: z.any().optional(),
});

type GigFormData = z.infer<typeof gigSchema>;

const CATEGORIES = [
  { value: 'land-title', label: 'Land Title Verification' },
  { value: 'deed-assignment', label: 'Reg Deed of Assignment' },
  { value: 'c-of-o', label: 'Certificate of Occupancy (C of O)' },
  { value: 'reg-conveyance', label: 'Reg Conveyance' },
  { value: 'land-certificate', label: 'Land Certificate' },
  { value: 'deed-partitioning', label: 'Deed of Partitioning' },
  { value: 'governors-consent', label: "Governor's Consent" },
  { value: 'contract-sales', label: 'Contract of Sales' },
  { value: 'contract', label: 'Contract' },
  { value: 'letter-admin', label: 'Letter of Administration' },
  { value: 'mortgage-doc', label: 'Mortgage Documentation' },
  { value: 'land-survey', label: 'Land Survey' },
];

const PostGigPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<GigFormData>({
    resolver: zodResolver(gigSchema),
    defaultValues: {
      categories: [],
    }
  });

  const onSubmit = async (data: GigFormData) => {
    try {
      // In a real application, this would call an API to create the gig
      console.log(data);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to dashboard after successful creation
      navigate('/buyer/dashboard');
    } catch (error) {
      console.error('Error creating gig:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-primary-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800 font-serif">Post a New Gig</h1>
        <p className="text-gray-500 mt-1">
          Describe your legal needs and get bids from qualified professionals
        </p>
      </div>

      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Gig Title
              </label>
              <div className="mt-1">
                <input
                  id="title"
                  type="text"
                  className={`input ${errors.title ? 'border-error-500' : ''}`}
                  placeholder="E.g., Land Title Verification for Victoria Island Property"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-error-500">{errors.title.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((category) => (
                  <label
                    key={category.value}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      value={category.value}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                      {...register('categories')}
                    />
                    <span className="ml-3 text-sm text-gray-700">{category.label}</span>
                  </label>
                ))}
              </div>
              {errors.categories && (
                <p className="mt-1 text-sm text-error-500">{errors.categories.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  rows={5}
                  className={`input ${errors.description ? 'border-error-500' : ''}`}
                  placeholder="Describe the legal service you need in detail. Include specific requirements, documents available, and expected outcomes."
                  {...register('description')}
                ></textarea>
                {errors.description && (
                  <p className="mt-1 text-sm text-error-500">{errors.description.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                  Budget (₦)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    id="budget"
                    className={`input ${errors.budget ? 'border-error-500' : ''}`}
                    placeholder="50,000"
                    {...register('budget')}
                  />
                </div>
                {errors.budget && (
                  <p className="mt-1 text-sm text-error-500">{errors.budget.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                  Deadline
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="date"
                    id="deadline"
                    className={`input pl-10 ${errors.deadline ? 'border-error-500' : ''}`}
                    {...register('deadline')}
                  />
                </div>
                {errors.deadline && (
                  <p className="mt-1 text-sm text-error-500">{errors.deadline.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="attachments" className="block text-sm font-medium text-gray-700">
                Attachments (Optional)
              </label>
              <div className="mt-1">
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-500 hover:text-primary-600"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          {...register('attachments')}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, JPG, PNG up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                      <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </span>
                ) : (
                  'Post Gig'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostGigPage;