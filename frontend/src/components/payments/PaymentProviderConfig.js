export default function PaymentProviderConfig({ providerId }) {
    return (
      <form className="space-y-4 bg-white p-6 rounded-xl shadow">
        <label className="block">
          <span className="text-sm">Client ID</span>
          <input type="text" className="w-full border rounded p-2" placeholder="Enter client ID" />
        </label>
        <label className="block">
          <span className="text-sm">Secret Key</span>
          <input type="password" className="w-full border rounded p-2" placeholder="Enter secret" />
        </label>
        <label className="block">
          <span className="text-sm">Mode</span>
          <select className="w-full border rounded p-2">
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm">Available For</span>
          <select className="w-full border rounded p-2" multiple>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </label>
        <button className="bg-yellow-400 px-6 py-2 rounded-full text-white">Save Configuration</button>
      </form>
    );
  }
  