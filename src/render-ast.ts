import type { TemplateNode, TekoNode, ComponentNode, SlotNode, RenderOptions } from '@tekojs/types';
import { escapeHtml, evaluate } from '@tekojs/runtime';

export async function renderAst(
  ast: TemplateNode,
  state: Record<string, unknown>,
  options: RenderOptions = {},
  incomingSlots: Record<string, string> = {}
): Promise<string> {
  async function renderNodes(nodes: TekoNode[], scope: Record<string, unknown>): Promise<string> {
    let out = '';

    for (const node of nodes) {
      if (node.type === 'Text') {
        out += node.value;
        continue;
      }

      if (node.type === 'Expression') {
        const value = evaluate(node.value, scope);
        out += node.escaped ? escapeHtml(value) : String(value ?? '');
        continue;
      }

      if (node.type === 'If') {
        const result = evaluate(node.test, scope);
        out += await renderNodes(result ? node.consequent : node.alternate, scope);
        continue;
      }

      if (node.type === 'Each') {
        const iterable = evaluate(node.iterable, scope);
        if (!Array.isArray(iterable)) continue;

        for (const item of iterable) {
          out += await renderNodes(node.body, { ...scope, [node.item]: item });
        }
        continue;
      }

      if (node.type === 'Slot') {
        out += await renderSlotNode(node, scope);
        continue;
      }

      if (node.type === 'Component') {
        out += await renderComponentNode(node, scope);
        continue;
      }
    }

    return out;
  }

  async function renderSlotNode(node: SlotNode, scope: Record<string, unknown>): Promise<string> {
    if (incomingSlots[node.name]) return incomingSlots[node.name];
    return renderNodes(node.children, scope);
  }

  async function renderComponentNode(node: ComponentNode, scope: Record<string, unknown>): Promise<string> {
    if (!options.resolveComponent || !options.renderTemplate) {
      throw new Error(`Resolver de componente não configurado: ${node.name}`);
    }

    const source = await options.resolveComponent(node.name);
    if (!source) throw new Error(`Componente não encontrado: ${node.name}`);

    const props =
      node.props && node.props.length > 0
        ? (evaluate(node.props, scope) as Record<string, unknown>)
        : {};

    const slotMap: Record<string, string> = {};
    const unnamedChildren = node.children.filter((child) => child.type !== 'Slot');

    if (unnamedChildren.length > 0) {
      slotMap.main = await renderNodes(unnamedChildren, scope);
    }

    for (const child of node.children) {
      if (child.type === 'Slot') {
        slotMap[child.name] = await renderNodes(child.children, scope);
      }
    }

    return options.renderTemplate(source, { ...scope, $props: props }, slotMap);
  }

  return renderNodes(ast.body, state);
}
