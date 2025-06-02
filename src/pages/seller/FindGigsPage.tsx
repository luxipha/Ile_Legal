import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, DollarSign } from 'lucide-react';
import { useMockDataStore } from '../../store/mockData';

const ITEMS_PER_PAGE = 5;
const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'land-title', label: 'Land Title Verification' },
  { value: 'deed-assignment', label: 'Deed of Assignment' },
  { value: 'contract-review', label: 'Contract Review' },
  { value: 'compliance', label: 'Legal Compliance' },
  { value: 'due-diligence', label: 'Due Diligence' },
];

const FindGigsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { gigs } = useMockDataStore();

  // Filter gigs based on search term and category
  const filteredGigs = useMemo(() => {
    return gigs.filter(gig => {
      const matchesSearch = searchTerm === '' || 
        gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || gig.category === selectedCategory;
      
      return gig.status === 'active' && matchesSearch && matchesCategory;
    });
  }, [gigs, searchTerm, selectedCategory]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredGigs.length / ITEMS_PER_PAGE);
  const paginatedGigs = filteredGigs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1); // Reset to first page on category change
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Find Gigs</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search gigs..."
              className="input pl-10 pr-4"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          
          <select
            className="input"
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            {CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white shadow-card rounded-lg divide-y divide-gray-200">
        {paginatedGigs.length > 0 ? (
          <>
            {paginatedGigs.map((gig) => (
              <div key={gig.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div className="mb-4 sm:mb-0">
                    <Link 
                      to={`/gigs/${gig.id}`}
                      className="text-lg font-medium text-primary-500 hover:text-primary-600"
                    >
                      {gig.title}
                    </Link>
                    <div className="mt-1 text-sm text-gray-500">
                      Posted by: {gig.client.name}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {gig.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center text-lg font-bold text-gray-900">
                      <DollarSign className="h-5 w-5 text-gray-500" />
                      ₦{gig.budget.toLocaleString()}
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      Due: {new Date(gig.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <Link
                    to={`/gigs/${gig.id}`}
                    className="btn-primary text-sm"
                  >
                    View Details & Bid
                  </Link>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="btn-outline text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-outline text-sm"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                      </span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredGigs.length)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{filteredGigs.length}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          } border`}
                        >
                          {page}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-6 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No gigs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filters to find more opportunities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindGigsPage;