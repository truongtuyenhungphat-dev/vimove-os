import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

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
