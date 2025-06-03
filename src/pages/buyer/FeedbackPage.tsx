import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMockDataStore } from '../../store/mockData';

const feedbackSchema = z.object({
  rating: z.number().min(1, { message: "Please select a rating" }).max(5),
  comment: z.string()
    .min(10, { message: "Comment must be at least 10 characters" })
    .max(500, { message: "Comment cannot exceed 500 characters" }),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

const FeedbackPage: React.FC = () => {
  const { gigId } = useParams<{ gigId: string }>();
  const navigate = useNavigate();
  const { getGigById, updateGig } = useMockDataStore();
  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredRating, setHoveredRating] = useState(0);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    }
  });

  const currentRating = watch('rating');

  useEffect(() => {
    if (gigId) {
      // Fetch gig data from mock store
      const gigData = getGigById(gigId);
      setGig(gigData);
      setLoading(false);
    }
  }, [gigId, getGigById]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white shadow-card rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white shadow-card rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800">Gig Not Found</h2>
          <p className="mt-2 text-gray-600">The gig you're trying to leave feedback for doesn't exist or has been removed.</p>
          <Link to="/buyer/dashboard" className="mt-6 btn-primary inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      // Update gig with feedback
      updateGig(gig.id, {
        feedback: {
          rating: data.rating,
          comment: data.comment,
          submittedAt: new Date().toISOString(),
        },
      });

      // Navigate back to dashboard
      navigate('/buyer/dashboard');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleRatingClick = (rating: number) => {
    setValue('rating', rating);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <Link
          to="/buyer/dashboard"
          className="flex items-center text-primary-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Leave Feedback</h1>
      </div>

      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        {/* Gig Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">{gig.title}</h2>
          <p className="mt-2 text-sm text-gray-500">Provider: {gig.provider}</p>
          <p className="mt-1 text-sm text-gray-500">Completed: {new Date(gig.completedDate).toLocaleDateString()}</p>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingClick(rating)}
                  onMouseEnter={() => setHoveredRating(rating)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      rating <= (hoveredRating || currentRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <input
                type="hidden"
                {...register('rating')}
              />
            </div>
            {errors.rating && (
              <p className="mt-1 text-sm text-error-500">{errors.rating.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              Your Feedback
            </label>
            <div className="mt-1">
              <textarea
                id="comment"
                rows={5}
                className={`input ${errors.comment ? 'border-error-500' : ''}`}
                placeholder="Share your experience working with this provider..."
                {...register('comment')}
              ></textarea>
              {errors.comment && (
                <p className="mt-1 text-sm text-error-500">{errors.comment.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              to="/buyer/dashboard"
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
                'Submit Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage;
