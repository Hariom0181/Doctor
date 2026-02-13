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
  
  // ✅ CRITICAL: Prevent double-joining in React StrictMode
  const hasJoinedRef = useRef(false);
  const isJoiningRef = useRef(false);

  // Timer effect
  useEffect(() => {
    if (isJoined) {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isJoined]);

  // ✅ SINGLE useEffect for joining
  useEffect(() => {
    // Prevent double-joining
    if (hasJoinedRef.current || isJoiningRef.current) {
      console.log('🚫 Already joined or joining, skipping...');
      return;
    }

    hasJoinedRef.current = true;
    isJoiningRef.current = true;

    initializeAgora();

    return () => {
      console.log('🧹 Cleanup: Leaving channel');
      leaveChannel();
      hasJoinedRef.current = false;
      isJoiningRef.current = false;
    };
  }, []); // ✅ Empty deps - only run once

  const initializeAgora = async () => {
    try {
      console.log('🎥 Initializing Agora for', role, 'userId:', userId);

      // ✅ Create Agora client ONCE
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      
      // Set up event listeners
      agoraClient.on('user-published', async (user, mediaType) => {
        console.log('👤 User published:', user.uid, mediaType);
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
      });

      agoraClient.on('user-unpublished', (user) => {
        console.log('👤 User unpublished:', user.uid);
        setRemoteUsers((prev) => prev.filter((uid) => uid !== user.uid));
      });

      agoraClient.on('user-left', (user) => {
        console.log('👤 User left:', user.uid);
        setRemoteUsers((prev) => prev.filter((uid) => uid !== user.uid));
      });

      // ✅ Get Agora credentials
      const credentials = await agoraApiService.generateToken(consultationId, userId, role);

      console.log('🔑 Credentials received:', {
        appId: credentials.appId,
        channel: credentials.channelName,
        uid: credentials.uid,
        role: role
      });

      // ✅ Join channel with generated UID
      await agoraClient.join(
        credentials.appId,
        credentials.channelName,
        credentials.token,
        credentials.uid
      );

      console.log('✅ Joined channel:', credentials.channelName, 'as UID:', credentials.uid);
      
      // Store client AFTER successful join
      setClient(agoraClient);

      // Create and publish local tracks
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

      setLocalVideoTrack(videoTrack);
      setLocalAudioTrack(audioTrack);

      // Play local video
      const localPlayerContainer = document.getElementById('local-player');
      if (localPlayerContainer) {
        videoTrack.play(localPlayerContainer);
      }

      // Publish tracks
      await agoraClient.publish([videoTrack, audioTrack]);
      console.log('✅ Published local tracks');

      setIsJoined(true);
      isJoiningRef.current = false; // ✅ Mark joining complete

      // If doctor, mark consultation as started
      if (role === 'doctor') {
        await agoraApiService.startConsultation(consultationId);
      }

      toast({
        title: 'Connected',
        description: 'You have joined the video consultation',
      });
    } catch (error: any) {
      console.error('❌ Error initializing Agora:', error);
      hasJoinedRef.current = false; // ✅ Reset on error
      isJoiningRef.current = false;
      
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to join video call',
        variant: 'destructive',
      });
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const leaveChannel = async () => {
    try {
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
        setLocalVideoTrack(null);
      }
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        setLocalAudioTrack(null);
      }
      if (client && isJoined) {
        await client.leave();
        setClient(null);
      }
      setIsJoined(false);
      setRemoteUsers([]);
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
      <div className="flex-1 flex items-center justify-center p-4 gap-4">
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
            </CardContent>
          </Card>
        )}

        {/* Local Video */}
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
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6 flex items-center justify-center gap-4">
        <Button
          size="lg"
          variant={isAudioEnabled ? 'default' : 'destructive'}
          onClick={toggleAudio}
          className="rounded-full w-14 h-14"
        >
          {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>

        <Button
          size="lg"
          variant={isVideoEnabled ? 'default' : 'destructive'}
          onClick={toggleVideo}
          className="rounded-full w-14 h-14"
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