/**
 * Wraps every <table> in a scrollable <div class="table-wrap"> so a wide table
 * scrolls on its own instead of widening the page on phones. A wrapper keeps
 * the table's semantics; `display: block` on the table itself would drop them
 * in some browsers.
 */
export default function rehypeTableWrap() {
  const visit = (node) => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      if (child.type === 'element' && child.tagName === 'table') {
        return { type: 'element', tagName: 'div', properties: { className: ['table-wrap'] }, children: [child] };
      }
      visit(child);
      return child;
    });
  };
  return visit;
}
