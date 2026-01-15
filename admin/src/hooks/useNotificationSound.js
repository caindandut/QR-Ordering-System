export const useNotificationSound = () => {
  const play = () => {
    // Ưu tiên 1: Chơi file MP3 nếu có (User yêu cầu)
    const audio = new Audio('/sounds/notification.mp3');
    
    audio.play().catch(() => {
      // Ưu tiên 2: Fallback sang Web Audio API (Melody dễ chịu hơn)
      playFallbackMelody();
    });
  };

  const playFallbackMelody = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const now = audioContext.currentTime;
      
      // Tạo melody: C5 - E5 - G5 - C6 (Arpeggio tươi vui)
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        const startTime = now + (index * 0.1); // Cách nhau 100ms
        const duration = 0.3;
        
        gainNode.gain.setValueAtTime(0.0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05); // Fade in
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // Fade out
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });

    } catch {
      // Ignore fallback sound error to avoid console noise
    }
  };

  return { play };
};
