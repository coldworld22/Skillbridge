import { FaPaperclip } from "react-icons/fa";
import styles from "./FileUpload.module.scss";

const FileUpload = ({ setFile }) => {
  return (
    <label className={styles.label}>
      <FaPaperclip className={styles.icon} />
      <input type="file" className={styles.hiddenInput} onChange={(e) => setFile(e.target.files[0])} />
    </label>
  );
};

export default FileUpload;
