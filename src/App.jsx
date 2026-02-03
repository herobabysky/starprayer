import React, { useState, useRef, useEffect } from 'react';
import { database, ref, push, onValue } from './firebase';

const DuaPrayerApp = () => {
  const [prayer, setPrayer] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showBlessing, setShowBlessing] = useState(false);
  const [particles, setParticles] = useState([]);
  const [showAmin, setShowAmin] = useState(false);
  const [aminPosition, setAminPosition] = useState({ x: 0, y: 0 });
  const [hasSubmittedFirst, setHasSubmittedFirst] = useState(false);
  const [tappedStar, setTappedStar] = useState(null);
  const [duaStars, setDuaStars] = useState([]);
  const [hoveredStar, setHoveredStar] = useState(null);
  const [totalDuas, setTotalDuas] = useState(0);
  const [showInputModal, setShowInputModal] = useState(false);
  const [draggedStar, setDraggedStar] = useState(null);
  const [starPositions, setStarPositions] = useState({});
  const [dragStartPos, setDragStartPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);

  const DRAG_THRESHOLD = 8; // pixels - if moved less than this, it's a tap

  // Load duas from Firebase on mount - real-time listener
  useEffect(() => {
    const duasRef = ref(database, 'duas');

    const unsubscribe = onValue(duasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const duasArray = Object.entries(data).map(([key, value], index) => ({
          id: key,
          text: value.text,
          timestamp: value.timestamp,
          x: value.x || (hashCode(key) % 80) + 5,
          y: value.y || ((hashCode(key) * 7) % 40) + 5,
          size: value.size || ((hashCode(key) * 3) % 8) + 14,
          delay: (index * 0.1) % 3
        }));
        setDuaStars(duasArray);
        setTotalDuas(duasArray.length);
      } else {
        setDuaStars([]);
        setTotalDuas(0);
      }
    });

    return () => unsubscribe();
  }, []);

  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const blessings = [
    "May Allah bless you and grant you ease",
    "May your dua reach the heavens",
    "May Allah answer your prayers with what is best for you",
    "May peace and barakah fill your heart",
    "May Allah grant you patience and reward"
  ];

  const [currentBlessing, setCurrentBlessing] = useState(blessings[0]);

  const createParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 25; i++) {
      newParticles.push({
        id: i,
        x: 25 + Math.random() * 50,
        delay: Math.random() * 0.8,
        duration: 2.5 + Math.random() * 2,
        size: 3 + Math.random() * 5,
        opacity: 0.4 + Math.random() * 0.6
      });
    }
    setParticles(newParticles);
  };

  const handleSend = async () => {
    if (!prayer.trim()) return;

    setIsSending(true);
    setShowInputModal(false);
    createParticles();
    setCurrentBlessing(blessings[Math.floor(Math.random() * blessings.length)]);

    try {
      const duasRef = ref(database, 'duas');
      await push(duasRef, {
        text: prayer.trim(),
        timestamp: Date.now(),
        x: 5 + Math.random() * 80,
        y: 5 + Math.random() * 40,
        size: 14 + Math.random() * 8
      });
    } catch (error) {
      console.error('Error saving dua:', error);
    }

    setTimeout(() => {
      setShowBlessing(true);
    }, 1500);

    setTimeout(() => {
      setIsSending(false);
      setShowBlessing(false);
      setPrayer('');
      setParticles([]);
      setHasSubmittedFirst(true);
    }, 5500);
  };

  const handleStarTap = (star, rect) => {
    if (tappedStar === star.id) {
      // Second tap - say Amin
      setAminPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
      setShowAmin(true);
      setTappedStar(null);
      setHoveredStar(null);
      setTimeout(() => setShowAmin(false), 2000);
    } else {
      // First tap - show tooltip
      setTappedStar(star.id);
      setHoveredStar(star.id);
      setTimeout(() => {
        setTappedStar(prev => prev === star.id ? null : prev);
        setHoveredStar(prev => prev === star.id ? null : prev);
      }, 5000);
    }
  };

  // Drag handlers for stars - with tap detection
  const handlePointerDown = (e, star) => {
    e.stopPropagation();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    setDraggedStar(star.id);
    setDragStartPos({ x: clientX, y: clientY, starId: star.id });
    setIsDragging(false);
  };

  const handlePointerMove = (e) => {
    if (!draggedStar || !dragStartPos) return;

    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

    // Calculate distance moved
    const dx = clientX - dragStartPos.x;
    const dy = clientY - dragStartPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only start actual dragging if moved past threshold
    if (distance > DRAG_THRESHOLD) {
      setIsDragging(true);
      setHoveredStar(null);
      setTappedStar(null);

      e.preventDefault();

      const newX = (clientX / window.innerWidth) * 100;
      const newY = (clientY / window.innerHeight) * 100;

      setStarPositions(prev => ({
        ...prev,
        [draggedStar]: { x: Math.max(2, Math.min(95, newX)), y: Math.max(2, Math.min(70, newY)) }
      }));
    }
  };

  const handlePointerUp = (e) => {
    if (!draggedStar) return;

    // If we didn't actually drag (just tapped), trigger tap action
    if (!isDragging && dragStartPos) {
      const starData = duaStars.find(s => s.id === draggedStar);
      if (starData) {
        // Get the star element's rect
        const starElement = document.querySelector(`[data-star-id="${draggedStar}"]`);
        if (starElement) {
          const rect = starElement.getBoundingClientRect();
          handleStarTap(starData, rect);
        }
      }
    }

    setDraggedStar(null);
    setDragStartPos(null);
    setIsDragging(false);
  };

  const handleBackgroundClick = () => {
    setTappedStar(null);
    setHoveredStar(null);
  };

  const getStarPosition = (star) => {
    if (starPositions[star.id]) {
      return starPositions[star.id];
    }
    return { x: star.x, y: star.y };
  };

  const StarShape = ({ size, isHovered, isDragging }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="url(#starGradient)"
      style={{
        filter: isHovered || isDragging
          ? 'drop-shadow(0 0 12px rgba(251,191,36,0.8)) drop-shadow(0 0 25px rgba(251,191,36,0.5))'
          : 'drop-shadow(0 0 6px rgba(251,191,36,0.6)) drop-shadow(0 0 12px rgba(251,191,36,0.3))',
        transition: isDragging ? 'none' : 'all 0.3s ease',
        transform: isHovered ? 'scale(1.3)' : 'scale(1)',
        cursor: 'grab'
      }}
    >
      <defs>
        <radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="40%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <path d="M12 2L14.09 8.26L20.18 8.63L15.54 12.74L16.91 19.37L12 16.27L7.09 19.37L8.46 12.74L3.82 8.63L9.91 8.26L12 2Z" />
    </svg>
  );

  return (
    <div
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      onClick={handleBackgroundClick}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >

      {/* Star Counter */}
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2 px-3 py-2 rounded-full"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,27,75,0.9) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(251,191,36,0.3)',
        }}
      >
        <span className="text-amber-400 text-lg">⭐</span>
        <span className="text-amber-100 text-sm font-light">{totalDuas} duas</span>
      </div>

      {/* Drag hint - show briefly */}
      {hasSubmittedFirst && !showInputModal && (
        <div className="fixed top-4 left-4 z-30 px-3 py-2 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,27,75,0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}
        >
          <span className="text-amber-100/70 text-xs font-light">✨ Drag stars to move them</span>
        </div>
      )}

      {/* Animated Galaxy Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950" />

        <div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] sm:w-[800px] sm:h-[800px]"
          style={{
            transform: 'translate(-50%, -50%)',
            animation: 'rotateGalaxy 120s linear infinite'
          }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `
                conic-gradient(
                  from 0deg,
                  transparent 0deg,
                  rgba(99, 102, 241, 0.15) 30deg,
                  transparent 60deg,
                  rgba(139, 92, 246, 0.1) 90deg,
                  transparent 120deg,
                  rgba(99, 102, 241, 0.12) 150deg,
                  transparent 180deg,
                  rgba(168, 85, 247, 0.08) 210deg,
                  transparent 240deg,
                  rgba(99, 102, 241, 0.15) 270deg,
                  transparent 300deg,
                  rgba(139, 92, 246, 0.1) 330deg,
                  transparent 360deg
                )
              `,
              filter: 'blur(40px)'
            }}
          />

          <div
            className="absolute top-1/2 left-1/2 w-[150px] h-[150px] sm:w-[300px] sm:h-[300px] rounded-full"
            style={{
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(139,92,246,0.1) 40%, transparent 70%)',
              filter: 'blur(30px)',
              animation: 'pulseCore 8s ease-in-out infinite'
            }}
          />
        </div>

        <div
          className="absolute top-[20%] left-[5%] w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'floatNebula1 25s ease-in-out infinite'
          }}
        />
        <div
          className="absolute bottom-[20%] right-[5%] w-[175px] h-[175px] sm:w-[350px] sm:h-[350px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'floatNebula2 30s ease-in-out infinite'
          }}
        />
        <div
          className="absolute top-[60%] left-[60%] w-[125px] h-[125px] sm:w-[250px] sm:h-[250px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)',
            filter: 'blur(30px)',
            animation: 'floatNebula3 20s ease-in-out infinite'
          }}
        />

        {/* Small decorative stars */}
        {[...Array(50)].map((_, i) => (
          <div
            key={`bg-star-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: Math.random() * 1.5 + 0.5 + 'px',
              height: Math.random() * 1.5 + 0.5 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              backgroundColor: '#ffffff',
              opacity: Math.random() * 0.4 + 0.1,
              animation: `twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: Math.random() * 3 + 's'
            }}
          />
        ))}

        {/* DUA STARS - Draggable */}
        {duaStars.map((star) => {
          const pos = getStarPosition(star);
          const starIsDragging = isDragging && draggedStar === star.id;
          return (
            <div
              key={star.id}
              data-star-id={star.id}
              className="absolute cursor-grab active:cursor-grabbing"
              style={{
                top: pos.y + '%',
                left: pos.x + '%',
                zIndex: starIsDragging ? 100 : (hoveredStar === star.id ? 50 : 20),
                animation: starIsDragging ? 'none' : `duaStarTwinkle ${2 + star.delay}s ease-in-out infinite`,
                animationDelay: star.delay + 's',
                padding: '12px',
                margin: '-12px',
                touchAction: 'none',
                userSelect: 'none'
              }}
              onMouseEnter={() => !isDragging && setHoveredStar(star.id)}
              onMouseLeave={() => {
                if (!isDragging && tappedStar !== star.id) setHoveredStar(null);
              }}
              onMouseDown={(e) => handlePointerDown(e, star)}
              onTouchStart={(e) => handlePointerDown(e, star)}
            >
              <div
                className="absolute rounded-full transition-all duration-300"
                style={{
                  width: star.size * 2.5 + 'px',
                  height: star.size * 2.5 + 'px',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: hoveredStar === star.id || starIsDragging
                    ? 'radial-gradient(circle, rgba(251,191,36,0.5) 0%, rgba(251,191,36,0.2) 40%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 60%)',
                  filter: 'blur(4px)',
                  opacity: hoveredStar === star.id || starIsDragging ? 1 : 0.7
                }}
              />

              <div className="relative transition-all duration-300">
                <StarShape size={star.size} isHovered={hoveredStar === star.id} isDragging={starIsDragging} />
              </div>

              {/* Tooltip - improved positioning */}
              {hoveredStar === star.id && !starIsDragging && (
                <div
                  className="absolute z-50 pointer-events-none"
                  style={{
                    bottom: pos.y > 30 ? '100%' : 'auto',
                    top: pos.y <= 30 ? '100%' : 'auto',
                    left: '50%',
                    transform: `translateX(${pos.x > 70 ? '-80%' : pos.x < 30 ? '-20%' : '-50%'})`,
                    marginBottom: pos.y > 30 ? '12px' : '0',
                    marginTop: pos.y <= 30 ? '12px' : '0',
                    animation: 'tooltipFadeIn 0.3s ease-out'
                  }}
                >
                  <div
                    className="relative px-4 py-3 rounded-xl text-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,27,75,0.98) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(251,191,36,0.3)',
                      boxShadow: '0 0 30px 5px rgba(251,191,36,0.15)',
                      minWidth: '180px',
                      maxWidth: '280px'
                    }}
                  >
                    <p className="text-amber-100 text-sm font-light leading-relaxed whitespace-pre-wrap">
                      "{star.text}"
                    </p>
                    <p className="text-amber-400/60 text-xs mt-2">
                      {tappedStar === star.id ? 'Tap again to say Amin' : 'Tap to say Amin'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Shooting stars */}
        <div
          className="absolute w-1 h-1 bg-white rounded-full hidden sm:block"
          style={{
            top: '15%',
            left: '80%',
            boxShadow: '0 0 6px 2px rgba(255,255,255,0.6)',
            animation: 'shootingStar1 8s ease-in-out infinite',
            animationDelay: '2s'
          }}
        />
        <div
          className="absolute w-1 h-1 bg-white rounded-full hidden sm:block"
          style={{
            top: '25%',
            left: '60%',
            boxShadow: '0 0 6px 2px rgba(255,255,255,0.6)',
            animation: 'shootingStar2 12s ease-in-out infinite',
            animationDelay: '6s'
          }}
        />
      </div>

      {/* Amin popup */}
      {showAmin && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: aminPosition.x,
            top: aminPosition.y,
            transform: 'translate(-50%, -50%)',
            animation: 'aminPopup 2s ease-out forwards'
          }}
        >
          <div
            className="px-4 py-3 sm:px-6 sm:py-4 rounded-2xl text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,27,75,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(251,191,36,0.4)',
              boxShadow: '0 0 40px 10px rgba(251,191,36,0.25)'
            }}
          >
            <p className="text-amber-300 text-xl sm:text-2xl font-light tracking-wider">آمين</p>
            <p className="text-amber-100/80 text-xs sm:text-sm mt-1 font-light">Amin</p>
          </div>
        </div>
      )}


      {/* Rising light animation */}
      {isSending && (
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 bottom-1/3 w-2 rounded-full"
            style={{
              transform: 'translateX(-50%)',
              height: '0%',
              background: 'linear-gradient(to top, rgba(251,191,36,0.9), rgba(251,191,36,0.4), transparent)',
              boxShadow: '0 0 30px 10px rgba(251,191,36,0.3)',
              animation: 'riseLight 2.5s ease-out forwards'
            }}
          />

          <div
            className="absolute left-1/2 bottom-1/3 w-24 h-24 sm:w-40 sm:h-40 rounded-full"
            style={{
              transform: 'translate(-50%, 50%)',
              background: 'radial-gradient(circle, rgba(251,191,36,0.5) 0%, rgba(251,191,36,0.2) 30%, transparent 70%)',
              animation: 'expandGlow 2.5s ease-out forwards'
            }}
          />

          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: p.x + '%',
                bottom: '35%',
                width: p.size + 'px',
                height: p.size + 'px',
                background: 'radial-gradient(circle, rgba(251,191,36,1) 0%, rgba(251,191,36,0.5) 50%, transparent 100%)',
                boxShadow: '0 0 10px 2px rgba(251,191,36,0.4)',
                opacity: 0,
                animation: `floatUp ${p.duration}s ease-out ${p.delay}s forwards`
              }}
            />
          ))}
        </div>
      )}

      {/* FIRST TIME: Centered input */}
      {!hasSubmittedFirst && !isSending && (
        <div
          className="relative z-10 w-full max-w-sm sm:max-w-md px-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-block mb-2 sm:mb-3">
              <span className="text-4xl sm:text-5xl" style={{ filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.3))' }}>🤲🏼</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light text-white tracking-wider mb-2">Dua</h1>
            <p className="text-slate-400 text-xs sm:text-sm font-light tracking-wide">Send your prayers to the heavens</p>
            <p className="text-slate-500 text-xs font-light tracking-wide mt-1">Tap on stars to read duas from others</p>
          </div>

          <div
            className="backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl p-4 sm:p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,27,75,0.6) 100%)'
            }}
          >
            <textarea
              ref={textareaRef}
              value={prayer}
              onChange={(e) => setPrayer(e.target.value)}
              placeholder="Write your dua here..."
              className="w-full bg-transparent text-white placeholder-slate-500 font-light leading-relaxed resize-none focus:outline-none h-28 sm:h-40 text-base sm:text-lg"
              style={{ direction: 'auto' }}
            />

            <div className="flex justify-between items-center border-t border-slate-700/50 mt-3 pt-3 sm:mt-4 sm:pt-4">
              <span className="text-slate-500 text-xs font-light tracking-wide">
                {prayer.length > 0 ? `${prayer.length}` : ''}
              </span>

              <button
                onClick={handleSend}
                disabled={!prayer.trim()}
                className={`rounded-full font-light text-xs sm:text-sm tracking-wide transition-all duration-300 px-4 py-2 sm:px-6 sm:py-2.5 ${
                  prayer.trim()
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500 active:scale-95 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-1.5 sm:gap-2">
                  Send Dua
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <p className="text-center text-slate-600 text-xs mt-6 sm:mt-8 font-light tracking-wide leading-relaxed px-4">
            "And your Lord says, 'Call upon Me; I will respond to you.'"
            <br />
            <span className="text-slate-500">— Quran 40:60</span>
          </p>
        </div>
      )}

      {/* AFTER FIRST SEND: Plus button in bottom left */}
      {hasSubmittedFirst && !showInputModal && !isSending && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowInputModal(true);
          }}
          className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,1) 0%, rgba(245,158,11,1) 100%)',
            boxShadow: '0 0 30px 5px rgba(251,191,36,0.4), 0 4px 15px rgba(0,0,0,0.3)'
          }}
        >
          <svg className="w-7 h-7 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Modal for adding new dua */}
      {showInputModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInputModal(false)}
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'scaleIn 0.3s ease-out' }}
          >
            <div
              className="backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl p-4 sm:p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,27,75,0.9) 100%)'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤲🏼</span>
                  <span className="text-white text-sm font-light">New Dua</span>
                </div>
                <button
                  onClick={() => setShowInputModal(false)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <textarea
                autoFocus
                value={prayer}
                onChange={(e) => setPrayer(e.target.value)}
                placeholder="Write your dua here..."
                className="w-full bg-transparent text-white placeholder-slate-500 font-light leading-relaxed resize-none focus:outline-none h-24 text-sm"
                style={{ direction: 'auto' }}
              />

              <div className="flex justify-end mt-3 pt-3 border-t border-slate-700/50">
                <button
                  onClick={handleSend}
                  disabled={!prayer.trim()}
                  className={`rounded-full font-light text-xs tracking-wide transition-all duration-300 px-4 py-2 ${
                    prayer.trim()
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-400 hover:to-amber-500 active:scale-95 shadow-lg shadow-amber-500/30'
                      : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    Send
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blessing popup */}
      {showBlessing && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ animation: 'fadeIn 0.6s ease-out' }}
        >
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          />
          <div
            className="relative backdrop-blur-md border border-amber-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-xs sm:max-w-sm mx-4 text-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,27,75,0.9) 100%)',
              boxShadow: '0 0 60px 20px rgba(251,191,36,0.15)',
              animation: 'scaleIn 0.6s ease-out'
            }}
          >
            <div
              className="text-5xl sm:text-6xl mb-4 sm:mb-6"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(251,191,36,0.5))',
                animation: 'gentlePulse 2s ease-in-out infinite'
              }}
            >
              🤲🏼
            </div>
            <p className="text-amber-100 text-lg sm:text-xl font-light leading-relaxed tracking-wide">
              {currentBlessing}
            </p>
            <p className="text-amber-400/70 text-base sm:text-lg mt-4 sm:mt-5 font-light">آمين</p>
            <p className="text-slate-500 text-xs mt-3 sm:mt-4 font-light">Your dua is now a star in the sky ✨</p>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes rotateGalaxy {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes pulseCore {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }

        @keyframes floatNebula1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          33% { transform: translate(30px, -20px) scale(1.1); opacity: 0.4; }
          66% { transform: translate(-20px, 30px) scale(0.95); opacity: 0.25; }
        }

        @keyframes floatNebula2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.25; }
          50% { transform: translate(-40px, -30px) scale(1.15); opacity: 0.35; }
        }

        @keyframes floatNebula3 {
          0%, 100% { transform: translate(0, 0); opacity: 0.2; }
          50% { transform: translate(25px, 25px); opacity: 0.3; }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }

        @keyframes duaStarTwinkle {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        @keyframes shootingStar1 {
          0% { transform: translate(0, 0); opacity: 0; }
          5% { opacity: 1; }
          15% { transform: translate(-150px, 100px); opacity: 0; }
          100% { transform: translate(-150px, 100px); opacity: 0; }
        }

        @keyframes shootingStar2 {
          0% { transform: translate(0, 0); opacity: 0; }
          5% { opacity: 1; }
          12% { transform: translate(-120px, 80px); opacity: 0; }
          100% { transform: translate(-120px, 80px); opacity: 0; }
        }

        @keyframes riseLight {
          0% { height: 0%; opacity: 1; }
          70% { opacity: 1; }
          100% { height: 100%; opacity: 0; }
        }

        @keyframes expandGlow {
          0% { transform: translate(-50%, 50%) scale(1); opacity: 0.8; }
          50% { transform: translate(-50%, 0%) scale(1.8); opacity: 0.5; }
          100% { transform: translate(-50%, -150%) scale(0.3); opacity: 0; }
        }

        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-500px) scale(0.3); opacity: 0; }
        }

        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @keyframes scaleIn {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes tooltipFadeIn {
          0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @keyframes aminPopup {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          30% { transform: translate(-50%, -50%) scale(1); }
          70% { opacity: 1; transform: translate(-50%, -60%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -80%) scale(0.8); }
        }
      `}</style>
    </div>
  );
};

export default DuaPrayerApp;
