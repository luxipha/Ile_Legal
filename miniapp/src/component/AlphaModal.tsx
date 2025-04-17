import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AlphaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AlphaModal: React.FC<AlphaModalProps> = ({ isOpen, onClose }) => {
  // Close on escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-primary rounded-t-xl w-full max-w-[328px] p-4 relative"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-3 top-3 text-text-primary hover:text-accent transition-colors"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-text-primary text-lg font-bold mb-3">Alpha version</h2>

            <p className="text-text-secondary text-sm mb-3">
              This is an early version that may contain bugs and is still being actively developed!
            </p>

            <p className="text-text-secondary text-sm mb-4">
              Your feedback is valuable to us as we build the future of property investment!
            </p>

            <motion.button
              className="w-full bg-accent hover:bg-accent/90 text-primary py-2 rounded-lg mb-2 flex items-center justify-center gap-2 text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Share feedback
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7 17L17 7M17 7H7M17 7V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>

            <motion.button
              className="w-full border border-accent/30 text-text-primary py-2 rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-accent/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Report a bug
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7 17L17 7M17 7H7M17 7V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlphaModal;
