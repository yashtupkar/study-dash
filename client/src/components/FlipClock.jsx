import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const FlipDigit = ({ digit }) => {
  const [current, setCurrent] = useState(digit);
  const [previous, setPrevious] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (digit !== current) {
      setPrevious(current);
      setCurrent(digit);
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setIsFlipping(false);
      }, 500); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [digit, current]);

  return (
    <div className="flip-card">
      {/* Static Top (new/current digit) */}
      <div className="flip-card-half flip-card-top">
        <div className="flip-card-text-inner">
          <span>{current}</span>
        </div>
      </div>

      {/* Static Bottom (old/previous digit) */}
      <div className="flip-card-half flip-card-bottom">
        <div className="flip-card-text-inner">
          <span>{previous}</span>
        </div>
      </div>

      {/* Flipping Top (old/previous digit) */}
      {isFlipping && (
        <div className="flip-card-half flip-card-top flip-animate-top">
          <div className="flip-card-text-inner">
            <span>{previous}</span>
          </div>
        </div>
      )}

      {/* Flipping Bottom (new/current digit) */}
      {isFlipping && (
        <div className="flip-card-half flip-card-bottom flip-animate-bottom">
          <div className="flip-card-text-inner">
            <span>{current}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function FlipClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden h-full min-h-[180px]">
      <style>{`
        .flip-clock-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .flip-unit-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .flip-digits-group {
          display: flex;
          gap: 3px;
        }

        .flip-card {
          position: relative;
          width: 32px;
          height: 48px;
          perspective: 150px;
          border-radius: 4px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
        }

        @media (min-width: 380px) {
          .flip-card {
            width: 36px;
            height: 54px;
            perspective: 200px;
            border-radius: 5px;
          }
        }

        @media (min-width: 640px) {
          .flip-card {
            width: 42px;
            height: 64px;
            perspective: 300px;
            border-radius: 6px;
          }
        }

        .flip-card-half {
          position: absolute;
          left: 0;
          width: 100%;
          height: 50%;
          overflow: hidden;
          backface-visibility: hidden;
          background-color: #18181b;
        }

        .flip-card-top {
          top: 0;
          border-top-left-radius: inherit;
          border-top-right-radius: inherit;
          border-bottom: 0.5px solid rgba(0, 0, 0, 0.6);
          transform-origin: bottom;
          background: linear-gradient(to bottom, #27272a, #18181b);
        }

        .flip-card-bottom {
          bottom: 0;
          border-bottom-left-radius: inherit;
          border-bottom-right-radius: inherit;
          border-top: 0.5px solid rgba(255, 255, 255, 0.05);
          transform-origin: top;
          background: linear-gradient(to bottom, #18181b, #09090b);
        }

        .flip-card-text-inner {
          position: absolute;
          left: 0;
          width: 100%;
          height: 200%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-family: 'Space Grotesk', 'Outfit', sans-serif;
          font-weight: 700;
          text-align: center;
        }

        .flip-card-top .flip-card-text-inner {
          top: 0;
        }

        .flip-card-bottom .flip-card-text-inner {
          bottom: 0;
        }

        .flip-card-text-inner span {
          display: block;
          font-size: 32px;
          line-height: 1;
        }

        @media (min-width: 380px) {
          .flip-card-text-inner span {
            font-size: 38px;
          }
        }

        @media (min-width: 640px) {
          .flip-card-text-inner span {
            font-size: 44px;
          }
        }

        .flip-card::before, .flip-card::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 2px;
          height: 4px;
          background-color: #09090b;
          margin-top: -2px;
          z-index: 10;
          border-radius: 1px;
        }
        .flip-card::before {
          left: 0;
        }
        .flip-card::after {
          right: 0;
        }

        .flip-animate-top {
          z-index: 3;
          animation: flipTopAnim 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .flip-animate-bottom {
          z-index: 2;
          transform: rotateX(90deg);
          animation: flipBottomAnim 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes flipTopAnim {
          0% {
            transform: rotateX(0deg);
          }
          50%, 100% {
            transform: rotateX(-90deg);
          }
        }

        @keyframes flipBottomAnim {
          0%, 50% {
            transform: rotateX(90deg);
          }
          100% {
            transform: rotateX(0deg);
          }
        }

        .flip-colon {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
          height: 48px;
          padding: 0 1px;
          margin-top: -10px;
        }

        @media (min-width: 380px) {
          .flip-colon {
            height: 54px;
            gap: 8px;
          }
        }

        @media (min-width: 640px) {
          .flip-colon {
            height: 64px;
            gap: 10px;
            padding: 0 2px;
          }
        }

        .flip-colon-dot {
          width: 3px;
          height: 3px;
          background-color: #71717a;
          border-radius: 50%;
        }

        @media (min-width: 640px) {
          .flip-colon-dot {
            width: 4px;
            height: 4px;
          }
        }

        .flip-unit-label {
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #71717a;
          text-transform: uppercase;
        }

        @media (min-width: 640px) {
          .flip-unit-label {
            font-size: 8px;
          }
        }
      `}</style>
      
      <div className="w-full flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
          SYSTEM CLOCK
        </span>
        <Clock className="w-4 h-4 text-muted-foreground/60" />
      </div>

      <div className="flip-clock-wrapper scale-95 sm:scale-100 origin-center my-auto py-2">
        <div className="flip-unit-container">
          <div className="flip-digits-group">
            <FlipDigit digit={hours[0]} />
            <FlipDigit digit={hours[1]} />
          </div>
          <span className="flip-unit-label">Hours</span>
        </div>

        <div className="flip-colon">
          <div className="flip-colon-dot"></div>
          <div className="flip-colon-dot"></div>
        </div>

        <div className="flip-unit-container">
          <div className="flip-digits-group">
            <FlipDigit digit={minutes[0]} />
            <FlipDigit digit={minutes[1]} />
          </div>
          <span className="flip-unit-label">Minutes</span>
        </div>

        <div className="flip-colon">
          <div className="flip-colon-dot"></div>
          <div className="flip-colon-dot"></div>
        </div>

        <div className="flip-unit-container">
          <div className="flip-digits-group">
            <FlipDigit digit={seconds[0]} />
            <FlipDigit digit={seconds[1]} />
          </div>
          <span className="flip-unit-label">Seconds</span>
        </div>
      </div>

      <div className="w-full border-t border-border/40 pt-2 text-[10px] text-muted-foreground flex justify-between items-center">
        <span>Local Time</span>
        <span className="font-semibold text-primary flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          Live
        </span>
      </div>
    </div>
  );
}
