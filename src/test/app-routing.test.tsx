import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

const makeRouter = () => createRouter({ routeTree, context: { queryClient: new QueryClient() } });

describe("Tokea route integration", () => {
  it.each(["/", "/host", "/session/s2", "/requests", "/chats", "/chats/s2", "/profile"])(
    "resolves %s without falling through to 404",
    (path) => {
      const matches = makeRouter().matchRoutes(path);
      expect(matches.length).toBeGreaterThan(1);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    },
  );

  it("nests a chat conversation below the chats route", () => {
    const matches = makeRouter().matchRoutes("/chats/s2");
    expect(matches.map((match) => match.routeId)).toContain("/chats");
    expect(matches.at(-1)?.routeId).toBe("/chats/$id");
  });
});
