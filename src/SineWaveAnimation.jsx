import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import './SineWaveAnimation.css';

const SineWaveAnimation = () => {
  const [pointPosition, setPointPosition] = useState({ x: 0, y: 0 });
  const [ballState, setBallState] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const capturerRef = useRef(null);
  const svgRef = useRef(null);

  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };

  const xScale = d3.scaleLinear().domain([0, 720]).range([margin.left, width - margin.right]);
  const yScale = d3.scaleLinear().domain([-1, 1]).range([height - margin.bottom, margin.top]);

  const sineWavePath = d3.line()
    .x(d => xScale(d))
    .y(d => yScale(Math.sin((d / 720) * 4 * Math.PI)))
    .curve(d3.curveBasis);

  const data = d3.range(0, 720);

  useEffect(() => {
    const interval = setInterval(() => {
      setPointPosition(prevPosition => {
        let newX = prevPosition.x + 5;
        if (newX > 720) {
          newX = 0;
        }
        const newY = Math.sin((newX / 720) * 4 * Math.PI);
        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const distance = Math.sqrt(Math.pow(xScale(pointPosition.x) - xScale(720), 2) + Math.pow(yScale(pointPosition.y) - yScale(Math.sin((720 / 720) * 4 * Math.PI)), 2));

    if (distance <= 15 && !ballState) {
      setBallState(true);
      setTimeout(() => {
        setBallState(false);
      }, 500);
    }
  }, [pointPosition, ballState]);

  useEffect(() => {
    if (isRecording) {
      const captureFrame = () => {
        const svgElement = svgRef.current;
        const data = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          context.fillStyle = '#f0f0f0'; // Set background color
          context.fillRect(0, 0, width, height); // Fill background
          context.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          capturerRef.current.capture(canvas);
        };
        img.src = url;
      };
      captureFrame();
    }
  }, [pointPosition, isRecording]);

  const toggleRecording = () => {
    const framerate = 20; // Adjust this value as needed
    if (!isRecording) {
      if (window.CCapture) {
        capturerRef.current = new window.CCapture({
          format: 'webm',
          framerate: framerate
        });
        capturerRef.current.start();
        setIsRecording(true);
      } else {
        console.error('CCapture is not loaded');
      }
    } else {
      setIsRecording(false);
      if (capturerRef.current) {
        capturerRef.current.stop();
        capturerRef.current.save(blob => {
          const url = URL.createObjectURL(blob, { type: 'video/webm' }); // Specify correct MIME type here
          setVideoUrl(url);
        });
      }
    }
  };
  
  
  

  return (
    <div className='sine-wave-div'>
      <svg ref={svgRef} className="sine-wave-svg" width={width} height={height}>
        <rect x="0" y="0" width={width} height={height} fill="#f0f0f0" /> {/* Background rect */}
        <path
          d={sineWavePath(data)}
          fill="none"
          stroke="black"
          strokeWidth="2"
        />
        <g transform={`translate(0, ${height - margin.bottom})`}>
          <line x1={margin.left} x2={width - margin.right} stroke="black" />
          {xScale.ticks(10).map((tickValue) => (
            <g key={tickValue} transform={`translate(${xScale(tickValue)}, 0)`}>
              <line y2="6" stroke="black" />
              <text dy="1.5em" y="9" fontSize="10" textAnchor="middle">{tickValue}</text>
            </g>
          ))}
        </g>
        <g transform={`translate(${margin.left}, 0)`}>
          <line y1={margin.top} y2={height - margin.bottom} stroke="black" />
          {yScale.ticks(5).map((tickValue) => (
            <g key={tickValue} transform={`translate(0, ${yScale(tickValue)})`}>
              <line x2="-6" stroke="black" />
              <text dx="-9" fontSize="10" textAnchor="end">{tickValue.toFixed(1)}</text>
            </g>
          ))}
        </g>
        <circle
          cx={xScale(pointPosition.x)}
          cy={yScale(pointPosition.y)}
          r="5"
          fill="blue"
        />
        <circle
          cx={xScale(720)}
          cy={yScale(Math.sin((720 / 720) * 4 * Math.PI))}
          r={ballState ? "20" : "10"}
          fill="red"
          className="ball-animation"
        />
      </svg>
      <button onClick={toggleRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {isRecording && (
        <div className="recording-indicator">
          Recording...
        </div>
      )}
      {videoUrl && (
        <div>
          <h3>Recorded Video</h3>
          <video controls src={videoUrl}></video>
        </div>
      )}
    </div>
  );
};

export default SineWaveAnimation;
