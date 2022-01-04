export interface Unsubscribable {
  unsubscribe(): void;
}
export interface Subscribable<TValue, TError> {
  subscribe(observer: Partial<Observer<TValue, TError>>): Unsubscribable;
}
export interface Observable<TValue, TError>
  extends Subscribable<TValue, TError> {
  pipe(): Observable<TValue, TError>;
  pipe<V1, E1>(
    op1: OperatorFunction<TValue, TError, V1, E1>,
  ): Observable<V1, E1>;
  pipe<V1, E1, V2, E2>(
    op1: OperatorFunction<TValue, TError, V1, E1>,
    op2: OperatorFunction<V1, E1, V2, E2>,
  ): Observable<V2, E2>;
}
export interface SubscriptionLike extends Unsubscribable {
  unsubscribe(): void;
  readonly closed: boolean;
}

export interface Observer<TValue, TError> {
  next: (value: TValue) => void;
  error: (err: TError) => void;
  complete: () => void;
}

export type TeardownLogic =
  // | SubscriptionLike
  // | Unsubscribable
  (() => void) | void;

export type UnaryFunction<T, R> = (source: T) => R;

export type OperatorFunction<
  TValueBefore,
  TErrorBefore,
  TValueAfter,
  TErrorAfter,
> = UnaryFunction<
  Subscribable<TValueBefore, TErrorBefore>,
  Subscribable<TValueAfter, TErrorAfter>
>;

export type MonoTypeOperatorFunction<TValue, TError> = OperatorFunction<
  TValue,
  TError,
  TValue,
  TError
>;