export interface ProductAttribute {
  name: string
  value: string
}

/**
 * Get an attribute value from a product's attributes array
 */
export function getAttributeValue(
  attributes: ProductAttribute[] | undefined | null,
  attributeName: string,
  defaultValue: string = 'Not specified'
): string {
  if (!attributes || !Array.isArray(attributes)) {
    return defaultValue
  }

  const attribute = attributes.find(
    attr => attr.name?.toLowerCase() === attributeName.toLowerCase()
  )

  return attribute?.value || defaultValue
}

/**
 * Get multiple attribute values as an object
 */
export function getAttributeValues(
  attributes: ProductAttribute[] | undefined | null,
  attributeNames: string[],
  defaultValue: string = 'Not specified'
): Record<string, string> {
  const result: Record<string, string> = {}
  
  attributeNames.forEach(name => {
    result[name] = getAttributeValue(attributes, name, defaultValue)
  })
  
  return result
}

/**
 * Common product attributes with their display names
 */
export const COMMON_ATTRIBUTES = {
  COLOR: 'color',
  MATERIAL: 'material',
  SIZE: 'size',
  BRAND: 'brand',
  WEIGHT: 'weight',
  DIMENSIONS: 'dimensions',
  WARRANTY: 'warranty',
  CARE_INSTRUCTIONS: 'care instructions',
  LANGUAGE: 'language',
  PAGES: 'pages',
  PUBLISHER: 'publisher',
  ISBN: 'isbn',
} as const

/**
 * Get common attributes for display
 */
export function getCommonAttributes(
  attributes: ProductAttribute[] | undefined | null
): {
  color: string
  material: string
  size: string
  brand: string
  warranty: string
} {
  return {
    color: getAttributeValue(attributes, COMMON_ATTRIBUTES.COLOR),
    material: getAttributeValue(attributes, COMMON_ATTRIBUTES.MATERIAL),
    size: getAttributeValue(attributes, COMMON_ATTRIBUTES.SIZE),
    brand: getAttributeValue(attributes, COMMON_ATTRIBUTES.BRAND),
    warranty: getAttributeValue(attributes, COMMON_ATTRIBUTES.WARRANTY),
  }
}