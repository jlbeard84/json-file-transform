const { test, expect } = require('@jest/globals')
const { parseReplacements, transformJsonFile, transformObject } = require('../src/tokenReplacement')
const { describe } = require('node:test')
const fs = require('fs')

describe('Replacement parsing', () => {
  test('Parsed correctly', () => {
    const replacements = 'key1=value1\nkey2=value2\nkey3=value3'
    const parsedReplacements = parseReplacements(replacements)
    expect(parsedReplacements).toEqual({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    })
  })

  test('Empty replacements are parsed correctly', () => {
    const replacements = ''
    const parsedReplacements = parseReplacements(replacements)
    expect(parsedReplacements).toEqual({})
  })

  test('Empty replacement values are parsed correctly', () => {
    const replacements = 'key1=\nkey2=\nkey3='
    const parsedReplacements = parseReplacements(replacements)
    expect(parsedReplacements).toEqual({
      key1: '',
      key2: '',
      key3: '',
    })
  })

  test('Replacements with spaces are parsed correctly', () => {
    const replacements = 'key1 = value1\n   key2 = value 2\nkey3    = value3'
    const parsedReplacements = parseReplacements(replacements)
    expect(parsedReplacements).toEqual({
      key1: 'value1',
      key2: 'value 2',
      key3: 'value3',
    })
  })

  test('Replacements with multiple equal signs are parsed correctly', () => {
    const replacements = 'key1=value1=value2\nkey2=value2=value3\nkey3=value3'
    const parsedReplacements = parseReplacements(replacements)
    expect(parsedReplacements).toEqual({
      key1: 'value1=value2',
      key2: 'value2=value3',
      key3: 'value3',
    })
  })

  test('Long numbers are parsed as strings', () => {
    const replacements = 'key1=1234567890123456789012345678901234567890'
    const parsedReplacements = parseReplacements(replacements)
    expect(parsedReplacements).toEqual({
      key1: '1234567890123456789012345678901234567890',
    })
  })
})

