import React from 'react';

const topics = {
  indoor: ['Household', 'Office/Workspace', 'Retail & Commercial'],
  outdoor: ['Parks', 'Streets', 'Public Spaces'],
  transportation: ['Public Transit', 'Traffic', 'Navigation'],
  specialized: ['Events', 'Construction', 'Other']
};

const TopicSelector = ({ onSelect }) => {
  const [mainTopic, setMainTopic] = React.useState(null);
  
  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Select Recording Topic</h2>
      
      {!mainTopic ? (
        <div className="grid grid-cols-2 gap-4">
          {Object.keys(topics).map((topic) => (
            <button
              key={topic}
              onClick={() => setMainTopic(topic)}
              className="p-4 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg shadow transition-colors duration-200 text-left"
            >
              <span className="capitalize">{topic}</span>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <button
              onClick={() => setMainTopic(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to main topics
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {topics[mainTopic].map((subTopic) => (
              <button
                key={subTopic}
                onClick={() => onSelect(`${mainTopic}/${subTopic}`)}
                className="p-4 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg shadow transition-colors duration-200 text-left"
              >
                {subTopic}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicSelector;