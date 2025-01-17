import { exampleSetup } from "prosemirror-example-setup";
import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { buildElementPlugin } from "../element";
import { createElementSpec } from "../elementSpec";
import type { ElementSpecMap, FieldDescriptions } from "../types/Element";
import { createParsers } from "./prosemirror";

const initialPhrase = "deco";
const key = new PluginKey<string>("TEST_DECO_PLUGIN");
export const ChangeTestDecoStringAction = "CHANGE_TEST_DECO_STRING";

export const testDecorationPlugin = new Plugin<string>({
  key,
  state: {
    init() {
      return initialPhrase;
    },
    apply(tr, oldTestString) {
      const maybeNewTestString = tr.getMeta(ChangeTestDecoStringAction) as
        | string
        | undefined;
      return maybeNewTestString ?? oldTestString;
    },
  },
  props: {
    decorations: (state) => {
      const testString = key.getState(state) ?? initialPhrase;
      const ranges = [] as Array<[number, number]>;
      state.doc.descendants((node, offset) => {
        if (node.isLeaf && node.textContent) {
          const indexOfDeco = node.textContent.indexOf(testString);
          if (indexOfDeco !== -1) {
            ranges.push([
              indexOfDeco + offset,
              indexOfDeco + offset + testString.length,
            ]);
          }
        }
      });

      return DecorationSet.create(
        state.doc,
        ranges.map(([from, to]) =>
          Decoration.inline(from, to, { class: "TestDecoration" })
        )
      );
    },
  },
});

export const trimHtml = (html: string) => html.replace(/>\s+</g, "><").trim();

/**
 * Create an element which renders nothing. Useful when testing schema output.
 */
export const createNoopElement = <FDesc extends FieldDescriptions<string>>(
  fieldDescriptions: FDesc
) =>
  createElementSpec(
    fieldDescriptions,
    () => null,
    () => undefined,
    () => undefined
  );

export const createEditorWithElements = <
  FDesc extends FieldDescriptions<Extract<keyof FDesc, string>>,
  ElementNames extends Extract<keyof ESpecMap, string>,
  ESpecMap extends ElementSpecMap<FDesc, ElementNames>
>(
  elements: ESpecMap,
  initialHTML = "",
  plugins: Plugin[] = []
) => {
  const {
    plugin,
    insertElement,
    nodeSpec,
    getNodeFromElementData,
    getElementDataFromNode,
    validateElementData,
  } = buildElementPlugin(elements);
  const editorElement = document.createElement("div");
  const docElement = document.createElement("div");
  docElement.innerHTML = initialHTML;
  const schema = new Schema({
    nodes: basicSchema.spec.nodes.append(nodeSpec),
    marks: basicSchema.spec.marks,
  });
  const { serializer, parser } = createParsers(schema);
  const view = new EditorView(editorElement, {
    state: EditorState.create({
      doc: parser.parse(docElement),
      schema,
      plugins: [...exampleSetup({ schema }), plugin, ...plugins],
    }),
  });

  const getElementAsHTML = () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- YOLO test energy
    const actual = serializer.serializeNode(view.state.doc.content.firstChild!);
    const element = document.createElement("div");
    element.appendChild(actual);
    return element.innerHTML;
  };

  const getDocAsHTML = () => {
    const actual = serializer.serializeFragment(view.state.doc.content);
    const element = document.createElement("div");
    element.appendChild(actual);
    return element.innerHTML;
  };

  return {
    view,
    nodeSpec,
    schema,
    insertElement,
    getElementAsHTML,
    getDocAsHTML,
    getNodeFromElementData,
    getElementDataFromNode,
    serializer,
    validateElementData,
  };
};

export const getDecoSpecs = (decoSet: DecorationSet) =>
  decoSet.find().map(({ from, to }) => ({
    from,
    to,
  }));
