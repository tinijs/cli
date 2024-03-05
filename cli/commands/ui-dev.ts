import fsExtra from 'fs-extra';
import {resolve} from 'pathe';

import {success} from '../../lib/helpers/message.js';
import {cleanDir} from '../../lib/helpers/file.js';
import {loadProjectConfig} from '../../lib/helpers/project.js';
import {
  SoulAndSkins,
  COMPONENTS_DIR,
  BLOCKS_DIR,
  STYLES_DIR,
  devAndUseCopyGlobalFiles,
  devAndUseBuildSkins,
  devAndUseBuildBases,
  devAndUseBuildComponents,
} from '../../lib/helpers/ui.js';

const {readdir, writeJson} = fsExtra;

export default async function () {
  const {stagingDir} = await loadProjectConfig();
  const souls = (await readdir(resolve(STYLES_DIR))).filter(
    item => !~item.indexOf('.')
  );
  const destPath = resolve(stagingDir, 'ui');
  // clean dir
  await cleanDir(destPath);
  // copy global files
  await devAndUseCopyGlobalFiles(destPath, true);
  // build skins
  await devAndUseBuildSkins(destPath, await readSoulAndSkinsList(souls), true);
  // build bases
  await devAndUseBuildBases(
    `${STYLES_DIR}/${souls[0]}/base`,
    destPath,
    souls,
    true
  );
  // build components, blocks
  await devAndUseBuildComponents(COMPONENTS_DIR, destPath, souls, true);
  await devAndUseBuildComponents(BLOCKS_DIR, destPath, souls, true);
  await devAndUseBuildComponents(
    `custom-${COMPONENTS_DIR}`,
    destPath,
    souls,
    true
  );
  await devAndUseBuildComponents(`custom-${BLOCKS_DIR}`, destPath, souls, true);
  // package.json
  await writeJson(
    resolve(destPath, 'package.json'),
    {
      name: '@tinijs/ui',
      version: '0.0.0',
    },
    {spaces: 2}
  );
  // result
  success('Build ui package for developing.');
}

async function readSoulAndSkinsList(souls: string[]) {
  const result: SoulAndSkins[] = [];
  for (let i = 0; i < souls.length; i++) {
    const soul = souls[i];
    const skins = (await readdir(resolve(STYLES_DIR, soul, 'skins')))
      .filter(item => item.endsWith('.css'))
      .map(item => item.replace('.css', ''));
    result.push({soul, skins});
  }
  return result;
}
