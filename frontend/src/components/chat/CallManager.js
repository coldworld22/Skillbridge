const CallManager = ({ chat }) => {
    return (
      <div className="flex justify-center gap-3 mt-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded">Audio Call</button>
        <button className="px-4 py-2 bg-red-500 text-white rounded">Video Call</button>
      </div>
    );
  };
  
  export default CallManager;
  