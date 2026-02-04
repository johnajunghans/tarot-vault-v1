/// <reference types="vite/client" />
import schema from "../schema";

// Import all Convex functions from the parent convex directory
export const modules = import.meta.glob("../**/!(*.*.*)*.*s");

export { schema };
