interface Window {
  /** Spec renderer installed by visual-harness.html. */
  __renderSpec: (spec: unknown) => Promise<void>;
}
