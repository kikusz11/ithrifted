import React, { useState, useEffect, useRef } from 'react'; // useRef hozzáadva a timer tisztításához

// A DropTimer komponens most propokat fogad el:
// - targetDate: Az ISO string dátum/idő, amiig számolni kell (pl. a drop kezdete vagy vége).
// - dropName: A drop esemény neve (opcionális).
// - showClosing: Ha true, akkor "A bolt bezár:", ha false, akkor "A bolt nyit:".
const DropTimer = ({ targetDate, dropName = 'Drop', showClosing = false }) => {
  const timerIntervalRef = useRef(null); // Ref a setInterval ID tárolására

  const calculateTimeLeft = () => {
    const now = new Date().getTime(); // Aktuális idő milliszekundumban
    const target = new Date(targetDate).getTime(); // Céldátum milliszekundumban
    const difference = target - now;

    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60)) % 60,
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      // Ha a visszaszámlálás lejárt, minden nulla
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Első futáskor azonnal frissítjük
    setTimeLeft(calculateTimeLeft());

    // Elindítjuk az időzítőt, ami másodpercenként frissít
    timerIntervalRef.current = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // Ha az időzítő lejárt, leállítjuk az intervallumot
      const isFinished = Object.values(newTimeLeft).every(val => val === 0);
      if (isFinished && timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }, 1000);

    // Tisztítás függvény: töröljük az intervallumot, amikor a komponens unmountol
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [targetDate]); // A targetDate változásra is reagál, ha az megváltozna

  // Időformázó segédfüggvény (HH:MM:SS formátum)
  const formatTime = (timeObj) => {
    const parts = [];
    if (timeObj.days > 0) {
      parts.push(`${timeObj.days} nap`);
    }
    // Csak akkor jelenítsük meg, ha van érték, vagy ha ez az utolsó rész
    if (timeObj.hours > 0 || parts.length > 0) {
      parts.push(`${String(timeObj.hours).padStart(2, '0')} óra`);
    }
    if (timeObj.minutes > 0 || parts.length > 0) {
      parts.push(`${String(timeObj.minutes).padStart(2, '0')} perc`);
    }
    parts.push(`${String(timeObj.seconds).padStart(2, '0')} másodperc`);

    return parts.join(' ');
  };

  const isTimerFinished = Object.values(timeLeft).every(val => val === 0);

  if (isTimerFinished) {
    return (
      <div className="text-center p-4 text-green-700">
        <p className="text-xl font-semibold">A {dropName} esemény megkezdődött/lezárult!</p>
      </div>
    );
  }

  return (
    <div className="text-center p-4 mb-8 bg-blue-50 border border-blue-200 rounded-lg shadow-md">
      <p className="text-lg font-semibold mb-2">
        {showClosing ? `A(z) ${dropName} bezár: ` : `A(z) ${dropName} nyit: `}
      </p>
      <div className="flex justify-center flex-wrap">
        <span className="text-4xl md:text-5xl font-extrabold text-blue-600">
          {formatTime(timeLeft)}
        </span>
      </div>
    </div>
  );
};

export default DropTimer;