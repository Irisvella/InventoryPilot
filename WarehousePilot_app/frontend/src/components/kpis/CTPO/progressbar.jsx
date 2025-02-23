import React from 'react';
import PropTypes from 'prop-types';

const ProgressBar = ({ pickTime, packTime, shipTime }) => {
  const totalTime = pickTime + packTime + shipTime;
  const pickRatio = (pickTime / totalTime) * 100;
  const packRatio = (packTime / totalTime) * 100;
  const shipRatio = (shipTime / totalTime) * 100;

  return (
    <div className="flex flex-col w-full bg-gray-200 rounded">
    <div className="flex w-full h-4">
      <div
        className="flex items-center justify-center bg-blue-500 h-full rounded-l"
        style={{ width: `${pickRatio}%` }}
        title={`Pick: ${pickTime} hours`}
      >
      <span className="text-white text-xs">
          Picking
      </span>
      </div>
      <div
        className="flex items-center justify-center bg-green-500 h-full"
        style={{ width: `${packRatio}%` }}
        title={`Pack: ${packTime} hours`}
      >
      <span className="text-white text-xs">
          Packing
      </span>
      </div>
      <div
        className="flex items-center justify-center bg-amber-400 h-full rounded-r"
        style={{ width: `${shipRatio}%` }}
        title={`Ship: ${shipTime} hours`}
      >
      <span className="text-white text-xs">
          Shipping
      </span>
      </div>
    </div>
    <div className="flex w-full h-4">
    <div
      className="flex items-center justify-start bg-white h-full rounded-l"
      style={{ width: `${pickRatio}%` }}
    >
      <span className="text-black text-xs">{pickTime} hrs</span>
    </div>
    <div
      className="flex items-center justify-start bg-white h-full"
      style={{ width: `${packRatio}%` }}
    >
      <span className="text-black text-xs">{packTime} hrs</span>
    </div>
    <div
      className="flex items-center justify-start bg-white h-full rounded-r"
      style={{ width: `${shipRatio}%` }}
    >
      <span className="text-black text-xs">{shipTime} hrs</span>
    </div>
  </div>
  </div>
  );
};

ProgressBar.propTypes = {
  pickTime: PropTypes.number.isRequired,
  packTime: PropTypes.number.isRequired,
  shipTime: PropTypes.number.isRequired,
};

export default ProgressBar;