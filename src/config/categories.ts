// Single source of truth for real estate legal service categories
export const LEGAL_CATEGORIES = [
  { value: "property-purchase", label: "Property Purchase Agreement", color: "blue" },
  { value: "property-sale", label: "Property Sale Documentation", color: "green" },
  { value: "land-title", label: "Land Title Verification", color: "teal" },
  { value: "c-of-o", label: "Certificate of Occupancy (C of O)", color: "yellow" },
  { value: "deed-preparation", label: "Deed of Assignment Preparation", color: "purple" },
  { value: "survey-plan", label: "Survey Plan Verification", color: "orange" },
  { value: "property-due-diligence", label: "Property Due Diligence", color: "pink" },
  { value: "lease-agreement", label: "Lease Agreement Drafting", color: "indigo" },
  { value: "rent-agreement", label: "Tenancy Agreement", color: "red" },
  { value: "property-disputes", label: "Property Dispute Resolution", color: "cyan" },
  { value: "land-acquisition", label: "Land Acquisition Services", color: "emerald" },
  { value: "property-registration", label: "Property Registration", color: "amber" },
  { value: "mortgage-documentation", label: "Mortgage Documentation", color: "violet" },
  { value: "zoning-compliance", label: "Zoning & Planning Compliance", color: "rose" },
  { value: "property-inspection", label: "Legal Property Inspection", color: "sky" },
  { value: "other", label: "Other Real Estate Legal Services", color: "slate" }
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