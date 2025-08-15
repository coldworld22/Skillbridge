import { MAX_IMAGE_SIZE, MAX_IMAGE_SIZE_MB } from "../../utils/constants";

test("image size limit is 10MB", () => {
  expect(MAX_IMAGE_SIZE_MB).toBe(10);
  expect(MAX_IMAGE_SIZE).toBe(MAX_IMAGE_SIZE_MB * 1024 * 1024);
});
