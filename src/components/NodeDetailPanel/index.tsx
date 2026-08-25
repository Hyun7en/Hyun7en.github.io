import type { GraphNode } from '../../lib/graph';
import './styles.css';

interface Props {
  node: GraphNode | null;
  /** Plain lookup, not a Map — must stay JSON-serializable for `client:*` hydration. */
  nodesById: Record<string, Pick<GraphNode, 'id' | 'name'>>;
  /** Omit both callbacks to render a static, link-based panel (e.g. on a server-only page). */
  onClose?: () => void;
  onSelectRelated?: (id: string) => void;
}

const typeLabel: Record<GraphNode['type'], string> = {
  architecture: 'Architecture',
  technology: 'Technology',
  concept: 'Concept',
};

export default function NodeDetailPanel({ node, nodesById, onClose, onSelectRelated }: Props) {
  if (!node) return null;

  const articlesByContext = groupBy(node.articles, (a) => a.context ?? 'common');
  const tilByContext = groupBy(node.til, (t) => t.context ?? 'common');

  const RelatedItem = ({ id, name }: { id: string; name: string }) =>
    onSelectRelated ? (
      <button className="node-panel-link" onClick={() => onSelectRelated(id)}>
        {name}
      </button>
    ) : (
      <a className="node-panel-link" href={`/architecture/${id}/`}>
        {name}
      </a>
    );

  return (
    <aside className="node-panel">
      {onClose && (
        <button className="node-panel-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      )}

      <span className="node-panel-type">{typeLabel[node.type]}</span>
      <h2 className="node-panel-title">{node.name}</h2>
      {node.description && <p className="node-panel-desc">{node.description}</p>}

      {node.children.length > 0 && (
        <section className="node-panel-section">
          <h3>Concepts</h3>
          <ul>
            {node.children.map((childId) => {
              const child = nodesById[childId];
              if (!child) return null;
              return (
                <li key={childId}>
                  <RelatedItem id={childId} name={child.name} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {node.articles.length > 0 && (
        <section className="node-panel-section">
          <h3>Related Blog</h3>
          {Object.entries(articlesByContext).map(([context, entries]) => (
            <div key={context} className="node-panel-context-group">
              {context !== 'common' && <span className="node-panel-context">{context}</span>}
              <ul>
                {entries.map((a) => (
                  <li key={a.path}>
                    <a href={`/posts/${a.path}/`}>{a.path}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {node.til.length > 0 && (
        <section className="node-panel-section">
          <h3>TIL / Code</h3>
          {Object.entries(tilByContext).map(([context, entries]) => (
            <div key={context} className="node-panel-context-group">
              {context !== 'common' && <span className="node-panel-context">{context}</span>}
              <ul>
                {entries.map((t) => (
                  <li key={`${t.repository}/${t.path}`}>
                    <a
                      href={`https://github.com/Hyun7en/${t.repository}/tree/main/${t.path}`}
                      target="_blank"
                      rel="noopener"
                    >
                      {t.repository}/{t.path}
                    </a>
                    {t.exists !== true && <span className="node-panel-badge">unverified</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {node.related.length > 0 && (
        <section className="node-panel-section">
          <h3>Related Concepts</h3>
          <ul>
            {node.related.map((relId) => {
              const rel = nodesById[relId];
              if (!rel) return null;
              return (
                <li key={relId}>
                  <RelatedItem id={relId} name={rel.name} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {node.children.length === 0 && node.articles.length === 0 && node.til.length === 0 && (
        <p className="node-panel-empty">아직 연결된 콘텐츠가 없습니다.</p>
      )}
    </aside>
  );
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}
