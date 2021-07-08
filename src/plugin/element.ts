import OrderedMap from "orderedmap";
import type { NodeSpec, Schema } from "prosemirror-model";
import type { EditorState, Transaction } from "prosemirror-state";
import type { FieldNameToValueMap } from "./fieldViews/helpers";
import { buildCommands, defaultPredicate } from "./helpers/prosemirror";
import { createNodesForFieldValues } from "./nodeSpec";
import { createPlugin } from "./plugin";
import type { ElementSpec, FieldSpec } from "./types/Element";

/**
 * Build an element plugin with the given element specs, along with the schema required
 * by those elements, and a method to insert elements into the document.
 */
export const buildElementPlugin = <
  FSpec extends FieldSpec<string>,
  ElementNames extends string
>(
  elementSpecs: Array<ElementSpec<FSpec, ElementNames>>,
  predicate = defaultPredicate
) => {
  const elementTypeMap = elementSpecs.reduce<
    Partial<{ [elementName in ElementNames]: ElementSpec<FSpec, elementName> }>
  >((acc, spec) => {
    acc[spec.name] = spec;
    return acc;
  }, {});

  const insertElement = (
    type: ElementNames,
    fieldValues: Partial<FieldNameToValueMap<FSpec>> = {}
  ) => (
    state: EditorState,
    dispatch: (tr: Transaction<Schema>) => void
  ): void => {
    const element = elementTypeMap[type];
    if (!element) {
      throw new Error(
        `[prosemirror-elements]: ${type} is not recognised. Only ${Object.keys(
          elementTypeMap
        ).join(", ")} can be added`
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- we cannot be sure the schema has been amended
    if (!(state.schema as Schema).nodes[type]) {
      throw new Error(
        `[prosemirror-elements]: ${type} is not included in the state schema. Did you add the NodeSpec generated by this plugin to the schema?`
      );
    }

    const nodes = createNodesForFieldValues(
      state.schema,
      element.fieldSpec,
      fieldValues
    );

    const maybeNewNode = (state.schema as Schema).nodes[type].createAndFill(
      {
        type,
      },
      nodes
    );
    if (maybeNewNode) {
      dispatch(state.tr.replaceSelectionWith(maybeNewNode));
    } else {
      console.warn(
        `[prosemirror-elements]: Could not create a node for ${type}`
      );
    }
  };

  const plugin = createPlugin(elementSpecs, buildCommands(predicate));
  const nodeSpec = elementSpecs
    .map((element) => element.nodeSpec)
    .reduce((acc, spec) => acc.append(spec), OrderedMap.from<NodeSpec>({}));

  return {
    insertElement,
    hasErrors: (state: EditorState) => plugin.getState(state).hasErrors,
    plugin,
    nodeSpec,
  };
};