import { describe, expect, it } from "vitest"
import { StructuraError, createError, err, ok } from "./index.js"

describe("Result", () => {
  it("should create ok result", () => {
    const result = ok(42)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe(42)
    }
  })

  it("should create err result", () => {
    const error = createError("INTERNAL_ERROR", "something went wrong")
    const result = err<number>(error)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(StructuraError)
      expect(result.error.code).toBe("INTERNAL_ERROR")
    }
  })
})

describe("StructuraError", () => {
  it("should create error with code and message", () => {
    const error = new StructuraError("CONFIG_NOT_FOUND", "structura.yml not found")
    expect(error.code).toBe("CONFIG_NOT_FOUND")
    expect(error.message).toBe("structura.yml not found")
    expect(error.name).toBe("StructuraError")
  })
})
