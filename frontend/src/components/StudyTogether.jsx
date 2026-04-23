import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Link2, MessageCircle, Play, Send, Square, Users, X, PartyPopper, CheckCircle2, Video, VideoOff } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { useAuth } from './AuthContext';
import LofiPlayer from './LofiPlayer';

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.2 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.6);
    });
    setTimeout(() => {
      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.2);
      });
    }, 700);
  } catch (e) { /* ignore */ }
}

import { API_URL, WS_URL } from '../config';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function StudyTogether() {
  const { user } = useAuth();
  const [view, setView] = useState('lobby'); // lobby, room
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [customDuration, setCustomDuration] = useState(25);
  const [showPopup, setShowPopup] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({}); // { peerId: { stream, name, picture } }

  const stompRef = useRef(null);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const peersRef = useRef({}); // { peerId: RTCPeerConnection }
  const roomCodeRef = useRef('');

  const RTC_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── WebRTC helpers ───
  const sendSignal = useCallback((to, type, payload) => {
    if (!stompRef.current?.active || !roomCodeRef.current) return;
    stompRef.current.publish({
      destination: `/app/room/${roomCodeRef.current}/signal`,
      body: JSON.stringify({ from: user?.name, to, type, payload }),
    });
  }, [user]);

  const createPeer = useCallback((remoteName, initiator) => {
    if (peersRef.current[remoteName]) return peersRef.current[remoteName];

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peersRef.current[remoteName] = pc;

    // Add local tracks if camera is on
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => pc.addTrack(track, streamRef.current));
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams((prev) => ({
        ...prev,
        [remoteName]: { ...prev[remoteName], stream: remoteStream },
      }));
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(remoteName, 'ice-candidate', event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        closePeer(remoteName);
      }
    };

    // If initiator, create and send offer
    if (initiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => sendSignal(remoteName, 'offer', pc.localDescription))
        .catch(console.error);
    }

    return pc;
  }, [sendSignal]);

  const closePeer = useCallback((remoteName) => {
    const pc = peersRef.current[remoteName];
    if (pc) {
      pc.close();
      delete peersRef.current[remoteName];
    }
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[remoteName];
      return next;
    });
  }, []);

  const closeAllPeers = useCallback(() => {
    Object.keys(peersRef.current).forEach((name) => {
      peersRef.current[name].close();
    });
    peersRef.current = {};
    setRemoteStreams({});
  }, []);

  const handleSignalingMessage = useCallback((data) => {
    if (data.to !== user?.name) return; // not for us
    const { from, type, payload } = data;

    if (type === 'offer') {
      const pc = createPeer(from, false);
      pc.setRemoteDescription(new RTCSessionDescription(payload))
        .then(() => pc.createAnswer())
        .then((answer) => pc.setLocalDescription(answer))
        .then(() => sendSignal(from, 'answer', pc.localDescription))
        .catch(console.error);
    } else if (type === 'answer') {
      const pc = peersRef.current[from];
      if (pc) pc.setRemoteDescription(new RTCSessionDescription(payload)).catch(console.error);
    } else if (type === 'ice-candidate') {
      const pc = peersRef.current[from];
      if (pc) pc.addIceCandidate(new RTCIceCandidate(payload)).catch(console.error);
    } else if (type === 'camera-on') {
      // Remote user turned camera on, update their info
      setRemoteStreams((prev) => ({
        ...prev,
        [from]: { ...prev[from], name: payload.name, picture: payload.picture },
      }));
    } else if (type === 'camera-off') {
      closePeer(from);
    }
  }, [user, createPeer, sendSignal, closePeer]);

  // Camera toggle
  const toggleCamera = async () => {
    if (cameraOn) {
      // Turn off - notify peers and close connections
      participants.forEach((p) => {
        if (p.name !== user?.name) sendSignal(p.name, 'camera-off', {});
      });
      closeAllPeers();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
    } else {
      // Turn on - get media then connect to peers
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        setCameraOn(true);
        setTimeout(() => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        }, 50);
        // Notify other participants and initiate connections
        participants.forEach((p) => {
          if (p.name !== user?.name) {
            sendSignal(p.name, 'camera-on', { name: user.name, picture: user.picture });
            createPeer(p.name, true);
          }
        });
      } catch (err) {
        console.error('Camera access denied:', err);
      }
    }
  };

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      closeAllPeers();
    };
  }, [closeAllPeers]);

  // Connect WebSocket
  const connectWs = useCallback((code) => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe to chat
        client.subscribe(`/topic/room/${code}/chat`, (msg) => {
          const data = JSON.parse(msg.body);
          setMessages((prev) => [...prev, data]);
        });

        // Subscribe to timer
        client.subscribe(`/topic/room/${code}/timer`, (msg) => {
          const data = JSON.parse(msg.body);
          if (data.action === 'start') {
            setTimerActive(true);
            setTimeLeft(data.duration);
          } else if (data.action === 'stop') {
            setTimerActive(false);
          }
        });

        // Subscribe to participants
        client.subscribe(`/topic/room/${code}/participants`, (msg) => {
          const data = JSON.parse(msg.body);
          if (data.type === 'sync' && data.participants) {
            // Full participant list from server (new backend)
            setParticipants(data.participants.map(p => ({ name: p.name, picture: p.picture })));
            if (data.joinedName && data.joinedName !== user?.name) {
              setMessages((prev) => [...prev, { system: true, text: `${data.joinedName} joined the room` }]);
            }
          } else if (data.type === 'join') {
            // Legacy single join message (old backend fallback)
            setParticipants((prev) => {
              if (prev.find((p) => p.name === data.name)) return prev;
              return [...prev, { name: data.name, picture: data.picture }];
            });
            if (data.name !== user?.name) {
              setMessages((prev) => [...prev, { system: true, text: `${data.name} joined the room` }]);
            }
          } else if (data.type === 'leave') {
            setParticipants((prev) => prev.filter((p) => p.name !== data.name));
            setMessages((prev) => [...prev, { system: true, text: `${data.name} left the room` }]);
            closePeer(data.name);
          }
        });

        // Subscribe to WebRTC signaling
        client.subscribe(`/topic/room/${code}/signal`, (msg) => {
          const data = JSON.parse(msg.body);
          handleSignalingMessage(data);
        });

        // Announce join
        client.publish({
          destination: `/app/room/${code}/join`,
          body: JSON.stringify({ name: user.name, picture: user.picture }),
        });
      },
    });

    client.activate();
    stompRef.current = client;
    roomCodeRef.current = code;
  }, [user, handleSignalingMessage]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (stompRef.current?.active && roomCode) {
        stompRef.current.publish({
          destination: `/app/room/${roomCode}/leave`,
          body: JSON.stringify({ name: user?.name }),
        });
        stompRef.current.deactivate();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomCode, user]);

  // Timer countdown
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setTimerActive(false);
            clearInterval(timerRef.current);
            playBeep();
            setShowPopup(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [timerActive, timeLeft]);

  const createRoom = async () => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timerDuration: customDuration * 60 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRoomCode(data.roomCode);
      setRoomInfo(data);
      setTimeLeft(data.timerDuration);
      setParticipants([{ name: user.name, picture: user.picture }]);
      setView('room');
      connectWs(data.roomCode);
    } catch (err) {
      setError(err.message || 'Failed to create room');
    }
  };

  const joinRoom = async () => {
    setError('');
    const code = joinCode.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await fetch(`${API_URL}/rooms/${code}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRoomCode(code);
      setRoomInfo(data);
      setTimeLeft(data.timerDuration);
      setParticipants([{ name: user.name, picture: user.picture }]);
      setView('room');
      connectWs(code);
    } catch (err) {
      setError(err.message || 'Room not found');
    }
  };

  const startTimer = () => {
    if (!stompRef.current?.active) return;
    stompRef.current.publish({
      destination: `/app/room/${roomCode}/timer`,
      body: JSON.stringify({ action: 'start', duration: roomInfo?.timerDuration || 1500 }),
    });
  };

  const stopTimer = () => {
    if (!stompRef.current?.active) return;
    stompRef.current.publish({
      destination: `/app/room/${roomCode}/timer`,
      body: JSON.stringify({ action: 'stop' }),
    });
    setTimerActive(false);
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !stompRef.current?.active) return;
    stompRef.current.publish({
      destination: `/app/room/${roomCode}/chat`,
      body: JSON.stringify({ name: user.name, picture: user.picture, text: chatInput.trim() }),
    });
    setChatInput('');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?room=${roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveRoom = () => {
    if (stompRef.current?.active) {
      stompRef.current.publish({
        destination: `/app/room/${roomCode}/leave`,
        body: JSON.stringify({ name: user.name }),
      });
      stompRef.current.deactivate();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setView('lobby');
    setRoomCode('');
    setRoomInfo(null);
    setParticipants([]);
    setMessages([]);
    setTimerActive(false);
    setTimeLeft(0);
    // Stop camera & WebRTC
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    closeAllPeers();
    setCameraOn(false);
    roomCodeRef.current = '';
  };

  // ─── LOBBY VIEW ───
  if (view === 'lobby') {
    return (
      <section className="w-full min-w-0 space-y-6">
        <div className="flex flex-col justify-between gap-4 border-4 border-neo-black bg-white p-6 shadow-hard-lg sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-sm font-bold text-forest">Collaborate</p>
            <h1 className="mt-1 text-4xl font-black sm:text-6xl">Study together</h1>
          </div>
          <div className="flex w-fit items-center gap-2 border-4 border-neo-black bg-neo-green px-4 py-3 font-mono text-sm font-bold">
            <Users size={18} strokeWidth={2.5} aria-hidden="true" />
            Real-time
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create Room */}
          <div className="border-4 border-neo-black bg-white p-6 shadow-hard-lg">
            <h2 className="mb-4 text-2xl font-black">Create a room</h2>
            <p className="mb-6 font-mono text-sm font-bold text-neutral-600">
              Start a study session and invite friends with a code.
            </p>

            <div className="mb-4">
              <label className="mb-2 block font-mono text-sm font-bold">Timer (minutes)</label>
              <div className="grid grid-cols-[52px_1fr_52px] border-4 border-neo-black bg-white shadow-hard">
                <button
                  type="button"
                  onClick={() => setCustomDuration((d) => Math.max(d - 5, 5))}
                  className="flex min-h-12 items-center justify-center border-r-4 border-neo-black hover:bg-neo-yellow font-black text-xl"
                >
                  −
                </button>
                <div className="flex min-h-12 items-center justify-center font-mono text-lg font-black">
                  {customDuration} min
                </div>
                <button
                  type="button"
                  onClick={() => setCustomDuration((d) => Math.min(d + 5, 120))}
                  className="flex min-h-12 items-center justify-center border-l-4 border-neo-black hover:bg-neo-yellow font-black text-xl"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={createRoom}
              className="flex w-full items-center justify-center gap-3 border-4 border-neo-black bg-forest px-6 py-4 text-lg font-black text-white shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-neo-black hover:shadow-none"
            >
              <Link2 size={20} strokeWidth={2.5} aria-hidden="true" />
              Create Room
            </button>
          </div>

          {/* Join Room */}
          <div className="border-4 border-neo-black bg-white p-6 shadow-hard-lg">
            <h2 className="mb-4 text-2xl font-black">Join a room</h2>
            <p className="mb-6 font-mono text-sm font-bold text-neutral-600">
              Enter a room code shared by your study partner.
            </p>

            <input
              type="text"
              maxLength={6}
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="mb-4 w-full border-4 border-neo-black px-4 py-4 font-mono text-lg font-black uppercase shadow-hard-sm outline-none transition-colors focus:bg-neo-yellow/30 placeholder:text-gray-400 placeholder:normal-case"
            />

            <button
              type="button"
              onClick={joinRoom}
              disabled={!joinCode.trim()}
              className="flex w-full items-center justify-center gap-3 border-4 border-neo-black bg-neo-yellow px-6 py-4 text-lg font-black shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-white hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Users size={20} strokeWidth={2.5} aria-hidden="true" />
              Join Room
            </button>

            {error && (
              <div className="mt-4 border-4 border-neo-black bg-neo-red px-4 py-3 font-mono text-sm font-bold text-white">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ─── ROOM VIEW ───
  const progress = roomInfo ? ((roomInfo.timerDuration - timeLeft) / roomInfo.timerDuration) * 100 : 0;

  return (
    <section className="w-full min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-4 border-neo-black bg-white p-6 shadow-hard-lg sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-sm font-bold text-forest">Room</p>
          <h1 className="mt-1 text-3xl font-black sm:text-5xl">
            {roomCode}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyLink}
            className={`flex items-center gap-2 border-4 border-neo-black px-4 py-2 font-mono text-sm font-bold shadow-hard-sm transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
              copied ? 'bg-neo-green' : 'bg-white hover:bg-neo-yellow'
            }`}
          >
            <Copy size={16} strokeWidth={2.5} aria-hidden="true" />
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button
            type="button"
            onClick={toggleCamera}
            className={`flex items-center gap-2 border-4 border-neo-black px-4 py-2 font-mono text-sm font-bold shadow-hard-sm transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
              cameraOn ? 'bg-neo-green' : 'bg-white hover:bg-neo-yellow'
            }`}
          >
            {cameraOn ? <Video size={16} strokeWidth={2.5} /> : <VideoOff size={16} strokeWidth={2.5} />}
            {cameraOn ? 'Camera on' : 'Camera'}
          </button>
          <button
            type="button"
            onClick={leaveRoom}
            className="flex items-center gap-2 border-4 border-neo-black bg-neo-red px-4 py-2 font-mono text-sm font-bold text-white shadow-hard-sm transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            <X size={16} strokeWidth={2.5} aria-hidden="true" />
            Leave
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        {/* Timer + Participants */}
        <div className="space-y-6">
          {/* Timer */}
          <div className="border-4 border-neo-black bg-white p-6 shadow-hard-lg">
            <div className="text-center">
              <p className="mb-2 font-mono text-sm font-bold uppercase text-neutral-600">
                {timerActive ? 'Focus in progress' : timeLeft === 0 ? 'Session complete!' : 'Ready to start'}
              </p>
              <div className="font-mono text-7xl font-black sm:text-8xl">{formatTime(timeLeft)}</div>

              {/* Progress bar */}
              <div className="mx-auto mt-6 h-4 w-full border-4 border-neo-black">
                <div
                  className="h-full bg-forest transition-all duration-1000"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>

              <div className="mt-6">
                {!timerActive && timeLeft > 0 && (
                  <button
                    type="button"
                    onClick={startTimer}
                    className="flex w-full items-center justify-center gap-3 border-4 border-neo-black bg-forest px-6 py-4 text-lg font-black text-white shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-neo-black hover:shadow-none"
                  >
                    <Play size={20} fill="currentColor" aria-hidden="true" />
                    Start Focus
                  </button>
                )}
                {timerActive && (
                  <button
                    type="button"
                    onClick={stopTimer}
                    className="flex w-full items-center justify-center gap-3 border-4 border-neo-black bg-neo-red px-6 py-4 text-lg font-black text-white shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:bg-neo-black hover:shadow-none"
                  >
                    <Square size={20} fill="currentColor" aria-hidden="true" />
                    Stop
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="border-4 border-neo-black bg-white p-6 shadow-hard-lg">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black">
              <Users size={20} strokeWidth={2.5} aria-hidden="true" />
              Participants ({participants.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {participants.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-2 border-4 border-neo-black bg-neo-white px-3 py-2 font-mono text-sm font-bold shadow-hard-sm"
                >
                  {p.picture ? (
                    <img src={p.picture} alt={p.name} className="h-6 w-6 rounded-full border border-neo-black" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neo-green text-xs font-black">
                      {p.name?.charAt(0)}
                    </div>
                  )}
                  {p.name}
                </div>
              ))}
            </div>
          </div>

          {/* Ambient sounds */}
          <LofiPlayer />
        </div>

        {/* Chat */}
        <div className="flex flex-col border-4 border-neo-black bg-white shadow-hard-lg" style={{ height: '500px' }}>
          <div className="border-b-4 border-neo-black px-6 py-4">
            <h3 className="flex items-center gap-2 text-lg font-black">
              <MessageCircle size={20} strokeWidth={2.5} aria-hidden="true" />
              Chat
            </h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center font-mono text-sm font-bold text-neutral-400">
                No messages yet. Say hi! 👋
              </p>
            )}
            {messages.map((msg, i) => {
              if (msg.system) {
                return (
                  <div key={i} className="text-center font-mono text-xs font-bold text-neutral-400">
                    {msg.text}
                  </div>
                );
              }
              const isMe = msg.name === user?.name;
              return (
                <div key={i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {msg.picture ? (
                    <img src={msg.picture} alt={msg.name} className="h-7 w-7 shrink-0 rounded-full border border-neo-black" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neo-green text-xs font-black border border-neo-black">
                      {msg.name?.charAt(0)}
                    </div>
                  )}
                  <div className={`max-w-[75%] border-2 border-neo-black px-3 py-2 ${
                    isMe ? 'bg-neo-green' : 'bg-neo-yellow'
                  }`}>
                    <p className="font-mono text-xs font-bold text-neutral-600">{msg.name}</p>
                    <p className="text-sm font-bold">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <form onSubmit={sendChat} className="flex border-t-4 border-neo-black">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 font-mono text-sm font-bold outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="flex items-center justify-center border-l-4 border-neo-black bg-forest px-5 text-white transition-colors hover:bg-neo-black disabled:opacity-50"
            >
              <Send size={18} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      {/* Completion Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neo-black/60 backdrop-blur-sm" onClick={() => setShowPopup(false)}>
          <div
            className="relative mx-4 w-full max-w-md animate-bounce-in border-4 border-neo-black bg-white p-8 shadow-hard-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-3 -left-3 h-6 w-6 border-4 border-neo-black bg-neo-green" />
            <div className="absolute -top-3 -right-3 h-6 w-6 border-4 border-neo-black bg-neo-yellow" />
            <div className="absolute -bottom-3 -left-3 h-6 w-6 border-4 border-neo-black bg-neo-yellow" />
            <div className="absolute -bottom-3 -right-3 h-6 w-6 border-4 border-neo-black bg-neo-green" />

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center border-4 border-neo-black bg-neo-green shadow-hard">
                <PartyPopper size={40} strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black">Study Session Complete!</h2>
              <p className="font-mono text-sm font-bold text-gray-600">
                Great focus session with your study group!
              </p>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="flex w-full items-center justify-center gap-2 border-4 border-neo-black bg-neo-yellow px-5 py-3 font-black shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                <CheckCircle2 size={18} strokeWidth={2.5} />
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Camera feeds - fixed right side. Show whenever local camera is on OR there are remote streams */}
      {(cameraOn || Object.keys(remoteStreams).length > 0) && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse gap-3" style={{ width: '220px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          {/* Local video - only when local camera is on */}
          {cameraOn && (
            <div className="border-4 border-neo-black bg-neo-black shadow-hard-lg overflow-hidden">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-[4/3] object-cover bg-black"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 border-2 border-white/20 bg-black/60 backdrop-blur-sm px-2 py-0.5">
                  <div className="h-2 w-2 rounded-full bg-neo-green animate-pulse" />
                  <span className="font-mono text-[10px] font-bold text-white/80">YOU</span>
                </div>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center border-2 border-white/20 bg-black/60 text-white/80 backdrop-blur-sm transition-colors hover:bg-neo-red hover:text-white"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neo-black">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="h-4 w-4 rounded-full border border-white/20" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-neo-green text-[7px] font-black">
                    {user?.name?.charAt(0)}
                  </div>
                )}
                <span className="font-mono text-[11px] font-bold text-white/80 truncate">{user?.name}</span>
              </div>
            </div>
          )}

          {/* Remote video feeds - ALWAYS show when available, even if local camera is off */}
          {Object.entries(remoteStreams).map(([peerId, info]) => (
            <RemoteVideoCard key={peerId} peerId={peerId} info={info} />
          ))}
        </div>
      )}
    </section>
  );
}

// Separate component to properly attach remote stream to video element
function RemoteVideoCard({ peerId, info }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && info.stream) {
      ref.current.srcObject = info.stream;
    }
  }, [info.stream]);

  return (
    <div className="border-4 border-neo-black bg-neo-black shadow-hard-lg overflow-hidden">
      <div className="relative">
        <video
          ref={ref}
          autoPlay
          playsInline
          className="w-full aspect-[4/3] object-cover bg-black"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1.5 border-2 border-white/20 bg-black/60 backdrop-blur-sm px-2 py-0.5">
          <div className="h-2 w-2 rounded-full bg-neo-yellow animate-pulse" />
          <span className="font-mono text-[10px] font-bold text-white/80">LIVE</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-neo-black">
        {info.picture ? (
          <img src={info.picture} alt={info.name || peerId} className="h-4 w-4 rounded-full border border-white/20" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-neo-green text-[7px] font-black">
            {(info.name || peerId)?.charAt(0)}
          </div>
        )}
        <span className="font-mono text-[11px] font-bold text-white/80 truncate">{info.name || peerId}</span>
      </div>
    </div>
  );
}
