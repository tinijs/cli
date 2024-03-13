import {existsSync} from 'node:fs';
import {copy} from 'fs-extra/esm';
import {resolve} from 'pathe';
import {execaCommand} from 'execa';

import {
  TiniApp,
  TiniConfig,
  OfficialPrebuilders,
  Prebuilder,
  OfficialBuilders,
  Builder,
} from '@tinijs/core';

import {TINIJS_INSTALL_DIR_PATH} from '../utils/project.js';

export function getIndexHtmlPath({srcDir, tempDir, prebuild}: TiniConfig) {
  return prebuild === false ? `${srcDir}/index.html` : `${tempDir}/index.html`;
}

export async function loadPrebuilder(tiniApp: TiniApp) {
  const {prebuild} = tiniApp.config;
  // disable prebuild
  if (prebuild === false) return null;
  // custom prebuild
  if (prebuild instanceof Function) return prebuild(tiniApp);
  // official prebuild
  const {prebuilder = OfficialPrebuilders.Default, options = {}} =
    prebuild || {};
  return loadPrebuilderOrBuilder<Prebuilder>(
    `${prebuilder}-prebuilder`,
    options,
    tiniApp
  );
}

export async function loadBuilder(tiniApp: TiniApp) {
  const {build} = tiniApp.config;
  // custom build
  if (build instanceof Function) return build(tiniApp);
  // official build
  const {builder = OfficialBuilders.Parcel, options = {}} = build || {};
  return loadPrebuilderOrBuilder<Builder>(
    `${builder}-builder`,
    options,
    tiniApp
  );
}

export async function buildPublic({srcDir, outDir, dirs}: TiniConfig) {
  const dirName = dirs?.public || 'public';
  const inPath = resolve(srcDir, dirName);
  const outPath = resolve(outDir);
  if (!existsSync(inPath)) return;
  return copy(inPath, outPath);
}

async function loadPrebuilderOrBuilder<Type>(
  packageName: string,
  options: any,
  tiniApp: TiniApp
) {
  const entryFilePath = resolve(
    TINIJS_INSTALL_DIR_PATH,
    packageName,
    'lib',
    'index.js'
  );
  if (!existsSync(entryFilePath)) {
    await execaCommand(`npm i @tinijs/${packageName}`, {stdio: 'ignore'});
  }
  const {default: create} = await import(entryFilePath);
  return create(options)(tiniApp) as Type;
}
