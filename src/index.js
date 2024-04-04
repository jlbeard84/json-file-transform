const core = require('@actions/core')
const glob = require('@actions/glob')
const { parseReplacements, transformJsonFile } = require('./tokenReplacement')

const transformFile = (file, replacements) => {
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
  const globber = await glob.create(pattern)
  for await (const file of globber.globGenerator()) {
    try {
      transformFile(file, replacements)
    } catch (error) {
      core.error(`Error transforming file: ${file}`)
      core.error(error)
      throw error
    }
  }
}

action()
  .then(() => core.info('Token replacement completed successfully'))
  .catch((error) => core.setFailed(error))
