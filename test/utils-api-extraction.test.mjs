import test from "node:test";
import assert from "node:assert/strict";

import { extractAPIInfo } from "../dist/tools/utils.js";

test("extractAPIInfo parses latest accordion-style API sections", () => {
  const html = `
    <h2 id="brain-api">Brain API</h2>
    <h4><code>BrnAccordionItem</code></h4>
    <p>Selector: <code>[brnAccordionItem]</code></p>
    <h5>Inputs</h5>
    <table>
      <tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr>
      <tr><td>isOpened</td><td>boolean</td><td>false</td><td>Whether the item is open.</td></tr>
    </table>
    <h5>Outputs</h5>
    <table>
      <tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr>
      <tr><td>stateChange</td><td>'open' | 'closed'</td><td>-</td><td>Emits the current state.</td></tr>
    </table>
    <h2 id="helm-api">Helm API</h2>
    <h4><code>HlmAccordionItem</code></h4>
    <p>Selector: <code>hlm-accordion-item</code></p>
    <h5>Inputs</h5>
    <p>Prop  Type  Default  Description</p>
    <p>disabled  boolean  false  Disables the item.</p>
    <h5>Outputs</h5>
    <p>Prop  Type  Default  Description</p>
    <p>toggled  EventEmitter&lt;boolean&gt;  -  Emits when toggled.</p>
    <pre><code>import { HlmAccordionItem } from "@spartan-ng/helm/accordion";</code></pre>
    <pre><code>&lt;hlm-accordion-item&gt;
  &lt;div&gt;Example&lt;/div&gt;
&lt;/hlm-accordion-item&gt;</code></pre>
  `;

  const api = extractAPIInfo(html);

  assert.equal(api.brainAPI.length, 1);
  assert.equal(api.brainAPI[0].name, "BrnAccordionItem");
  assert.equal(api.brainAPI[0].selector, "[brnAccordionItem]");
  assert.deepEqual(api.brainAPI[0].inputs[0], {
    prop: "isOpened",
    type: "boolean",
    default: "false",
    description: "Whether the item is open.",
  });
  assert.deepEqual(api.brainAPI[0].outputs[0], {
    prop: "stateChange",
    type: "'open' | 'closed'",
    description: "Emits the current state.",
  });

  assert.equal(api.helmAPI.length, 1);
  assert.equal(api.helmAPI[0].name, "HlmAccordionItem");
  assert.equal(api.helmAPI[0].selector, "hlm-accordion-item");
  assert.deepEqual(api.helmAPI[0].inputs[0], {
    prop: "disabled",
    type: "boolean",
    default: "false",
    description: "Disables the item.",
  });
  assert.deepEqual(api.helmAPI[0].outputs[0], {
    prop: "toggled",
    type: "EventEmitter<boolean>",
    description: "Emits when toggled.",
  });
  assert.equal(api.examples.length, 1);
  assert.match(api.examples[0].code, /hlm-accordion-item/);
});
