export type AdtVariant<K extends string, V> = {
  kind: K;
  value: V;
};

export type AdtVariantConstructor<K extends string, V> = {
  (v: V): AdtVariant<K, V>;
  kind: K;
};

export function adt<K extends string, V>(kind: K): AdtVariantConstructor<K, V> {
  const variantConstructor = (value: V) => ({
    kind,
    value,
  });

  variantConstructor.kind = kind;

  return variantConstructor;
}

export function assertNever(x: never): never {
  throw new Error('impossible');
}
