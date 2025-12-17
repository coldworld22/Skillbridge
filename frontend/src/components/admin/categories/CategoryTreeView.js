import { useState } from "react";
import styles from "./CategoryAdmin.module.scss";

export default function CategoryTreeView({ categories }) {
  const tree = buildCategoryTree(categories);

  return (
    <ul className={styles.treeRoot}>
      {tree.map((cat) => (
        <TreeNode key={cat.id} node={cat} />
      ))}
    </ul>
  );
}

function TreeNode({ node }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <li className={styles.treeItem}>
      <div
        className={styles.treeRow}
        onClick={() => setExpanded(!expanded)}
      >
        {node.children?.length > 0 && (
          <span className={styles.chevron}>{expanded ? "▼" : "▶"}</span>
        )}
        <span className={styles.treeLabel}>{node.name}</span>
      </div>

      {expanded && node.children?.length > 0 && (
        <ul className={styles.treeChildren}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

function buildCategoryTree(categories, parentId = null) {
  return categories
    .filter(cat => cat.parent_id === parentId)
    .map(cat => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id),
    }));
}
