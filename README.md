# @guardian/prosemirror-elements

This Prosemirror plugin adds the ability to add custom 'elements' to a document.

## Why does this exist?

Modelling non-text content in Prosemirror can be tricky. `prosemirror-elements` provides an abstraction that makes it easy to write custom elements that:

- contain user-defined fields that model many different kinds of content, including rich text fields and arbitrary data
- are first class citizens of the Prosemirror schema (for example, nested rich text fields play nicely with collaborative editing)
- are renderer-agnostic (we use React as a default)

## Setup

1. Ensure you have `dev-nginx` and `yarn` installed on your local machine.
2. Run the setup script: `./script/setup.sh`

## Run

1. Ensure nginx is running.
2. `yarn start` builds the project locally, spins up a webserver on https://prosemirror-elements.local.dev-gutools.co.uk, and watches for file changes.

## Testing

- Run the unit tests via Jest with `yarn test:unit`.
- Run the integration tests via Cypress with `yarn test:integration`.
  - You'll need to be running the application via `yarn start` simultaneously for the tests to work – make sure the server is responding on http://localhost:7890 before running the tests.
  - For reasons we're not yet able to determine, Cypress won't run your tests immediately when you select them in the GUI. Hit the 'refresh' button and they should run normally.

## Releasing

This repository uses [changesets](https://github.com/changesets/changesets) for version management

To release a new version with your changes, run `yarn changeset add` and follow the prompts. This will create a new changeset file in the `.changeset` directory. Commit this file with your PR.

When your PR is merged, Changesets will create a PR to release the new version.

### Testing locally in applications using `prosemirror-elements`

We've found yalc useful in testing local changes to prosemirror-elements in applications that use it.

Setup:

1. Install `yalc` globally with `npm i yalc -g` or `yarn global add yalc`.
2. Run `yarn yalc` in your local project from your current branch, to build the project and push changes to yalc.
3. Run `yalc add @guardian/prosemirror-elements` within the project consuming prosemirror-elements locally.

Note: any changes you make to your local prosemirror-elements branch must be republished (step 3). Don't forget to run `yarn yalc` again!

### Adding a new element using ProseMirror Elements:

[Quick-Start Guide](https://github.com/guardian/prosemirror-elements/blob/main/docs/quick-start.md)

## Troubleshooting when developing this library

### Problems with `yarn link`

ProseMirror and its dependencies sometimes use object identity checks (e.g. `instanceof`). When using `yarn link`, it's possible for the consuming code to bundle different versions of dependencies simultaneously. This can be difficult to work around. It will not happen during a normal install.

We recommend using `yalc` to avoid this issue, but it's also possible to work around it.

One known instance of this occurs when appending the `NodeSpec` generated by the library to the parent editor schema. This would normally be accomplished by appending it to a parent schema, like so:

```ts
const mySchema = new Schema({
  nodes: OrderedMap.from(schema.spec.nodes).append(nodeSpec),
  marks,
});
```

This may fail if your bundler has included the `ordered-map` dependency twice in your project. Because `ordered-map` uses `instanceof` to determine if an incoming object is an `OrderedMap`, the incoming object will fail this check, despite it being the correct shape.

As a workaround, try reconstructing the map as an object:

```ts
const objectNodeSpec: Record<string, NodeSpec> = {};
nodeSpec.forEach((key, value) => (objectNodeSpec[key] = value as NodeSpec));

const mySchema = new Schema({
  nodes: OrderedMap.from(schema.spec.nodes).append(objectNodeSpec),
  marks,
});
```

## Element-specific docs – for Guardian users only

It's useful to write fixture tests to ensure that the element you're creating doesn't disrupt existing data – see the fixture tests in `src/elements/helpers/__tests__/transformFixtures.spec.ts` for more details.

There's a script available at `./fixtures/parse-element.js` to facilitate transforming element data from the Guardian CMS into a redacted form suitable for fixtures.
