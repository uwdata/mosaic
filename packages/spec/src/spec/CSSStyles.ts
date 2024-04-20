type OmittedProperties =
  | 'parentRule'
  | 'getPropertyPriority'
  | 'getPropertyValue'
  | 'item'
  | 'removeProperty'
  | 'setProperty';

export type CSSStyles = Partial<Omit<CSSStyleDeclaration, OmittedProperties>>;
