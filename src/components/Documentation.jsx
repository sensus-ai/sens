import React, { useState } from 'react';

const Documentation = () => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const menuItems = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      subsections: ['Introduction', 'Setup', 'Quick Start'],
    },
    {
      id: 'video-rewards',
      title: 'Video Rewards',
      subsections: [
        'How It Works',
        'Recording Requirements',
        'Claiming Rewards',
      ],
    },
    {
      id: 'referrals',
      title: 'Referral Program',
      subsections: [
        'Overview',
        'Your Unique Referral Link',
        'Twitter Campaign & Sharing',
        'Daily Referral Cap',
      ],
    },
    {
      id: 'technical-details',
      title: 'Technical Details',
      subsections: [
        'Data Collection for AI Training',
        'Tokenomics & Reward Calculations',
        'Smart Contract Architecture',
      ],
    },
    {
      id: 'business-model',
      title: 'Business Model',
      subsections: [
        'Core Offering',
        'Value Proposition',
        'Revenue Streams',
      ],
    },
    {
      id: 'project-phases',
      title: 'Project Phases',
      subsections: ['Development Timeline', 'Current Status', 'Scalability']
    },
    {
      id: 'use-cases',
      title: 'Use Cases',
      subsections: [
        'Robotics',
        'AI and Machine Learning',
        'Autonomous Vehicles',
        'AR/VR',
        'Smart Cities',
        'Healthcare'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 space-y-2 fixed h-full overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.id} className="space-y-1">
            <button
              onClick={() => toggleMenu(item.id)}
              className={`w-full flex items-center justify-between p-2 text-left rounded-lg ${
                activeSection === item.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>{item.title}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  expandedMenus[item.id] ? 'transform rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedMenus[item.id] && (
              <div className="pl-4 space-y-1">
                {item.subsections.map((subsection) => (
                  <button
                    key={subsection}
                    onClick={() => setActiveSection(item.id)}
                    className="w-full p-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                  >
                    {subsection}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="ml-64 flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Getting Started */}
          {activeSection === 'getting-started' && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Getting Started</h2>
              <div className="prose dark:prose-invert">
                <p>
                  Welcome to SensusAI, a decentralized video recording and data collection platform powered by blockchain technology. Follow these steps to get started:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Connect your wallet using MetaMask or another Web3 wallet.</li>
                  <li>Navigate to the Record tab to start creating video content.</li>
                  <li>Use the Dashboard to manage your recordings and track rewards.</li>
                  <li>Share your unique referral link from the Rewards tab to earn extra SENS tokens.</li>
                </ol>
              </div>
            </section>
          )}

          {/* Video Rewards Section */}
          {activeSection === 'video-rewards' && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Video Rewards</h2>
              <div className="prose dark:prose-invert">
                <p>
                  SensusAI rewards users with SENS tokens when they record and upload videos that meet our quality criteria. The rewards are calculated based on the video duration (minimum of 10 seconds), with a daily cap to ensure fairness.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Minimum Duration:</strong> 10 seconds per video.</li>
                  <li><strong>Reward Rate:</strong> Earn a fixed amount of SENS tokens per 10-second interval of video.</li>
                  <li><strong>Daily Limit:</strong> Users can earn up to 100 SENS tokens per day from video uploads.</li>
                </ul>
              </div>
            </section>
          )}

          {/* Referral Program Section */}
          {activeSection === 'referrals' && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Referral Program</h2>
              <div className="prose dark:prose-invert">
                <p>
                  Our referral program rewards you with SENS tokens when someone registers using your unique referral link. For every successful referral, you receive a fixed bonus of 10 SENS tokens, with a maximum of 10 referrals rewarded per day.
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Unique Referral Link:</strong> You can find your unique referral link in the Rewards tab. Share it on Twitter or other platforms.
                  </li>
                  <li>
                    <strong>How It Works:</strong> When someone uses your link to register, the system automatically records the referral and triggers a smart contract transaction to transfer the reward.
                  </li>
                  <li>
                    <strong>Daily Cap:</strong> The referral rewards are capped at 10 successful referrals per day.
                  </li>
                  <li>
                    <strong>Twitter Campaign:</strong> We encourage you to share your referral link with a tweet using the following template:
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400">
                      “I’m helping train AI with SensusAI! Join me and earn SENS tokens. Sign up here: [Your Referral Link] #SensusAIReferral”
                    </blockquote>
                  </li>
                  <li>
                    <strong>Claiming Rewards:</strong> The rewards will automatically appear in your wallet once the referral is processed.
                  </li>
                </ol>
              </div>
            </section>
          )}

          {/* Technical Details Section */}
          {activeSection === 'technical-details' && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Technical Details</h2>
              <div className="prose dark:prose-invert">
                <h3>Data Collection for AI Training</h3>
                <p>
                  SensusAI collects video data recorded by users, which is then processed and curated to train AI models for various applications:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Gadget Interaction Videos:</strong> These videos demonstrate real-world usage of smart devices, helping to train AI for gesture recognition and user interaction analysis.
                  </li>
                  <li>
                    <strong>Voice Command Recordings:</strong> Videos capturing voice commands help in training speech recognition systems.
                  </li>
                  <li>
                    <strong>Conversational & Instructional Videos:</strong> Recordings where users explain or discuss topics, contributing to the training of language models.
                  </li>
                </ul>
                <h3>Smart Contract Integration</h3>
                <p>
                  Our platform uses two main smart contracts: one for video rewards and one for referrals. The contracts enforce daily caps, reward calculations, and ensure secure token transfers using Thirdweb’s infrastructure.
                </p>
                <h3>Tokenomics & Reward Calculations</h3>
                <p>
                  The reward system is designed to incentivize quality contributions while preventing abuse. Users earn SENS tokens based on the duration of their video recordings and for successful referrals. Both reward contracts have built-in limits (e.g., maximum of 100 SENS tokens per day for videos and 10 referrals per day) to ensure fairness.
                </p>
              </div>
            </section>
          )}

          {/* Business Model Section */}
          {activeSection === 'business-model' && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Business Model</h2>
              <div className="prose dark:prose-invert">
                <p>
                  SensusAI leverages a decentralized ecosystem where users contribute video data that is curated and used to train advanced AI models. In return, users earn SENS tokens through both video rewards and referrals. Our revenue streams include corporate subscriptions, data licensing, transaction fees, and token staking incentives.
                </p>
              </div>
            </section>
          )}

          {/* Project Phases Section */}
          {activeSection === 'project-phases' && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Project Phases</h2>
              
              {/* Development Timeline */}
              <div className="space-y-8 mb-12">
                {[
                  {
                    title: 'Alpha Launch (Pilot Program)',
                    description: 'Initial testing and proof of concept',
                    tasks: [
                      'Small group of early adopters test the platform with partner hardware',
                      'Secure initial robotics companies to prove demand for curated datasets',
                      'Refine data collection and processing algorithms',
                    ],
                    status: 'completed'
                  },
                  {
                    title: 'Beta Expansion',
                    description: 'Scaling user base and improving platform',
                    tasks: [
                      'Expand device compatibility (phone-based AR, other smart glasses)',
                      'Ramp up user acquisition with targeted marketing and incentives',
                      'Implement feedback from alpha phase to enhance user experience',
                    ],
                    status: 'in-progress'
                  },
                  {
                    title: 'Global Rollout',
                    description: 'Expanding reach and diversifying offerings',
                    tasks: [
                      'Scale to various regions, capitalizing on localized content',
                      'Onboard more corporate clients from multiple sectors',
                      'Introduce advanced features like real-time data streaming',
                    ],
                    status: 'upcoming'
                  },
                  {
                    title: 'Long-Term Growth',
                    description: 'Evolving into a comprehensive AI ecosystem',
                    tasks: [
                      'Evolve into a broader ecosystem for AI training modules and simulations',
                      'Continuously refine tokenomics to sustain user incentives',
                      'Explore partnerships for integrating Sensus AI data into emerging technologies',
                    ],
                    status: 'upcoming'
                  }
                ].map((phase, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">{phase.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        phase.status === 'completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : phase.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{phase.description}</p>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                      {phase.tasks.map((task, taskIndex) => (
                        <li key={taskIndex}>{task}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Scalability Considerations */}
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Scalability Considerations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Technical Scalability',
                    items: [
                      'Cloud-native architecture for elastic scaling',
                      'Distributed data processing using edge computing',
                      'Continuous optimization of ML algorithms for efficiency',
                      'Regular security audits and updates',
                    ]
                  },
                  {
                    title: 'Business Scalability',
                    items: [
                      'Modular platform design for easy feature additions',
                      'Strategic partnerships for rapid market penetration',
                      'Diversification of data types and AI applications',
                      'Continuous community engagement and governance evolution',
                    ]
                  }
                ].map((section, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{section.title}</h4>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Use Cases Section */}
          {activeSection === 'use-cases' && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Use Cases</h2>
              <div className="space-y-12">
                {[
                  {
                    category: 'Robotics',
                    description: 'Enhancing robotic capabilities through real-world data',
                    applications: [
                      {
                        title: 'Humanoid Robot Training',
                        description: 'Enhance the ability of humanoid robots to navigate and interact in diverse real-world environments.',
                        impact: 'More natural and adaptive robot behavior in human-centric spaces.',
                        details: 'By leveraging Sensus AI\'s vast dataset of human movements and interactions, robotics researchers can develop more sophisticated algorithms for humanoid robots.'
                      },
                      {
                        title: 'Robotic Manipulation',
                        description: 'Improve robotic grasping and manipulation skills for various objects and tasks.',
                        impact: 'Enhanced dexterity and versatility in robotic applications, from manufacturing to healthcare.',
                        details: 'The diverse object interaction data collected by Sensus AI users provides invaluable input for training robotic manipulation algorithms.'
                      }
                    ]
                  }
                ].map((category) => (
                  <div key={category.category} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-4">
                      {category.category}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{category.description}</p>
                    
                    <div className="space-y-6">
                      {category.applications.map((app, index) => (
                        <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-4">
                          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                            {app.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">{app.description}</p>
                          <div className="bg-blue-50 dark:bg-blue-900/30 rounded p-3 mb-2">
                            <span className="font-medium text-blue-700 dark:text-blue-300">Impact: </span>
                            <span className="text-gray-700 dark:text-gray-300">{app.impact}</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{app.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default Documentation;
