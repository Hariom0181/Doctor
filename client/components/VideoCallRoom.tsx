import { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  Users,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { agoraApiService } from '@/services/agoraApi';
import { useToast } from '@/hooks/use-toast';

interface VideoCallRoomProps {
  consultationId: number;
  userId: number;
  role: 'doctor' | 'patient';
  patientName?: string;
  doctorName?: string;
  duration: number;
  onEndCall: () => void;
}

export function VideoCallRoom({
  consultationId,
  userId,
  role,
  patientName,
  doctorName,
  duration,
  onEndCall,
}: VideoCallRoomProps) {
  const { toast } = useToast();
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<number[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // ✅ CRITICAL: Refs to prevent double operations
  const hasJoinedRef = useRef(false);
  const isJoiningRef = useRef(false);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const tracksRef = useRef<{ video: ICameraVideoTrack | null; audio: IMicrophoneAudioTrack | null }>({
    video: null,
    audio: null,
  });

  // Timer effect
  useEffect(() => {
    if (isJoined) {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isJoined]);

  // Add this BEFORE initializeAgora is called
  useEffect(() => {
    // Before joining, make sure all previous tracks are closed
    const cleanupPreviousTracks = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        console.log('📹 Available cameras:', videoDevices.length);
      } catch (error) {
        console.error('Error checking devices:', error);
      }
    };

    cleanupPreviousTracks();

    // Return cleanup function
    return () => {
      console.log('Component unmounting, cleaning up...');
    };
  }, []);

  // ✅ SINGLE useEffect for joining
  useEffect(() => {
    if (hasJoinedRef.current || isJoiningRef.current) {
      console.log('🚫 Already joined or joining, skipping...');
      return;
    }

    // ✅ Add delay for doctor to prevent UID_CONFLICT
    const delayMs = role === 'doctor' ? 2500 : 500; // Doctor waits 2.5 seconds

    console.log(`⏳ Waiting ${delayMs}ms before joining (role: ${role})`);

    const timer = setTimeout(() => {
      hasJoinedRef.current = true;
      isJoiningRef.current = true;
      initializeAgora();
    }, delayMs);

    return () => {
      clearTimeout(timer);
      console.log('🧹 Cleanup: Leaving channel');
      leaveChannel();
      hasJoinedRef.current = false;
      isJoiningRef.current = false;
    };
  }, []);

  // ✅ Safely close tracks
  // In closeTracks function, add longer delay
  const closeTracks = async () => {
    try {
      if (tracksRef.current.video) {
        console.log('🛑 Closing video track');
        tracksRef.current.video.stop();
        tracksRef.current.video.close();
        tracksRef.current.video = null;
      }
      if (tracksRef.current.audio) {
        console.log('🛑 Closing audio track');
        tracksRef.current.audio.stop();
        tracksRef.current.audio.close();
        tracksRef.current.audio = null;
      }

      // ✅ INCREASE delay
      await new Promise(resolve => setTimeout(resolve, 3000)); // 2 seconds instead of 1
    } catch (error) {
      console.error('Error closing tracks:', error);
    }
  };


  const initializeAgora = async () => {
    try {
      setConnectionError(null);
      console.log('🎥 Initializing Agora for', role, 'userId:', userId);

       try {
      console.log('🔍 Checking camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Camera access granted');
    } catch (permError: any) {
      console.error('❌ Camera permission error:', permError.message);
      setConnectionError('Camera not available. Check browser permissions.');
      return;
    }


      // ✅ Close any existing tracks FIRST
      await closeTracks();

      // ✅ Small delay to ensure device is released
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Device released, creating new tracks...');

      // ✅ Create fresh Agora client
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = agoraClient;

      // ✅ Set up event listeners
      agoraClient.on('user-published', async (user, mediaType) => {
        console.log('👤 User published:', user.uid, mediaType);
        try {
          await agoraClient.subscribe(user, mediaType);

          if (mediaType === 'video') {
            const remoteVideoTrack = user.videoTrack;
            const remotePlayerContainer = document.getElementById(`remote-player-${user.uid}`);
            if (remotePlayerContainer) {
              remoteVideoTrack?.play(remotePlayerContainer);
            }
          }

          if (mediaType === 'audio') {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack?.play();
          }

          setRemoteUsers((prev) => {
            if (!prev.includes(user.uid as number)) {
              return [...prev, user.uid as number];
            }
            return prev;
          });
        } catch (error) {
          console.error('Error subscribing to user:', error);
        }
      });

      agoraClient.on('user-unpublished', (user) => {
        console.log('👤 User unpublished:', user.uid);
        setRemoteUsers((prev) => prev.filter((uid) => uid !== user.uid));
      });

      agoraClient.on('user-left', (user) => {
        console.log('👤 User left:', user.uid);
        setRemoteUsers((prev) => prev.filter((uid) => uid !== user.uid));
      });

      // ✅ Error handler
      agoraClient.on('error', (error) => {
        console.error('❌ Agora Error:', error);
        setConnectionError(`Agora Error: ${error.message}`);
      });

      // ✅ Connection state change
      agoraClient.on('connection-state-change', (curState, revState, reason) => {
        console.log('📡 Connection state:', curState, 'Reason:', reason);
        if (curState === 'DISCONNECTED') {
          setConnectionError('Connection lost. Attempting to reconnect...');
        }
      });

      // ✅ Get token with unique UID
      const credentials = await agoraApiService.generateToken(consultationId, userId, role);
      console.log('🔑 MY UID:', credentials.uid, 'Role:', role);
      console.log('🔑 Consultation ID:', consultationId, 'User ID:', userId);

      console.log('🔑 Credentials received:', {
        appId: credentials.appId,
        channel: credentials.channelName,
        uid: credentials.uid,
        role: role
      });

      // ✅ Join channel
      await agoraClient.join(
        credentials.appId,
        credentials.channelName,
        credentials.token,
        credentials.uid
      );

      console.log('✅ Joined channel:', credentials.channelName, 'as UID:', credentials.uid);

      setClient(agoraClient);

      // ✅ Create tracks with error handling
      try {
        const videoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            bitrateMin: 1000,
            bitrateMax: 2500,
          },
        });

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: {
            sampleRate: 48000,
            stereo: true,
          },
        });

        // ✅ Publish tracks FIRST
        await agoraClient.publish([videoTrack, audioTrack]);
        console.log('✅ Published local tracks');

        // ✅ Update refs immediately
        tracksRef.current.video = videoTrack;
        tracksRef.current.audio = audioTrack;

        // ✅ Set joined state to trigger DOM render
        setIsJoined(true);
        setLocalVideoTrack(videoTrack);
        setLocalAudioTrack(audioTrack);
        isJoiningRef.current = false;

        // ✅ WAIT for DOM to update before playing video
        setTimeout(() => {
          const localPlayerContainer = document.getElementById('local-player');
          console.log('📹 Local player container:', localPlayerContainer);

          if (localPlayerContainer) {
            videoTrack.play(localPlayerContainer);
            console.log('✅ Local video playing in container');
          } else {
            console.error('❌ Local player container still not found!');
            // Try again after another delay
            setTimeout(() => {
              const retryContainer = document.getElementById('local-player');
              if (retryContainer) {
                videoTrack.play(retryContainer);
                console.log('✅ Local video playing (retry)');
              }
            }, 200);
          }
        }, 100);

        // ✅ Mark consultation as started (doctor only)
        if (role === 'doctor') {
          try {
            await agoraApiService.startConsultation(consultationId);
          } catch (error) {
            console.error('Error marking consultation as started:', error);
          }
        }

        toast({
          title: 'Connected',
          description: 'You have joined the video consultation',
        });
      } catch (trackError: any) {
        console.error('❌ Error creating tracks:', trackError);
        setConnectionError(`Camera/Microphone Error: ${trackError.message}`);

        // Leave channel if tracks fail
        try {
          await agoraClient.leave();
        } catch (e) {
          console.error('Error leaving on track failure:', e);
        }

        toast({
          title: 'Device Error',
          description: trackError.message || 'Cannot access camera or microphone',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('❌ Error initializing Agora:', error);
      hasJoinedRef.current = false;
      isJoiningRef.current = false;
      setConnectionError(error.message || 'Failed to initialize video call');

      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to join video call',
        variant: 'destructive',
      });
    }
  };

  const toggleVideo = async () => {
    try {
      if (tracksRef.current.video) {
        await tracksRef.current.video.setEnabled(!isVideoEnabled);
        setIsVideoEnabled(!isVideoEnabled);
      }
    } catch (error) {
      console.error('Error toggling video:', error);
      setConnectionError('Failed to toggle video');
    }
  };

  const toggleAudio = async () => {
    try {
      if (tracksRef.current.audio) {
        await tracksRef.current.audio.setEnabled(!isAudioEnabled);
        setIsAudioEnabled(!isAudioEnabled);
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
      setConnectionError('Failed to toggle audio');
    }
  };

  const leaveChannel = async () => {
    try {
      console.log('👋 Leaving channel...');

      // ✅ Close tracks first
      await closeTracks();

      // ✅ Leave channel
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
        setClient(null);
      }

      setIsJoined(false);
      setRemoteUsers([]);
      setConnectionError(null);
      console.log('✅ Left channel');
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  };

  const handleEndCall = async () => {
    if (isEnding) return;

    if (role === 'doctor') {
      if (!confirm('Are you sure you want to end this consultation?')) {
        return;
      }

      try {
        setIsEnding(true);

        const result = await agoraApiService.endConsultation(consultationId);

        toast({
          title: 'Consultation Ended',
          description: result.refundAmount > 0
            ? `Consultation ended. ₹${result.refundAmount} refunded to patient.`
            : 'Consultation ended successfully',
        });

        await leaveChannel();
        onEndCall();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to end consultation',
          variant: 'destructive',
        });
        setIsEnding(false);
      }
    } else {
      await leaveChannel();
      onEndCall();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Error Display */}
      {connectionError && (
        <div className="bg-red-900 text-red-100 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{connectionError}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Video className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">
              {role === 'doctor' ? `Consultation with ${patientName}` : `Dr. ${doctorName}`}
            </h3>
            <p className="text-sm text-gray-300">Consultation ID: {consultationId}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge className="bg-red-600 animate-pulse">
            <Clock className="w-3 h-3 mr-1" />
            {formatTime(elapsedTime)} / {duration}:00
          </Badge>
          <Badge variant="outline" className="border-green-500 text-green-500">
            <Users className="w-3 h-3 mr-1" />
            {remoteUsers.length + 1} participant{remoteUsers.length !== 0 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 flex items-center justify-center p-4 gap-4 relative">
        {remoteUsers.length > 0 ? (
          <div className="relative w-full max-w-4xl h-full bg-gray-800 rounded-lg overflow-hidden">
            {remoteUsers.map((uid) => (
              <div
                key={uid}
                id={`remote-player-${uid}`}
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
              />
            ))}
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
              {role === 'doctor' ? patientName : `Dr. ${doctorName}`}
            </div>
          </div>
        ) : (
          <Card className="w-full max-w-4xl bg-gray-800 text-white border-gray-700">
            <CardContent className="flex flex-col items-center justify-center h-96">
              <Users className="w-16 h-16 mb-4 text-gray-500" />
              <p className="text-lg">Waiting for {role === 'doctor' ? 'patient' : 'doctor'} to join...</p>
              {!isJoined && <p className="text-sm text-gray-400 mt-2">Connecting...</p>}
            </CardContent>
          </Card>
        )}

        {/* ✅ LOCAL VIDEO CONTAINER - THIS WAS MISSING! */}
        {isJoined && (
          <div className="absolute bottom-24 right-8 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg">
            <div
              id="local-player"
              className="w-full h-full"
              style={{ width: '100%', height: '100%' }}
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              You {!isVideoEnabled && '(Video Off)'}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6 flex items-center justify-center gap-4">
        <Button
          size="lg"
          variant={isAudioEnabled ? 'default' : 'destructive'}
          onClick={toggleAudio}
          className="rounded-full w-14 h-14"
          disabled={!isJoined}
        >
          {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>

        <Button
          size="lg"
          variant={isVideoEnabled ? 'default' : 'destructive'}
          onClick={toggleVideo}
          className="rounded-full w-14 h-14"
          disabled={!isJoined}
        >
          {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </Button>

        <Button
          size="lg"
          variant="destructive"
          onClick={handleEndCall}
          disabled={isEnding}
          className="rounded-full w-16 h-16"
        >
          {isEnding ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <PhoneOff className="w-6 h-6" />
          )}
        </Button>

        <Button
          size="lg"
          variant="outline"
          disabled
          className="rounded-full w-14 h-14"
          title="Screen share coming soon"
        >
          <Monitor className="w-6 h-6" />
        </Button>
      </div>

      {role === 'doctor' && (
        <div className="bg-yellow-900 text-yellow-100 px-4 py-2 text-sm text-center">
          ⚠️ Only you can end this consultation. Ending early will automatically refund unused time to the patient.
        </div>
      )}
    </div>
  );
}