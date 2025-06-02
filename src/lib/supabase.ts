// This file is kept as a placeholder for future backend integration
// Currently using mock data for frontend-only development
export const mockStorage = {
  upload: async (file: File) => {
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      path: URL.createObjectURL(file),
    };
  },
};