describe('JSON object transformation', () => {
  test('Correct when all keys are replaced', () => {
    const obj = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    }
    const replacements = {
      key1: 'new value 1',
      key2: 'new value 2',
      key3: 'new value 3',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2', 'key3'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: 'new value 2',
      key3: 'new value 3',
    })
  })

  test('Correct when some keys are replaced', () => {
    const obj = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    }
    const replacements = {
      key1: 'new value 1',
      key3: 'new value 3',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key3'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: 'value2',
      key3: 'new value 3',
    })
  })

  test('Correct when no keys are replaced', () => {
    const obj = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    }
    const replacements = {
      key4: 'new value 4',
      key5: 'new value 5',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual([])
    expect(obj).toEqual({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    })
  })

  test('Correct when object is empty', () => {
    const obj = {}
    const replacements = {
      key1: 'new value 1',
      key2: 'new value 2',
      key3: 'new value 3',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual([])
    expect(obj).toEqual({})
  })

  test('Correct when replacements object is empty', () => {
    const obj = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    }
    const replacements = {}
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual([])
    expect(obj).toEqual({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    })
  })

  test('Correct when both objects are empty', () => {
    const obj = {}
    const replacements = {}
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual([])
    expect(obj).toEqual({})
  })

  test('Correct with nested objects', () => {
    const obj = {
      key1: 'value1',
      key2: {
        key3: 'value3',
        key4: 'value4',
      },
      key5: 'value5',
    }
    const replacements = {
      key1: 'new value 1',
      'key2.key3': 'new value 3',
      key5: 'new value 5',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2.key3', 'key5'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: {
        key3: 'new value 3',
        key4: 'value4',
      },
      key5: 'new value 5',
    })
  })

  test('Works with arrays', () => {
    const obj = {
      key1: 'value1',
      key2: ['value2', 'value3'],
    }
    const replacements = {
      key1: 'new value 1',
      'key2.0': 'new value 2',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2.0'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: ['new value 2', 'value3'],
    })
  })

  test('Works with nested arrays', () => {
    const obj = {
      key1: 'value1',
      key2: [
        ['value2', 'value3'],
        ['value4', 'value5'],
      ],
    }
    const replacements = {
      key1: 'new value 1',
      'key2.1.1': 'new value 4',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2.1.1'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: [
        ['value2', 'value3'],
        ['value4', 'new value 4'],
      ],
    })
  })

  test('Works with nested arrays and objects', () => {
    const obj = {
      key1: 'value1',
      key2: [
        {
          key3: 'value3',
          key4: 'value4',
        },
        {
          key5: 'value5',
          key6: 'value6',
        },
      ],
    }
    const replacements = {
      key1: 'new value 1',
      'key2.1.key5': 'new value 5',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2.1.key5'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: [
        {
          key3: 'value3',
          key4: 'value4',
        },
        {
          key5: 'new value 5',
          key6: 'value6',
        },
      ],
    })
  })

  test('Works with escaped dots', () => {
    const obj = {
      key1: 'value0',
      'key1.key2': 'value1',
      'key3.key4': 'value2',
    }
    const replacements = {
      'key1\\.key2': 'new value 1',
      'key3\\.key4': 'new value 2',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1\\.key2', 'key3\\.key4'])
    expect(obj).toEqual({
      key1: 'value0',
      'key1.key2': 'new value 1',
      'key3.key4': 'new value 2',
    })
  })

  test('Works with numbers', () => {
    const obj = {
      key1: 'value1',
      key2: 2,
    }
    const replacements = {
      key1: 'new value 1',
      key2: '3',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: 3,
    })
  })

  test('Works with booleans', () => {
    const obj = {
      key1: 'value1',
      key2: true,
    }
    const replacements = {
      key1: 'new value 1',
      key2: 'false',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: false,
    })
  })

  test('Works with null', () => {
    const obj = {
      key1: 'value1',
      key2: null,
    }
    const replacements = {
      key1: 'new value 1',
      key2: 'new value 2',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: 'new value 2',
    })
  })

  test('Does not change string values to numbers', () => {
    const obj = {
      key1: 'value1',
      key2: '2',
    }
    const replacements = {
      key1: 'new value 1',
      key2: '3',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: '3',
    })
  })

  test('Replaces complete arrays with new arrays', () => {
    const obj = {
      key1: 'value1',
      key2: ['value2', 'value3'],
    }
    const replacements = {
      key1: 'new value 1',
      key2: 'new value 2, new value 3',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: ['new value 2', 'new value 3'],
    })
  })

  test('Replaces arrays with empty arrays if replacement is empty', () => {
    const obj = {
      key1: 'value1',
      key2: ['value2', 'value3'],
    }
    const replacements = {
      key1: 'new value 1',
      key2: '',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: [],
    })
  })

  test('Replaces arrays with single values', () => {
    const obj = {
      key1: 'value1',
      key2: ['value2', 'value3'],
    }
    const replacements = {
      key1: 'new value 1',
      key2: 'new value 2',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: ['new value 2'],
    })
  })

  test('Preserves array-like strings if original value was a string', () => {
    const obj = {
      key1: 'value1',
      key2: 'value2',
    }
    const replacements = {
      key1: 'new value 1',
      key2: 'new value 2,new value 3',
    }
    const replacedKeys = transformObject(obj, replacements)
    expect(replacedKeys).toEqual(['key1', 'key2'])
    expect(obj).toEqual({
      key1: 'new value 1',
      key2: 'new value 2,new value 3',
    })
  })
})

describe('File transformations', () => {
  test('Correctly transforms JSON file', () => {
    const input = './__tests__/test.json'
    const output = './__tests__/test_output.json'
    const replacements = {
      key1: 'new value 1',
      'array.0': 'new array value 1',
      'object.objectKey1': 'new object value 1',
    }
    const replacedKeys = transformJsonFile(input, output, replacements)
    const transformedContent = require('.' + output)
    expect(transformedContent).toEqual({
      key1: 'new value 1',
      key2: "value2",
      array: ['new array value 1', 'arrayValue2', 'arrayValue3'],
      object: {
        objectKey1: 'new object value 1',
        objectKey2: 'objectValue2',
      },
    })
    expect(transformedContent).not.toEqual(require('.' + input))
    expect(replacedKeys).toEqual(['key1', 'array.0', 'object.objectKey1'])
    fs.unlinkSync(output)
  })
})
