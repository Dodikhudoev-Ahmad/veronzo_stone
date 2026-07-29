// A product's pending choice for one ProductAttributeDefinition -- mirrors
// ProductAttributeValueRequest minus productId (the product doesn't exist yet
// in create mode, see useSyncProductAttributeValues.ts).
export interface AttributeSelection {
  definitionId: number;
  optionId: number | null;
  textValue: string | null;
}
