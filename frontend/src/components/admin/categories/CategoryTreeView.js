import { useState } from "react";

export default function CategoryTreeView({ categories }) {
  const tree = buildCategoryTree(categories);

  return (
    <ul className="pl-4">
      {tree.map(cat => (
        <TreeNode key={cat.id} node={cat} />
      ))}
    </ul>
  );
}

function TreeNode({ node }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <li className="mb-1">
      <div
        className="cursor-pointer flex items-center gap-2"
        onClick={() => setExpanded(!expanded)}
      >
        {node.children?.length > 0 && (
          <span>{expanded ? "▼" : "▶"}</span>
        )}
        <span className="font-medium">{node.name}</span>
      </div>

      {expanded && node.children?.length > 0 && (
        <ul className="pl-6 border-l mt-1">
          {node.children.map(child => (
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
