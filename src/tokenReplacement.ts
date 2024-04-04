import fs from 'fs'

/**
 * Splits a key string into an array of key parts, separated by dots. Escaped dots are treated as part of the key.
 * @param key Key to split
 * @returns Array of key parts
 */
const splitKey = (key: string) => key.match(/(\\.|[^.])+/g) || []

/**
 * Removes the first element of a key string
 * @param key Key to modify
 * @returns Modified key
 */
const getNextStepKey = (key: string) => splitKey(key).slice(1).join('.')

/**
 * Replaces a value in an object based on a string key
 * @param obj Object to replace the value in
 * @param key Key to replace the value of
 * @param value New value
 * @returns True if the value was replaced, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const replaceValue = (obj: any, key: string, value: any): boolean => {
  const currentKey = splitKey(key)[0]?.replace(/\\./g, '.') || ''
  const nextKey = getNextStepKey(key)
  const isLastKey = nextKey === ''
  if (!currentKey) {
    return false
  }
  // If the current key doesn't exist in the object, return false
  if (typeof obj[currentKey] === 'undefined') {
    return false
  }

  // Recurse into the object or array
  if (Array.isArray(obj)) {
    // If the object is an array, try to use the key as an array index
    const index = Number(currentKey)
    if (!isNaN(index)) {
      if (isLastKey) {
        obj[index] = value
        return true
      } else {
        return replaceValue(obj[index], nextKey, value)
      }
    }
  } else if (typeof obj[currentKey] === 'object' && obj[currentKey] !== null && !isLastKey) {
    // If the current key points to an object, recursively search for the next key
    return replaceValue(obj[currentKey], nextKey, value)
  }

  if ((typeof obj[currentKey] !== 'object' || obj[currentKey] === null) && !Array.isArray(obj)) {
    // If the current key points to a value that isn't an object or array, replace it
    // If the current value is a string, also convert the new value to a string to avoid type mismatch
    obj[currentKey] = typeof obj[currentKey] === 'string' ? String(value) : value
    return true
  }
  return false
}

/**
 * Parses the given value as a valid JSON data type
 * @param value String representation of the value
 * @returns The parsed value or the original value if it could not be parsed as a boolean, number or null
 */
const parseValue = (value?: string | null) => {
  if (!value) {
    return null
  } else if (value === 'true') {
    return true
  } else if (value === 'false') {
    return false
  } else if (!isNaN(Number(value))) {
    return Number(value)
  } else {
    return value
  }
}

/**
 * Replaces the value of the given key in the given JSON object
 * @param obj The JSON object
 * @param key The key to replace
 * @param value The value to replace the key with
 * @returns True if the value was replaced, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const replaceObjectValue = (obj: any, key: string, value: any) => {
  const parsedValue = parseValue(value)
  return replaceValue(obj, key, parsedValue)
}

/**
 * Replaces the values in the given object with the values in the given replacements object
 * @param obj Object to replace the values in
 * @param replacements Object containing the keys to replace and their new values
 * @returns Array of keys that were replaced
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformObject = (obj: any, replacements: Record<string, string>) => {
  const replacedKeys: string[] = []
  for (const key in replacements) {
    const replaced = replaceObjectValue(obj, key, replacements[key])
    if (replaced) {
      replacedKeys.push(key)
    }
  }
  return replacedKeys
}

/**
 * Parses the given replacements string into an object
 * @param replacements Replacements string in the format key=value, separated by newlines
 * @returns Object containing the keys to replace and their new values
 */
const parseReplacements = (replacements: string) => {
  const lines = replacements.split('\n')
  const replacementsObj: Record<string, string> = {}
  for (const line of lines) {
    const sections = line.trim().split('=')
    const key = sections[0]
    const value = sections.slice(1).join('=')
    if (!key) {
      continue
    }
    replacementsObj[key.trim()] = value?.trim() || ''
  }
  return replacementsObj
}

/**
 * Replaces the values in the given JSON file with the values in the given replacements object and writes the result to the output file
 * @param inputFilePath Path to the input file
 * @param outputFilePath Path to the output file
 * @param replacements Object containing the keys to replace and their new values
 * @returns Array of keys that were replaced successfully
 */
const transformJsonFile = (inputFilePath: string, outputFilePath: string, replacements: Record<string, string>) => {
  const fileContent = fs.readFileSync(inputFilePath, 'utf8')
  const obj = JSON.parse(fileContent)
  const replacedKeys = transformObject(obj, replacements)
  fs.writeFileSync(outputFilePath, JSON.stringify(obj, null, 2))
  return replacedKeys
}

export { parseReplacements, transformJsonFile, transformObject }
