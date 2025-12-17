const noop = () => {};

export const io = () => ({
  on: noop,
  off: noop,
  emit: noop,
  connect: noop,
  disconnect: noop,
});

const mockSocketClient = { io };

export default mockSocketClient;
