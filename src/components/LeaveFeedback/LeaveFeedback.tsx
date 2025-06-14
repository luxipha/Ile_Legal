import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface LeaveFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
  gigId: number;
  gigTitle: string;
  provider: string;
  providerAvatar: string;
  completedDate: string;
  onSubmit: (gigId: number, rating: number, feedback: string) => void;
}

export const LeaveFeedback = ({
  isOpen,
  onClose,
  gigId,
  gigTitle,
  provider,
  providerAvatar,
  completedDate,
  onSubmit
}: LeaveFeedbackProps) => {
  const [rating, setRating] = useState(5); // Default to 5 stars
  const [feedback, setFeedback] = useState("");
  const [charCount, setCharCount] = useState(0);
  const maxChars = 500;

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setFeedback(text);
      setCharCount(text.length);
    }
  };

  const handleSubmit = () => {
    onSubmit(gigId, rating, feedback);
    onClose();
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="p-6 max-w-full">
          <button 
            onClick={onClose} 
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">Leave Feedback</DialogTitle>
            <p className="text-lg mt-2">{gigTitle}</p>
          </DialogHeader>

          <div className="mt-6 flex items-center">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {typeof providerAvatar === 'string' && providerAvatar.length <= 2 ? (
                <span className="text-lg font-medium">{providerAvatar}</span>
              ) : (
                <img src={providerAvatar} alt={provider} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-lg">{provider}</h3>
              <p className="text-gray-600">Completed Date: {completedDate}</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className="text-4xl mr-2 focus:outline-none"
                >
                  <span className={cn(
                    "text-gray-300",
                    star <= rating && "text-yellow-400"
                  )}>
                    ★
                  </span>
                </button>
              ))}
              <span className="ml-4 text-lg">
                {rating === 5 && "Excellent"}
                {rating === 4 && "Very Good"}
                {rating === 3 && "Good"}
                {rating === 2 && "Fair"}
                {rating === 1 && "Poor"}
              </span>
            </div>
          </div>

          <div className="mt-8">
            <label className="block text-lg font-medium mb-2">Your Feedback</label>
            <textarea
              value={feedback}
              onChange={handleFeedbackChange}
              placeholder="Share your experience working with this provider..."
              className="w-full border border-gray-300 rounded-lg p-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-right text-gray-500 mt-1">
              {charCount}/{maxChars}
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 py-6 text-base"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="flex-1 py-6 text-base bg-[#1B1828] hover:bg-[#2D2A3C]"
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
