import React from "react";

export const Card = ({ index, address, time, message }) => {
  return (
    <div
      className="card w-full bg-base-100 border border-1 border-black"
    >
      <div className="card-body">
        <p>address: {address}</p>
        <p>time: {time}</p>
        <p>message: {message}</p>
      </div>
    </div>
  );
};
