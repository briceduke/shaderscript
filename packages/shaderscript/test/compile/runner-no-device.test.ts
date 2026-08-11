import { expect, test } from "bun:test";
import { requestDeviceOrThrowAsync } from "../../src/runner.ts";

test("requestDeviceOrThrowAsync throws when gpu is missing", async () => {
  await expect(
    requestDeviceOrThrowAsync({
      getGpu: () => undefined,
    }),
  ).rejects.toThrow(/navigator\.gpu is missing/);
});
