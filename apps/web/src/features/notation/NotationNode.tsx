import React from 'react';
import { MoveNode } from '../../types/chess';
import { useStudyStore } from '../../stores/useStudyStore';

interface NotationNodeProps {
  node: MoveNode;
  depth: number;
}

export const NotationNode: React.FC<NotationNodeProps> = ({ node, depth }) => {
  const { currentNodeId, jumpToNode } = useStudyStore();

  if (node.id === 'root') {
    return (
      <div className="notation-mainline">
        {node.children.length > 0 && <NotationNode node={node.children[0]} depth={1} />}
        {node.children.slice(1).map((child, i) => (
          <div key={i} className="variation-block">
            (<NotationNode node={child} depth={1} />)
          </div>
        ))}
      </div>
    );
  }

  const isWhite = depth % 2 !== 0;
  const moveNumber = Math.ceil(depth / 2);
  const isActive = node.id === currentNodeId;

  return (
    <span className="notation-move">
      {isWhite && <span className="move-number">{moveNumber}. </span>}
      <span 
        className={`move-san ${isActive ? 'active' : ''}`}
        onClick={() => jumpToNode(node.id)}
      >
        {node.san}
        {node.glyphs && node.glyphs.length > 0 && (
          <span className="move-glyphs">{node.glyphs.join('')}</span>
        )}
      </span>
      {node.comment && (
        <div className="move-comment">{node.comment}</div>
      )}
      {node.children.length > 0 && (
        <>
          {' '}
          <NotationNode node={node.children[0]} depth={depth + 1} />
          {node.children.slice(1).map((child, i) => (
            <span key={i} className="variation-inline">
              {' ('}
              <NotationNode node={child} depth={depth + 1} />
              {') '}
            </span>
          ))}
        </>
      )}
    </span>
  );
};
