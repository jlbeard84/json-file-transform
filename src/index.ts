import core from '@actions/core'
import { glob } from 'glob'
import { parseReplacements, transformJsonFile } from './tokenReplacement'

const transformFile = async (file: string, replacements: Record<string, string>) => {
  core.info(`Transforming file: ${file}`)
  const transformedKeys = transformJsonFile(file, file, replacements)
  if (transformedKeys.length > 0) {
    core.info(transformedKeys.map((key) => `\tReplaced key: ${key}`).join('\n'))
    core.info(`${transformedKeys.length} key(s) replaced in file: ${file}`)
  } else {
    core.warning(`No keys replaced in file: ${file}`)
  }
}

const action = async () => {
  const replacementsString = core.getInput('replacements')
  const replacements = parseReplacements(replacementsString)
  const pattern = core.getInput('files')
  const files = await glob(pattern)
  for (const file of files) {
    try {
      transformFile(file, replacements)
    } catch (error) {
      core.error(`Error transforming file: ${file}`)
      core.error(error as Error)
      throw error
    }
  }
}

action()
  .then(() => core.info('Token replacement completed successfully'))
  .catch((error) => core.setFailed(error.message))
