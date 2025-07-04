# JSON File Transform

GitHub Action to easily replace values in a JSON file.

## Inputs

### `files`

**Required**. File search pattern to determine which files to transform.

### `key-value-pairs`

List of key-value pairs to replace in the JSON file. The key-value pairs should all be on separate lines and in the format `key=value`. Key can be a dot-separated path to a nested value. Use numbers to access array elements. Use a backslash to escape in the key if needed. If a given key does not exist in the JSON file, it will be ignored.

### `follow-symbolic-links`

Whether to follow symbolic links when searching for files. Default is `true`.

## Usage

**Important**: This action will overwrite the files in place. Fields are only replaced, not added, so make sure the JSON file already contains the fields you want to replace.

Assuming a secret `DB_CONNECTION_STRING` exists, the following example shows how to replace values in a JSON file:

```yaml
- name: Replace values in JSON file
  uses: tnikFi/json-file-transform@v3
  with:
    files: '**/appsettings.json'
    key-value-pairs: |
      ConnectionStrings.DefaultConnection=${{ secrets.DB_CONNECTION_STRING }}
      Logging.LogLevel.Default=Information
      AllowedHosts=localhost
      Authentication.Oauth.Scopes=openid, profile, email
```

This will replace the values in the JSON file `appsettings.json` with the values specified in the `key-value-pairs` input. The replaced values will be written back to the file. The following fields will be updated in the JSON file:

```json
{
  "AllowedHosts": "localhost",
  "ConnectionStrings": {
    "DefaultConnection": "Server=myServerAddress;Database=myDataBase;User Id=myUsername;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  },
  "Authentication": {
    "Oauth": {
      "Scopes": [
        "openid",
        "profile",
        "email"
      ]
    }
  }
}
```

## Replacement Rules

- If the key is a dot-separated path, it will traverse the JSON object to find the value to replace.
- Individual array elements can be accessed using their index (e.g., `array.0`).
- If the key refers to an array, the entire array will be replaced with an array of strings parsed from the comma, semicolon, or newline-separated replacement.
- Backslashes (`\`) can be used to escape delimiters in keys and comma-separated values.
- If the key does not exist in the JSON file, it will be ignored silently.
