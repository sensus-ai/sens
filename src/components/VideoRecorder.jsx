import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAddress } from "@thirdweb-dev/react";
import { ethers } from 'ethers';
import { supabase } from '../lib/supabase';
import { rewardUser } from '../lib/token';
import TopicSelector from './TopicSelector';
import NotificationModal from './NotificationModal';

const MIN_RECORDING_DURATION = 10; // Minimum 10 seconds for any reward

const VideoRecorder = () => {
  const [step, setStep] = useState('connect'); // connect -> authenticate -> topic -> record -> preview -> upload
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [session, setSession] = useState(null);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCameraPermissionGranted, setIsCameraPermissionGranted] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
  const [facingMode, setFacingMode] = useState("user");
  const [isMobile, setIsMobile] = useState(false);

  const address = useAddress();
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // --------------------- USE EFFECTS ---------------------

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setStep('topic');
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setStep('topic');
    });

    // Check for existing camera permission
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setIsCameraPermissionGranted(true);
        stream.getTracks().forEach(track => track.stop()); // Clean up the test stream
      })
      .catch(() => {
        setIsCameraPermissionGranted(false);
      });

    return () => {
      subscription.unsubscribe();
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Sign in with wallet address when available
    const signInWithWallet = async () => {
      if (address && !session) {
        setStep('authenticate');
        const { error } = await supabase.auth.signInWithPassword({
          email: `${address.toLowerCase()}@wallet.local`,
          password: address.toLowerCase(),
        });
        
        if (error) {
          // If sign in fails, try to sign up
          const { error: signUpError } = await supabase.auth.signUp({
            email: `${address.toLowerCase()}@wallet.local`,
            password: address.toLowerCase(),
          });
          
          if (signUpError) {
            console.error('Auth error:', signUpError);
            setStep('connect');
          }
        }
      } else if (!address) {
        setStep('connect');
      }
    };

    signInWithWallet();
  }, [address, session]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --------------------- HELPER FUNCTIONS ---------------------

  const resetRecordingState = () => {
    setRecordingTime(0);
    setRecordingBlob(null);
    chunksRef.current = [];
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setIsCameraPermissionGranted(true);
      stream.getTracks().forEach(track => track.stop());
      setCameraError(null);
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setCameraError('Camera access denied. Please grant camera permissions in your browser settings.');
      setIsCameraPermissionGranted(false);
    }
  };

  const handleUserMedia = (stream) => {
    setIsWebcamReady(true);
    setIsCameraPermissionGranted(true);
    setCameraError(null);

    // Mute all audio output to prevent feedback
    if (webcamRef.current && webcamRef.current.video) {
      webcamRef.current.video.muted = true;
    }
  };

  const handleUserMediaError = (error) => {
    console.error('Webcam error:', error);
    setCameraError('Failed to access camera. Please ensure camera permissions are granted.');
    setIsWebcamReady(false);
    setIsCameraPermissionGranted(false);
  };

  /**
   * Use flexible "ideal" constraints to avoid forcing 1280×720
   * that might cause zoom on mobile.
   */
  const getVideoConstraints = () => {
    return {
      facingMode: facingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      focusMode: 'continuous'
    };
  };

  // --------------------- RECORDING FUNCTIONS ---------------------

  const startRecording = async () => {
    if (!selectedTopic) {
      alert("Please select a topic first");
      return;
    }

    if (!session) {
      setStep('connect');
      return;
    }

    if (!isCameraPermissionGranted) {
      await requestCameraPermission();
      return;
    }

    // Reset recording state
    resetRecordingState();
    
    try {
      const constraints = {
        video: getVideoConstraints(),
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Ensure audio output is muted
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.muted = true;
      }

      if (webcamRef.current) {
        webcamRef.current.video.srcObject = stream;
      }

      const options = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      };

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current.ondataavailable = handleDataAvailable;
      mediaRecorderRef.current.onstop = handleStop;
      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        stopRecording();
        alert('Recording error occurred. Please try again.');
      };

      mediaRecorderRef.current.start(1000);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setStep('record');
      
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
        
        if (elapsed >= 3600) {
          stopRecording();
        }
      }, 1000);

      setIsWebcamReady(true);
      setCameraError(null);
    } catch (error) {
      console.error('Error starting recording:', error);
      setCameraError('Failed to start recording. Please ensure camera and microphone access is granted.');
      setIsWebcamReady(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(timerRef.current);
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        
        // Calculate final duration
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(finalDuration);
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
        setStep('record');
      }
    }
  };

  const handleDataAvailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunksRef.current.push(event.data);
    }
  };

  const handleStop = async () => {
    try {
      const finalBlob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordingBlob(finalBlob);
      setStep('preview');
    } catch (error) {
      console.error('Error creating recording blob:', error);
      alert('Error processing recording. Please try again.');
      setStep('record');
    }
  };

  // --------------------- NOTIFICATION / UPLOAD ---------------------

  const showNotification = (title, message, type = 'success') => {
    setNotification({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const handleUpload = async () => {
    if (!session || !recordingBlob) {
      setStep('connect');
      return;
    }

    // Enforce minimum duration
    if (recordingTime < MIN_RECORDING_DURATION) {
      showNotification(
        'Recording Too Short',
        `Recording must be at least ${MIN_RECORDING_DURATION} seconds long to earn rewards.`,
        'warning'
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const fileName = `${Date.now()}-${address}.webm`;
      
      setUploadProgress(20);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(fileName, recordingBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recordings')
        .getPublicUrl(fileName);

      setUploadProgress(70);

      // Create the recording record
      const { error: dbError } = await supabase
        .from('recordings')
        .insert({
          user_id: address,
          topic: selectedTopic,
          duration: recordingTime,
          video_url: publicUrl,
          rewarded: false,
          verified: false,
          flagged: false
        });

      if (dbError) throw dbError;

      setUploadProgress(85);

      // Attempt to reward user
      const rewardResult = await rewardUser(address, recordingTime);
      
      setUploadProgress(100);
      
      if (rewardResult.success) {
        showNotification('Success!', rewardResult.message);
      } else {
        showNotification('Warning', rewardResult.message, 'warning');
      }
      
      setStep('topic');
    } catch (error) {
      console.error('Error processing recording:', error);
      showNotification(
        'Error',
        'Error uploading recording. Please try again.',
        'warning'
      );
      setStep('topic');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setRecordingTime(0);
      setRecordingBlob(null);
      setSelectedTopic(null);
      chunksRef.current = [];
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  // --------------------- RENDER STEPS ---------------------

  const renderStep = () => {
    switch (step) {
      case 'connect':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Please connect your wallet to start recording
            </h2>
          </div>
        );

      case 'authenticate':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Authenticating...
            </h2>
          </div>
        );

      case 'topic':
        return (
          <TopicSelector
            onSelect={(topic) => {
              setSelectedTopic(topic);
              setStep('record');
            }}
          />
        );

      case 'record':
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-2xl">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Recording: {selectedTopic}
                </h2>
                <button
                  onClick={() => {
                    setSelectedTopic(null);
                    setStep('topic');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Change Topic
                </button>
              </div>
            </div>
            
            {!isCameraPermissionGranted ? (
              <div className="text-center space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Camera access is required to record videos.
                </p>
                <button
                  onClick={requestCameraPermission}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Grant Camera Access
                </button>
              </div>
            ) : (
              <>
                {/* Container with more flexible height/width, removing forced aspect-ratio */}
                <div
                  className={`relative w-full ${
                    isMobile ? 'h-auto' : 'max-w-2xl'
                  } bg-black rounded-lg overflow-hidden`}
                >
                  <Webcam
                    ref={webcamRef}
                    audio={true}
                    onUserMedia={handleUserMedia}
                    onUserMediaError={handleUserMediaError}
                    videoConstraints={getVideoConstraints()}
                    className="w-full h-full"
                    style={{
                      transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                      // Use 'contain' to prevent zoom/cropping
                      objectFit: 'contain'
                    }}
                    screenshotFormat="image/jpeg"
                  />
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white">
                    {formatTime(recordingTime)}
                  </div>
                </div>

                {cameraError && (
                  <div className="text-red-600 text-center">
                    {cameraError}
                  </div>
                )}
                
                <div className="flex space-x-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={isUploading || !isWebcamReady}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      disabled={isUploading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Stop Recording
                    </button>
                  )}
                  <button
                    onClick={toggleCamera}
                    disabled={isRecording}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Swap Camera
                  </button>
                </div>
              </>
            )}
          </div>
        );

      case 'preview':
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full max-w-2xl">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Preview Recording
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Duration: {formatTime(recordingTime)}
                </p>
              </div>
            </div>
            
            <div className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden">
              {recordingBlob && (
                <video
                  src={URL.createObjectURL(recordingBlob)}
                  controls
                  className="w-full h-full"
                  style={{ objectFit: 'contain' }}
                />
              )}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  resetRecordingState();
                  setStep('record');
                }}
                disabled={isUploading}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Record Again
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Recording'}
              </button>
            </div>

            {isUploading && (
              <div className="text-center space-y-2">
                <div className="text-gray-600 dark:text-gray-400">
                  Processing recording... {uploadProgress}%
                </div>
                <div className="w-full max-w-md h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'upload':
        return (
          <div className="text-center space-y-4">
            <div className="text-gray-600 dark:text-gray-400">
              Processing recording... {uploadProgress}%
            </div>
            <div className="w-full max-w-md h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // --------------------- RETURN ---------------------

  return (
    <div className="min-h-[calc(100vh-300px)] flex flex-col items-center justify-center p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg transition-colors duration-200">
      {renderStep()}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  );
};

export default VideoRecorder;
