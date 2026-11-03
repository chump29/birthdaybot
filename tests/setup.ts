import { mock } from "bun:test"

type StrictFunction = (...args: unknown[]) => unknown
type StrictAsyncFunction = (...args: unknown[]) => Promise<unknown>
type TrackedMockInstance = ReturnType<typeof mock<StrictFunction>>

function wrapper<T>(target: object, handler: ProxyHandler<object>): Mock<T>
function wrapper(target: object, handler: ProxyHandler<object>): unknown {
  return new Proxy(target, handler)
}

const spyMapper: WeakMap<object, TrackedMockInstance> = new WeakMap<object, TrackedMockInstance>()

const isObject = (val: unknown): val is Record<PropertyKey, unknown> =>
  val !== null && typeof val === "object" && !Array.isArray(val)

const isMockTarget = (val: unknown): val is Record<PropertyKey, unknown> =>
  val !== null && (typeof val === "object" || typeof val === "function")

const isCallable = (val: unknown): val is TrackedMockInstance => typeof val === "function"

const mockFactory = (props?: Record<PropertyKey, unknown>): unknown => {
  const mapper: Record<PropertyKey, unknown> = props ?? {}

  const handler = (
    scope: Record<PropertyKey, unknown>,
    currentPathCache: Map<unknown, unknown>
  ): ProxyHandler<object> => ({
    apply(target: object, thisArg: unknown, argArray: unknown[]): unknown {
      if (typeof target === "function") {
        return Reflect.apply(target, thisArg, argArray)
      }

      return undefined
    },

    get(target: object, prop: string | symbol): unknown {
      if (prop === "mocked") {
        const underlyingSpy: unknown = spyMapper.get(target)
        const activeSpy: object = isCallable(underlyingSpy) ? underlyingSpy : target

        return new Proxy(activeSpy, {
          get(mockTarget: object, mockProp: string | symbol): unknown {
            if (mockProp === "calls" || mockProp === "results") {
              const mockState: unknown = Reflect.get(mockTarget, "mock")
              if (isObject(mockState)) {
                return Reflect.get(mockState, mockProp)
              }

              return []
            }

            return Reflect.get(mockTarget, mockProp)
          }
        })
      }

      if (prop === "then") {
        return undefined
      }

      if (
        prop === "constructor" ||
        prop === "inspect" ||
        prop === "toJSON" ||
        prop === "toString" ||
        prop === "valueOf" ||
        typeof prop === "symbol"
      ) {
        return undefined
      }

      const cached: unknown = currentPathCache.get(prop)
      if (cached !== undefined) {
        return cached
      }

      if (typeof prop === "string" && (prop.startsWith("asymmetricMatch") || prop.startsWith("@@__"))) {
        return undefined
      }

      const value: unknown = typeof prop === "string" ? scope[prop] : undefined

      const isTrackedMock: boolean =
        value !== null && (typeof value === "object" || typeof value === "function") && spyMapper.has(value)

      if (isTrackedMock && isMockTarget(value)) {
        const spy: unknown = spyMapper.get(value)
        const activeSpy: TrackedMockInstance = isCallable(spy) ? spy : mock<StrictAsyncFunction>()

        const targetShell = (): Promise<unknown> => Promise.resolve(value)
        spyMapper.set(targetShell, activeSpy)

        const nextScope: Record<PropertyKey, unknown> = isObject(value) ? value : {}
        const nestedProxy: unknown = wrapper(targetShell, handler(nextScope, new Map()))

        if (isObject(activeSpy)) {
          const resolver: unknown = Reflect.get(activeSpy, "mockImplementation")
          if (isCallable(resolver)) {
            Reflect.apply(resolver, activeSpy, [(): Promise<unknown> => Promise.resolve(nestedProxy)])
          }
        }

        if (isObject(nestedProxy)) {
          spyMapper.set(nestedProxy, activeSpy)
        }

        currentPathCache.set(prop, nestedProxy)
        return nestedProxy
      }

      if (Object.hasOwn(scope, prop)) {
        const rawValue: unknown = Reflect.get(scope, prop)

        if (isObject(rawValue)) {
          const nestedProxy: unknown = wrapper({}, handler(rawValue, new Map()))
          currentPathCache.set(prop, nestedProxy)
          return nestedProxy
        }

        currentPathCache.set(prop, rawValue)
        return rawValue
      }

      if (Object.hasOwn(target, prop)) {
        return Reflect.get(target, prop)
      }

      let nestedScope: Record<PropertyKey, unknown> = {}
      if (!isTrackedMock && isObject(value)) {
        nestedScope = value
      }

      const spyHandler: ProxyHandler<object> = handler(nestedScope, new Map())
      const spy: TrackedMockInstance = mock<StrictAsyncFunction>()

      Object.defineProperty(spy, "mocked", {
        configurable: true,
        get(): unknown {
          return Reflect.get(spy, "mock")
        }
      })

      const targetShell = (): undefined => undefined
      spyMapper.set(targetShell, spy)

      const nestedProxy: unknown = wrapper(targetShell, spyHandler)

      spy.mockImplementation((): Promise<unknown> => Promise.resolve(nestedProxy))

      if (isObject(nestedProxy)) {
        spyMapper.set(nestedProxy, spy)
      }
      currentPathCache.set(prop, nestedProxy)

      return nestedProxy
    },

    getOwnPropertyDescriptor(target: object, prop: string | symbol): PropertyDescriptor | undefined {
      if (Object.hasOwn(scope, prop)) {
        return {
          configurable: true,
          enumerable: true,
          value: scope[prop],
          writable: true
        }
      }

      if (Object.hasOwn(target, prop)) {
        return Reflect.getOwnPropertyDescriptor(target, prop)
      }

      return undefined
    },

    has(target: object, prop: string | symbol): boolean {
      if (prop in scope || Object.hasOwn(target, prop)) {
        return true
      }

      return typeof prop === "string" && !prop.startsWith("asymmetricMatch") && !prop.startsWith("@@__")
    },

    ownKeys(_target: object): ArrayLike<string | symbol> {
      return Reflect.ownKeys(scope)
    }
  })

  const rootTarget: object = {}
  const rootProxy: unknown = wrapper(rootTarget, handler(mapper, new Map()))

  const rootSpy: TrackedMockInstance = mock<StrictFunction>()
  if (isObject(rootProxy)) {
    spyMapper.set(rootProxy, rootSpy)
  }
  spyMapper.set(rootTarget, rootSpy)

  return rootProxy
}

Object.defineProperty(globalThis, "createMock", {
  value: mockFactory
})
