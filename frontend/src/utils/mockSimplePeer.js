class MockSimplePeer {
  constructor() {
    this.events = {};
  }

  on(event, handler) {
    this.events[event] = handler;
  }

  signal() {}

  replaceTrack(oldTrack, newTrack, stream) {
    void oldTrack;
    void newTrack;
    void stream;
  }

  destroy() {}
}

export default MockSimplePeer;
