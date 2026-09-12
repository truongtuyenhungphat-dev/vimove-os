import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

for (const [model, file, method] of [
  ["taskComment", "services/tasks/comments.ts", "deleteComment"],
  ["taskAttachment", "services/tasks/attachments.ts", "removeAttachment"],
]) {
  test(`${model}: deletion cannot target a different task`, async () => {
    const rows = [{ id: "owned", taskId: "task-a", label: "File" }, { id: "foreign", taskId: "task-b" }];
    const activities = [];
    const service = load(file, {
      "@/lib/db/client": { prisma: { [model]: { delete: async ({ where }) => {
        const index = rows.findIndex(row => matches(row, where));
        if (index < 0) throw new Error("Not found");
        return rows.splice(index, 1)[0];
      } } } },
      "./activity": { writeTaskActivity: async data => activities.push(data) },
    });
    const remove = id => method === "deleteComment"
      ? service[method]("task-a", id) : service[method]("task-a", "actor", id);
    await assert.rejects(remove("foreign"));
    assert.equal(rows.length, 2);
    assert.equal(activities.length, 0);
    await remove("owned");
    assert.deepEqual(rows.map(row => row.id), ["foreign"]);
    assert.equal(activities.length, model === "taskAttachment" ? 1 : 0);
  });
}

test("public form: reject unpublished pages and invalid data before saving", async () => {
  let form = {
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "phone", label: "Phone", type: "phone" },
    ],
    landingPage: { organizationId: "org", status: "PUBLISHED" },
  };
  const saved = [];
  const service = load("services/marketing/landing-pages.ts", {
    "@/lib/db/client": { prisma: {
      landingForm: { findUnique: async () => form },
      formSubmission: { create: async ({ data }) => { saved.push(data); return { id: "submission", ...data }; } },
    } },
  });
  const valid = { name: " Alice ", email: " alice@example.com ", unexpected: "discard" };
  for (const status of ["DRAFT", "ARCHIVED"]) {
    form.landingPage.status = status;
    await assert.rejects(service.submitForm("form", valid));
  }
  form.landingPage.status = "PUBLISHED";
  for (const input of [{}, { ...valid, name: "  " }, { ...valid, email: "invalid" }, { ...valid, name: 123 }]) {
    await assert.rejects(service.submitForm("form", input));
  }
  assert.equal(saved.length, 0);
  const result = await service.submitForm("form", valid);
  assert.equal(result.organizationId, "org");
  assert.deepEqual(JSON.parse(JSON.stringify(saved[0].data)), { name: "Alice", email: "alice@example.com", phone: "" });
  form = null;
  await assert.rejects(service.submitForm("missing", valid));
  assert.equal(saved.length, 1);
});

// Execute real application modules with isolated database/auth boundaries.
function load(file, mocks) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require: (name) => {
    if (name in mocks) return mocks[name];
    if (name === "zod") return require(name);
    return {};
  }});
  return exports;
}
function matches(row, where) {
  return Object.entries(where).every(([key, value]) => {
    if (value && typeof value === "object") {
      if ("in" in value) return value.in.includes(row[key]);
      return row[key] && matches(row[key], value);
    }
    return row[key] === value;
  });
}
for (const [kind, file, getter, owner] of [
  ["task", "services/tasks/tasks.ts", "getTask", "assignee"],
  ["lead", "services/crm/leads.ts", "getLead", "owner"],
]) {
  test(`${kind}: direct detail access enforces organization, owner and department`, async () => {
    let query;
    const rows = [
      { id: "mine", organizationId: "org", [owner + "Id"]: "me", [owner]: { departmentId: "d1" } },
      { id: "peer", organizationId: "org", [owner + "Id"]: "peer", [owner]: { departmentId: "d1" } },
      { id: "other", organizationId: "org", [owner + "Id"]: "other", [owner]: { departmentId: "d2" } },
      { id: "foreign", organizationId: "foreign", [owner + "Id"]: "me", [owner]: { departmentId: "d1" } },
      { id: "no-dept", organizationId: "org", [owner + "Id"]: "other", [owner]: { departmentId: null } },
    ];
    const service = load(file, { "@/lib/db/client": { prisma: { [kind]: {
      findFirst: async (args) => { query = args; return rows.find(row => matches(row, args.where)) ?? null; },
    }}}});
    for (const [scope, departmentId, allowed] of [
      ["OWN", "d1", ["mine"]], ["DEPARTMENT", "d1", ["mine", "peer"]],
      ["DEPARTMENT", null, []], ["ALL", null, ["mine", "peer", "other", "no-dept"]],
    ]) {
      for (const row of rows) {
        const result = await service[getter]("org", row.id, { scope, userId: "me", departmentId });
        assert.equal(!!result, allowed.includes(row.id), `${scope}: ${row.id}`);
        if (kind === "task") {
          for (const [relation, target] of [["dependsOn", "dependsOnTask"], ["dependents", "task"]]) {
            for (const linked of rows) assert.equal(matches(linked, query.include[relation].where[target]), allowed.includes(linked.id));
          }
        }
      }
    }
  });
}

test("existing JWT loses revoked permissions and follows current department; disabled/deleted users are rejected", async () => {
  let config;
  let user = { id: "me", status: "ACTIVE", organizationId: "org", departmentId: "new-dept" };
  let roles = [];
  load("auth.ts", {
    "next-auth": { default: (value) => { config = value; return {}; } },
    "next-auth/providers/credentials": { default: (value) => value },
    "@/lib/db/client": { prisma: {
      user: { findUnique: async () => user }, userRole: { findMany: async () => roles },
    }},
  });
  const stale = { userId: "me", permissions: ["tasks.delete"], departmentId: "old-dept" };
  const refreshed = await config.callbacks.jwt({ token: { ...stale } });
  assert.equal(refreshed.permissions.length, 0);
  assert.equal(refreshed.departmentId, "new-dept");
  roles = [{ role: { key: "staff", rolePermissions: [{ permission: { key: "tasks.read" }, scope: "OWN" }] } }];
  const scoped = await config.callbacks.jwt({ token: { ...stale } });
  assert.equal(scoped.permissionScopes["tasks.read"], "OWN");
  user = { ...user, status: "INACTIVE" };
  assert.equal(await config.callbacks.jwt({ token: { ...stale } }), null);
  user = null;
  assert.equal(await config.callbacks.jwt({ token: { ...stale } }), null);
  assert.equal(await config.callbacks.jwt({ token: {} }), null);
});
