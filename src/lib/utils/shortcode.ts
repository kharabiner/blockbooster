import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

export function generateShortCode(): string {
  return nanoid();
}
