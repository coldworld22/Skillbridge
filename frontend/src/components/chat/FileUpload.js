import { FaPaperclip } from "react-icons/fa";

const FileUpload = ({ setFile }) => {
  return (
    <label className="p-2 bg-gray-600 rounded cursor-pointer">
      <FaPaperclip className="text-white" />
      <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
    </label>
  );
};

export default FileUpload;
