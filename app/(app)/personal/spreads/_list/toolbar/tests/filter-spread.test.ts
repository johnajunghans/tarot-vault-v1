import { describe, expect, it } from "vitest"
import type { SpreadDB, SpreadDraft } from "@/types/spreads"
import { buildSpreadList, getFilter, getSort, getSortDir } from "../filter-spreads"

const draftCards = [
    {
        position: 1,
        x: 0,
        y: 0,
        r: 0,
        z: 0,
        name: "",
        description: "",
        allowReverse: true,
    },
    {
        position: 2,
        x: 30,
        y: 0,
        r: 0,
        z: 1,
        name: "",
        description: "",
        allowReverse: true,
    },
]

const savedCards = [
    {
        position: 1,
        x: 0,
        y: 0,
        r: 0,
        z: 0,
        name: "",
        description: "",
        allowReverse: true,
    },
]

const savedUserId = "user_1" as SpreadDB["userId"]

const drafts: SpreadDraft[] = [
    {
        date: 100,
        name: "Alpha Draft",
        description: "Moon layout",
        numberOfCards: draftCards.length,
        positions: draftCards,
        favorite: false,
        version: 1,
        readingCount: 0,
        deleted: false,
    },
    {
        date: 300,
        name: "Gamma Draft",
        description: "Sun pattern",
        numberOfCards: draftCards.length + 1,
        positions: [...draftCards, savedCards[0]],
        favorite: false,
        version: 1,
        readingCount: 0,
        deleted: false,
    },
]

const spreads: SpreadDB[] = [
    {
        _id: "spread_alpha" as SpreadDB["_id"],
        _creationTime: 200,
        name: "Beta Spread",
        description: "Stars and moon",
        numberOfCards: savedCards.length,
        positions: savedCards,
        favorite: true,
        userId: savedUserId,
        updatedAt: 200,
        version: 1,
        readingCount: 0,
        deleted: false,
    },
    {
        _id: "spread_beta" as SpreadDB["_id"],
        _creationTime: 400,
        name: "Delta Spread",
        description: "Solar cross",
        numberOfCards: savedCards.length + draftCards.length,
        positions: [...savedCards, draftCards[0], draftCards[1]],
        favorite: false,
        userId: savedUserId,
        updatedAt: 400,
        version: 1,
        readingCount: 0,
        deleted: false,
    },
]

describe("getFilter", () => {
    it("returns valid filter values", () => {
        expect(getFilter("all")).toBe("all")
        expect(getFilter("saved")).toBe("saved")
        expect(getFilter("drafts")).toBe("drafts")
    })

    it('defaults invalid values to "all"', () => {
        expect(getFilter(null)).toBe("all")
        expect(getFilter("favorites")).toBe("all")
    })
})

describe("getSort", () => {
    it("returns valid sort field values", () => {
        expect(getSort("date")).toBe("date")
        expect(getSort("name")).toBe("name")
        expect(getSort("cards")).toBe("cards")
    })

    it('defaults invalid values to "date"', () => {
        expect(getSort(null)).toBe("date")
        expect(getSort("readingCount")).toBe("date")
    })
})

describe("getSortDir", () => {
    it("returns valid sort direction values", () => {
        expect(getSortDir("asc")).toBe("asc")
        expect(getSortDir("desc")).toBe("desc")
    })

    it('defaults invalid values to "desc"', () => {
        expect(getSortDir(null)).toBe("desc")
        expect(getSortDir("up")).toBe("desc")
    })
})

describe("buildSpreadList", () => {
    it("merges drafts and saved spreads and defaults to date descending", () => {
        const result = buildSpreadList(
            spreads,
            drafts,
            "all",
            false,
            "",
            "date",
            "desc",
        )

        expect(result.map((item) => item.name)).toEqual([
            "Delta Spread",
            "Gamma Draft",
            "Beta Spread",
            "Alpha Draft",
        ])
    })

    it("filters to saved items only", () => {
        const result = buildSpreadList(
            spreads,
            drafts,
            "saved",
            false,
            "",
            "date",
            "desc",
        )

        expect(result.every((item) => item.kind === "saved")).toBe(true)
        expect(result.map((item) => item.name)).toEqual(["Delta Spread", "Beta Spread"])
    })

    it("filters to draft items only", () => {
        const result = buildSpreadList(
            spreads,
            drafts,
            "drafts",
            false,
            "",
            "date",
            "desc",
        )

        expect(result.every((item) => item.kind === "draft")).toBe(true)
        expect(result.map((item) => item.name)).toEqual(["Gamma Draft", "Alpha Draft"])
    })

    it("applies favorites filtering only to saved spreads", () => {
        const result = buildSpreadList(
            spreads,
            drafts,
            "all",
            true,
            "",
            "date",
            "desc",
        )

        expect(result).toHaveLength(1)
        expect(result[0]?.name).toBe("Beta Spread")
        expect(result[0]?.kind).toBe("saved")
    })

    it("searches names and descriptions case-insensitively and trims input", () => {
        const nameMatch = buildSpreadList(
            spreads,
            drafts,
            "all",
            false,
            "  gamma  ",
            "date",
            "desc",
        )
        const descriptionMatch = buildSpreadList(
            spreads,
            drafts,
            "all",
            false,
            "MOON",
            "date",
            "desc",
        )

        expect(nameMatch.map((item) => item.name)).toEqual(["Gamma Draft"])
        expect(descriptionMatch.map((item) => item.name)).toEqual(["Beta Spread", "Alpha Draft"])
    })

    it("sorts by name in ascending order", () => {
        const result = buildSpreadList(
            spreads,
            drafts,
            "all",
            false,
            "",
            "name",
            "asc",
        )

        expect(result.map((item) => item.name)).toEqual([
            "Alpha Draft",
            "Beta Spread",
            "Delta Spread",
            "Gamma Draft",
        ])
    })

    it("sorts by card count in descending order", () => {
        const result = buildSpreadList(
            spreads,
            drafts,
            "all",
            false,
            "",
            "cards",
            "desc",
        )

        expect(result.map((item) => item.name)).toEqual([
            "Gamma Draft",
            "Delta Spread",
            "Alpha Draft",
            "Beta Spread",
        ])
    })

    it("handles undefined saved spreads", () => {
        const result = buildSpreadList(
            undefined,
            drafts,
            "all",
            false,
            "",
            "date",
            "desc",
        )

        expect(result.map((item) => item.name)).toEqual(["Gamma Draft", "Alpha Draft"])
    })
})
