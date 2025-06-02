import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Clock, DollarSign } from 'lucide-react';
import { useMockDataStore } from '../../store/mockData';

const bidSchema = z.object({
  amount: z.string()
    .min(1, { message: "Bid amount is required" })
    .refine((val) => !isNaN(Number(val)), { message: "Must be a valid number" }),
  deliveryTime: z.string()
    .min(1, { message: "Delivery time is required" }),
  proposal: z.string()
    .min(50, { message: "Proposal must be at least 50 characters" })
    .max(1000, { message: "Proposal cannot exceed 1000 characters" }),
});

type BidFormData = z.infer<typeof bidSchema>;

const PlaceBidPage: React.FC = () => {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const { getGigById, addBid } = useMockDataStore();
  const gig = getGigById(gigId || '');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BidFormData>({
    resolver: zodResolver(bidSchema),
  });

  if (!gig) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-card rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800">Gig Not Found</h2>
          <p className="mt-2 text-gray-600">The gig you're trying to bid on doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/seller/find-gigs')}
            className="mt-6 btn-primary"
          >
            Browse Gigs
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: BidFormData) => {
    try {
      // Add bid to mock store
      addBid(gig.id, {
        provider: {
          id: 'seller-1',
          name: 'Demo Seller',
          profession: 'Legal Professional',
          rating: 4.8,
          completedJobs: 15,
        },
        amount: Number(data.amount),
        deliveryTime: data.deliveryTime,
        proposal: data.proposal,
      });

      // Navigate to active bids page
      navigate('/seller/active-bids');
    } catch (error) {
      console.error('Error submitting bid:', error);
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
        <h1 className="text-2xl font-bold text-gray-800">Place a Bid</h1>
      </div>

      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        {/* Gig Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">{gig.title}</h2>
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Budget: ₦{gig.budget.toLocaleString()}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Deadline: {new Date(gig.deadline).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Bid Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Bid Amount (₦)
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="amount"
                className={`input ${errors.amount ? 'border-error-500' : ''}`}
                placeholder="50000"
                {...register('amount')}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-error-500">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700">
              Delivery Time
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="deliveryTime"
                className={`input ${errors.deliveryTime ? 'border-error-500' : ''}`}
                placeholder="e.g., 5 days"
                {...register('deliveryTime')}
              />
              {errors.deliveryTime && (
                <p className="mt-1 text-sm text-error-500">{errors.deliveryTime.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="proposal" className="block text-sm font-medium text-gray-700">
              Proposal
            </label>
            <div className="mt-1">
              <textarea
                id="proposal"
                rows={5}
                className={`input ${errors.proposal ? 'border-error-500' : ''}`}
                placeholder="Describe your experience and approach to completing this task..."
                {...register('proposal')}
              ></textarea>
              {errors.proposal && (
                <p className="mt-1 text-sm text-error-500">{errors.proposal.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
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
                  Submitting...
                </span>
              ) : (
                'Submit Bid'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaceBidPage;