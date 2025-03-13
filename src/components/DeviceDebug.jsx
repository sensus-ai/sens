import React, { useEffect, useState } from 'react';

const DeviceDebug = () => {
  const [debug, setDebug] = useState({
    userAgent: '',
    browser: '',
    hasMediaDevices: false,
    hasGetUserMedia: false,
  });

  useEffect(() => {
    const info = {
      userAgent: navigator.userAgent,
      browser: navigator.vendor,
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    };
    setDebug(info);
    console.log('Device Debug Info:', info);
  }, []);

  return (
    <div className="text-xs text-gray-500 mt-2">
      <pre>{JSON.stringify(debug, null, 2)}</pre>
    </div>
  );
};

export default DeviceDebug;
