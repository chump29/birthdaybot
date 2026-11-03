declare global {
  type MockKeys<T> = {
    [K in keyof T]: K extends `_${string}` ? never : K extends "valueOf" | "toString" ? never : K
  }[keyof T]

  type BaseMock<T> = {
    [K in MockKeys<T>]: T[K] extends (...args: unknown[]) => unknown
      ? T[K]
      : T[K] extends object
        ? BaseMock<T[K]>
        : T[K]
  } & Partial<T> & {
      valueOf: () => string | number | boolean | object
      toString: () => string
    }

  type HandleUnderscoreProps<T> = {
    [K in keyof T as K extends `_${string}` ? K : never]?: T[K]
  }

  type Mock<T> = T extends unknown ? BaseMock<T> & T & HandleUnderscoreProps<T> : never

  type MockProps<T> = {
    [K in keyof T]?: T[K] extends (...args: unknown[]) => unknown
      ? T[K] | ((...args: unknown[]) => unknown)
      : T[K] extends object
        ? MockProps<T[K]> | Mock<T[K]> | object
        : T[K]
  }

  function createMock<T>(props?: MockProps<T>): Mock<T>

  interface Function {
    get mocked(): import("bun:test").Mock<(...args: unknown[]) => unknown>["mock"]
  }
}

export {}
