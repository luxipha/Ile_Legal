// Single source of truth for all legal service categories
export const LEGAL_CATEGORIES = [
  { value: "contract-law", label: "Contract Law", color: "blue" },
  { value: "business-law", label: "Business Law", color: "green" },
  { value: "family-law", label: "Family Law", color: "purple" },
  { value: "property-law", label: "Property Law", color: "orange" },
  { value: "immigration-law", label: "Immigration Law", color: "red" },
  { value: "land-title", label: "Land Title Verification", color: "teal" },
  { value: "contract-review", label: "Contract Review", color: "indigo" },
  { value: "due-diligence", label: "Due Diligence", color: "pink" },
  { value: "c-of-o", label: "C of O Processing", color: "yellow" },
  { value: "legal-documentation", label: "Legal Documentation", color: "gray" },
  { value: "compliance-check", label: "Compliance Check", color: "cyan" },
  { value: "other", label: "Other", color: "slate" }
] as const;

// Helper functions
export const getCategoryLabel = (value: string) => 
  LEGAL_CATEGORIES.find(cat => cat.value === value)?.label || value;

export const getCategoryColor = (value: string) => 
  LEGAL_CATEGORIES.find(cat => cat.value === value)?.color || "gray";

export const getAllCategoryValues = () => 
  LEGAL_CATEGORIES.map(cat => cat.value);

export const getAllCategoryOptions = () => 
  LEGAL_CATEGORIES.map(cat => ({ value: cat.value, label: cat.label }));