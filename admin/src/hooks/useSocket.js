import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext.jsx'; 

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (socket === undefined) {
    throw new Error("useSocket phải được dùng bên trong SocketProvider");
  }
  return socket;
};