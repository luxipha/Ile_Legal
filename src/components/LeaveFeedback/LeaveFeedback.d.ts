import { FC } from 'react';

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

export const LeaveFeedback: FC<LeaveFeedbackProps>;
