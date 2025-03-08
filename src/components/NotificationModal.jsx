import React from 'react';

const NotificationModal = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Dark backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal container - centers the modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Modal content */}
        <div 
          className="relative bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full mx-auto p-6 shadow-2xl transform transition-all"
          role="document"
        >
          <div className="flex items-center mb-4">
            {type === 'success' ? (
              <div className="bg-green-100 rounded-full p-2 mr-3" aria-hidden="true">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="bg-yellow-100 rounded-full p-2 mr-3" aria-hidden="true">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">{message}</p>
          
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-2 text-lg font-medium rounded-lg text-white ${
                type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
              } transition-colors duration-200`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;