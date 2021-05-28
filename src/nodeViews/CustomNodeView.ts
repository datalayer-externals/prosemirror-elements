import type { Node } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import type { ElementNodeView } from "./ElementNodeView";
import { FieldType } from "./ElementNodeView";

type Subscriber<Fields extends unknown> = (fields: Fields) => void;

/**
 * A NodeView (https://prosemirror.net/docs/ref/#view.NodeView) representing a
 * node that contains fields that are updated atomically.
 */
export class CustomNodeView<Fields = unknown>
  implements ElementNodeView<Fields> {
  public static propName = "custom" as const;
  public static fieldType = FieldType.ATTRIBUTES;
  public static defaultValue = undefined;

  private subscribers: Array<Subscriber<Fields>> = [];

  constructor(
    // The node that this NodeView is responsible for rendering.
    protected node: Node,
    // The outer editor instance. Updated from within this class when the inner state changes.
    protected outerView: EditorView,
    // Returns the current position of the parent Nodeview in the document.
    protected getPos: () => number,
    // The offset of this node relative to its parent NodeView.
    protected offset: number
  ) {}

  public getNodeValue(node: Node): Fields {
    return node.attrs.fields as Fields;
  }

  public getNodeFromValue(fields: Fields): Node {
    return this.node.type.create({ fields });
  }

  /**
   * @returns A function that can be called to update the node fields.
   */
  public subscribe(subscriber: Subscriber<Fields>) {
    this.subscribers.push(subscriber);
    subscriber(this.node.attrs.fields as Fields);
    return (fields: Fields) => this.updateOuterEditor(fields);
  }

  public unsubscribe(subscriber: Subscriber<Fields>) {
    const subscriberIndex = this.subscribers.indexOf(subscriber);
    if (subscriberIndex === -1) {
      console.error(
        `[prosemirror-elements]: Attempted to unsubscribe from a CustomNodeView, but couldn't find the subscriber`
      );
      return;
    }
    this.subscribers.splice(subscriberIndex, 1);
  }

  public update(node: Node, elementOffset: number) {
    if (node.type !== this.node.type) {
      return false;
    }

    this.offset = elementOffset;

    this.updateSubscribers(node.attrs.fields as Fields);

    return true;
  }

  public destroy() {
    this.subscribers = [];
  }

  private updateSubscribers(fields: Fields) {
    this.subscribers.forEach((subscriber) => {
      subscriber(fields);
    });
  }

  /**
   * Update the outer editor with a new field state.
   */
  protected updateOuterEditor(fields: Fields) {
    const outerTr = this.outerView.state.tr;
    // When we insert content, we must offset to account for a few things:
    //  - getPos() returns the position directly before the parent node (+1)
    const contentOffset = 1;
    const nodePos = this.getPos() + this.offset + contentOffset;
    outerTr.setNodeMarkup(nodePos, undefined, {
      fields,
    });

    const shouldUpdateOuter = outerTr.docChanged;

    if (shouldUpdateOuter) this.outerView.dispatch(outerTr);
  }
}
