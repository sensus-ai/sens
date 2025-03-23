import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const DescriptionModal = ({ isOpen, onClose, videoBlob, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(description, videoBlob);
      onClose();
    } catch (error) {
      console.error('Error in description submission:', error);
      setError('Failed to save description. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">Add Description</h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}
          <textarea
            className="w-full p-2 border border-gray-700 rounded-md mb-4 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="Enter video description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DescriptionModal;