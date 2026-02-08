import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';

const Table = ({ 
  columns, 
  data, 
  loading = false,
  pagination = true,
  currentPage = 0,
  totalPages = 0,
  totalElements = 0,
  pageSize = 10,
  onPageChange,
  onSearch,
  searchPlaceholder = "Search...",
  searchable = true,
  clientSideSearch = true, // Enable client-side filtering by default
  onRowClick, // Handler for row clicks
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Client-side filtering function that searches across all column values
  const filterData = (data, searchTerm, columns) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return data;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return data.filter(row => {
      // Check each column for a match
      return columns.some(col => {
        const value = row[col.key];
        
        // Handle different value types
        if (value === null || value === undefined) {
          return false;
        }
        
        // If column has a render function, we need to check the raw value
        // and also try to extract text from rendered value
        if (col.render) {
          const renderedValue = col.render(value, row);
          
          // Check raw value
          if (typeof value === 'string' && value.toLowerCase().includes(term)) {
            return true;
          }
          
          // Check rendered value (convert to string)
          if (renderedValue && String(renderedValue).toLowerCase().includes(term)) {
            return true;
          }
          
          // Check nested objects/arrays
          if (typeof value === 'object') {
            const jsonString = JSON.stringify(value).toLowerCase();
            if (jsonString.includes(term)) {
              return true;
            }
          }
        } else {
          // For non-rendered columns, check the value directly
          if (typeof value === 'string' && value.toLowerCase().includes(term)) {
            return true;
          }
          
          // Handle numbers
          if (typeof value === 'number' && String(value).includes(term)) {
            return true;
          }
          
          // Handle objects/arrays
          if (typeof value === 'object' && value !== null) {
            const jsonString = JSON.stringify(value).toLowerCase();
            if (jsonString.includes(term)) {
              return true;
            }
          }
        }
        
        return false;
      });
    });
  };

  // Filter data client-side if enabled
  const filteredData = useMemo(() => {
    if (clientSideSearch && searchTerm) {
      return filterData(data, searchTerm, columns);
    }
    return data;
  }, [data, searchTerm, columns, clientSideSearch]);

  // Calculate pagination for client-side filtered data
  const clientSidePaginatedData = useMemo(() => {
    if (clientSideSearch && searchTerm && pagination) {
      const start = currentPage * pageSize;
      const end = start + pageSize;
      return filteredData.slice(start, end);
    }
    return filteredData;
  }, [filteredData, currentPage, pageSize, clientSideSearch, searchTerm, pagination]);

  // Calculate total pages for client-side search
  const effectiveTotalPages = useMemo(() => {
    if (clientSideSearch && searchTerm) {
      return Math.ceil(filteredData.length / pageSize);
    }
    return totalPages;
  }, [filteredData.length, pageSize, clientSideSearch, searchTerm, totalPages]);

  // Calculate total elements for client-side search
  const effectiveTotalElements = useMemo(() => {
    if (clientSideSearch && searchTerm) {
      return filteredData.length;
    }
    return totalElements;
  }, [filteredData.length, clientSideSearch, searchTerm, totalElements]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // If client-side search is enabled, don't call backend search
    // Otherwise, call the backend search handler
    if (!clientSideSearch && onSearch) {
      onSearch(value);
    }
    
    // Reset to first page when searching
    if (clientSideSearch && onPageChange) {
      onPageChange(0);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (!clientSideSearch && onSearch) {
      onSearch('');
    }
    if (onPageChange) {
      onPageChange(0);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages && onPageChange) {
      onPageChange(newPage);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Show max 5 page numbers
    const total = totalPages;
    
    if (total <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 0; i < total; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(total - 1, start + maxVisible - 1);
      
      // Adjust start if we're near the end
      if (end - start < maxVisible - 1) {
        start = Math.max(0, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Generate page numbers for client-side pagination
  const getPageNumbersForClientSide = (total) => {
    const pages = [];
    const maxVisible = 5;
    
    if (total <= maxVisible) {
      for (let i = 0; i < total; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(total - 1, start + maxVisible - 1);
      
      if (end - start < maxVisible - 1) {
        start = Math.max(0, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="card">
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {clientSideSearch && searchTerm && (
            <p className="mt-2 text-xs text-gray-500">
              Showing {filteredData.length} result{filteredData.length !== 1 ? 's' : ''} matching "{searchTerm}"
            </p>
          )}
        </div>
      )}

      <div className="w-full">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => {
                const compactColumns = ['id', 'status', 'actions'];
                const isCompact = compactColumns.includes(col.key.toLowerCase());
                return (
                  <th
                    key={col.key}
                    className={`px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isCompact ? 'w-auto' : ''}`}
                    style={isCompact ? { width: 'auto', minWidth: '60px' } : {}}
                  >
                    <div className={isCompact ? 'whitespace-nowrap' : 'whitespace-normal break-words'}>{col.label}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(() => {
              const displayData = clientSideSearch && searchTerm ? clientSidePaginatedData : data;
              
              if (displayData.length === 0) {
                return (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                      {searchTerm ? (
                        <div>
                          <p>No results found for "{searchTerm}"</p>
                          <button
                            onClick={clearSearch}
                            className="mt-2 text-sm text-primary-600 hover:text-primary-700 underline"
                          >
                            Clear search
                          </button>
                        </div>
                      ) : (
                        'No data available'
                      )}
                    </td>
                  </tr>
                );
              }
              
              return displayData.map((row, index) => (
                <tr 
                  key={row.id || index} 
                  className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => {
                    const cellValue = col.render ? col.render(row[col.key], row) : row[col.key];
                    // Determine if cell should wrap or not based on column type
                    const compactColumns = ['id', 'status', 'actions'];
                    const shouldWrap = !compactColumns.includes(col.key.toLowerCase());
                    return (
                      <td 
                        key={col.key} 
                        className={`px-2 py-3 text-sm text-gray-900 ${shouldWrap ? 'break-words' : 'whitespace-nowrap'}`}
                        onClick={(e) => {
                          // Prevent row click when clicking on action buttons or links
                          if (e.target.closest('button') || e.target.closest('a')) {
                            e.stopPropagation();
                          }
                        }}
                      >
                        <div className={shouldWrap ? 'break-words max-w-full' : ''}>
                          {cellValue}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {pagination && (effectiveTotalPages > 0 || totalPages > 0) && (
        <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm text-gray-700">
            {effectiveTotalElements > 0 ? (
              <>
                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, effectiveTotalElements)} of {effectiveTotalElements} results
                {clientSideSearch && searchTerm && (
                  <span className="text-gray-500 ml-2">(filtered from {data.length} total)</span>
                )}
              </>
            ) : (
              'No results found'
            )}
          </div>
          {(effectiveTotalPages > 1 || totalPages > 1) && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(0)}
                disabled={currentPage === 0}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-1">
                {(() => {
                  const pagesToShow = clientSideSearch && searchTerm 
                    ? getPageNumbersForClientSide(effectiveTotalPages)
                    : getPageNumbers();
                  
                  return pagesToShow.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[2.5rem] px-3 py-2 text-sm border rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  ));
                })()}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= (clientSideSearch && searchTerm ? effectiveTotalPages : totalPages) - 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => handlePageChange((clientSideSearch && searchTerm ? effectiveTotalPages : totalPages) - 1)}
                disabled={currentPage >= (clientSideSearch && searchTerm ? effectiveTotalPages : totalPages) - 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Table;

