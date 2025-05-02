import React from "react";
import "./UserAvatar.css";

const UserAvatar = ({ username }) => {
  const colors = [
    "#FF6B6B",
    "#6BCB77",
    "#4D96FF",
    "#FFD93D",
    "#845EC2",
    "#00C9A7",
  ];

  // Asocia un color al hash del nombre de usuario
  const getColorForUsername = (username) => {
    let hash = 0;
    if (username.length === 0) {
      return colors[0];
    }
    for (let i = 0; i < username.length; i++) {
      const char = username.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  };

  const initials = username.slice(0, 2);
  const backgroundColor = getColorForUsername(username);

  return (
    <div className="user-avatar" style={{ backgroundColor }}>
      {initials}
    </div>
  );
};

export default UserAvatar;
