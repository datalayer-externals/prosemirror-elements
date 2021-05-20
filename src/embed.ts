import OrderedMap from "orderedmap";
import type { NodeSpec, Schema } from "prosemirror-model";
import type { EditorState, Transaction } from "prosemirror-state";
import { buildCommands, defaultPredicate } from "./helpers";
import { createNodesForFieldValues } from "./nodeSpec";
import type { FieldNameToValueMap } from "./nodeViews/helpers";
import { createPlugin } from "./plugin";
import type { FieldSpec, TEmbed } from "./types/Embed";

/**
 * Build an embed plugin with the given embed specs, along with the schema required
 * by those embeds, and a method to insert embeds into the document.
 */
export const buildEmbedPlugin = <
  FSpec extends FieldSpec<string>,
  Name extends string
>(
  embedSpecs: Array<TEmbed<FSpec, Name>>,
  predicate = defaultPredicate
) => {
  const embedTypeMap = embedSpecs.reduce<
    Partial<{ [name in Name]: TEmbed<FSpec, Name> }>
  >((acc, spec) => {
    acc[spec.name] = spec;
    return acc;
  }, {});

  const insertEmbed = (type: Name, fieldValues: FieldNameToValueMap<FSpec>) => (
    state: EditorState,
    dispatch: (tr: Transaction<Schema>) => void
  ): void => {
    const embed = embedTypeMap[type];
    if (!embed) {
      throw new Error(
        `[prosemirror-embeds]: ${type} is not recognised. Only ${Object.keys(
          embedTypeMap
        ).join(", ")} can be added`
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- we cannot be sure the schema has been amended
    if (!(state.schema as Schema).nodes[type]) {
      throw new Error(
        `[prosemirror-embeds]: ${type} is not included in the state schema. Did you add the NodeSpec generated by this plugin to the schema?`
      );
    }

    const nodes = createNodesForFieldValues(
      state.schema,
      embed.fieldSpec,
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
      console.warn(`[prosemirror-embeds]: Could not create a node for ${type}`);
    }
  };

  const plugin = createPlugin(embedSpecs, buildCommands(predicate));
  const nodeSpec = embedSpecs
    .map((embed) => embed.nodeSpec)
    .reduce((acc, spec) => acc.append(spec), OrderedMap.from<NodeSpec>({}));

  return {
    insertEmbed,
    hasErrors: (state: EditorState) => plugin.getState(state).hasErrors,
    plugin,
    nodeSpec,
  };
};
