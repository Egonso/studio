import { runFoundationSmoke } from "./smoke.ts";
import { runServiceSmoke } from "./service.smoke.ts";
import { runToolRegistrySmoke } from "./tool-registry.smoke.ts";
import { runV11SchemaSmoke } from "./v11-schema.smoke.ts";
import { runServiceV11Smoke } from "./service-v11.smoke.ts";
import { runRegisterStandaloneSmoke } from "./register-standalone.smoke.ts";

async function runAll() {
  await runFoundationSmoke();
  await runServiceSmoke();
  await runToolRegistrySmoke();
  await runV11SchemaSmoke();
  await runServiceV11Smoke();
  await runRegisterStandaloneSmoke();
  console.log("Register-First all smoke tests passed.");
  process.exit(0);
}

runAll().catch((error) => {
  console.error(error);
  process.exit(1);
});
