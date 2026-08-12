// Global type augmentation to allow __pinPadWrongPin global callback
declare global {
  var __pinPadWrongPin: (() => void) | undefined;
}

export {};
