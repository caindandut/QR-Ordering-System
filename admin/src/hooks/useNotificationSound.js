export const useNotificationSound = () => {
  const play = () => {
    const audio = new Audio('/sounds/notification.mp3');
    
    audio.play().catch(() => {
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
      
      const notes = [523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        const startTime = now + (index * 0.1);
        const duration = 0.3;
        
        gainNode.gain.setValueAtTime(0.0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });

    } catch {
    }
  };

  return { play };
};
