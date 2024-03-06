import fsExtra from 'fs-extra';
import {resolve} from 'pathe';
import {minifyHTMLLiterals} from 'minify-html-literals';
import * as sass from 'sass';
import {nanoid} from 'nanoid';

import {cleanDir, listDir} from './file.js';
import {getTargetEnv} from './project.js';
import {TiniConfig, getTiniApp} from './tini.js';

const {remove, exists, ensureDir, copy, copyFile, readFile, outputFile} =
  fsExtra;
const {compileStringAsync} = sass;

export function getAppStagingDirPath(stagingDir: string) {
  return resolve(stagingDir, 'app');
}

export async function buildStaging() {
  const {
    config: {srcDir, stagingDir},
  } = await getTiniApp();
  const srcPath = resolve(srcDir);
  const stagingPath = getAppStagingDirPath(stagingDir);
  await cleanDir(stagingPath);
  const paths = await listDir(srcPath);
  for (let i = 0; i < paths.length; i++) {
    await buildFile(paths[i], stagingPath, srcDir);
  }
  return stagingPath;
}

export async function copyPublic(srcDir: string, outDir: string) {
  const inPath = resolve(srcDir, 'public');
  const outPath = resolve(outDir);
  if ((await exists(inPath)) && (await exists(outPath))) {
    await copy(inPath, outPath);
  }
}

export async function removeFile(
  path: string,
  stagingPath: string,
  srcDir: string
) {
  const {outFilePath} = extractPathValues(resolve(path), stagingPath, srcDir);
  return remove(outFilePath);
}

export async function buildFile(
  path: string,
  stagingPath: string,
  srcDir: string
) {
  path = resolve(path);
  const {fileName, fileExt, dirPath, outFilePath} = extractPathValues(
    path,
    stagingPath,
    srcDir
  );
  const {config: tiniConfig} = await getTiniApp();
  // create dir
  await ensureDir(resolve(stagingPath, dirPath));
  // app.html -> index.html
  if (fileName === 'app.html') {
    await outputFile(
      outFilePath.replace('/app.html', '/index.html'),
      await buildIndexHTML(path)
    );
  } else if (fileExt === 'ts') {
    await outputFile(outFilePath, await buildTS(path, tiniConfig));
  } else {
    await copyFile(path, outFilePath);
  }
}

function buildIndexHTML(path: string) {
  return readFile(path, 'utf8');
}

async function buildTS(path: string, tiniConfig: TiniConfig) {
  const targetEnv = getTargetEnv();
  const isDev = targetEnv === 'development';
  const isMain = isAppEntry(path);
  const isConfig = isConfigFile(path);
  let content = await readFile(path, 'utf8');

  /*
   * 1. Configs
   */
  // inject envs
  if (isConfig) {
    content = injectEnvs(content);
  }
  // replace imports
  if (!isDev) {
    content = content.replace(
      /(\/configs\/development)/g,
      `/configs/${targetEnv}`
    );
  }

  /*
   * 2. HTML, CSS, Assets
   */
  content = processAssets(content);
  content = processHTML(content, isDev, tiniConfig);
  content = await processCSS(content, isDev);

  // result
  return content;
}

function isAppEntry(filePath: string) {
  return filePath.match(/\/?app\/app.ts$/);
}

function isConfigFile(filePath: string) {
  return ~filePath.indexOf(`configs/${getTargetEnv()}.ts`);
}

function extractPathValues(
  fullPath: string,
  stagingPath: string,
  srcDir: string
) {
  const filePath = fullPath.split(`/${srcDir}/`).pop() as string;
  const outFilePath = resolve(stagingPath, filePath);
  const filePathArr = filePath.split('/');
  const fileName = filePathArr.pop() as string;
  const fileExt = fileName.split('.').pop();
  const dirPath = filePathArr.join('/');
  const topDir = filePath.split('/')[0];
  return {filePath, outFilePath, fileName, fileExt, dirPath, topDir};
}

function injectEnvs(content: string) {
  const envMatchingArr = content.match(/process\.env\.([\s\S]*?)(,|\n)/g);
  if (envMatchingArr?.length) {
    envMatchingArr.forEach(envMatching => {
      const replaceStr = envMatching.replace(/,|\n/g, '');
      content = content.replace(
        replaceStr,
        `"${process.env[replaceStr.replace('process.env.', '')]}"`
      );
    });
  }
  return content;
}

function processHTML(content: string, isDev: boolean, tiniConfig: TiniConfig) {
  const templateMatching = content.match(/(return html`)([\s\S]*?)(`;)/);
  // no return html`...`
  if (!templateMatching) return content;
  // process generic component
  if (tiniConfig.precompileGeneric === 'lite') {
    const genericMatchingArr = content.match(
      /<tini-generic(-unscoped)?([\s\S]*?)>/g
    );
    genericMatchingArr?.forEach(genericMatching => {
      if (~genericMatching.indexOf('precomputed=')) return;
      const tag = ~genericMatching.indexOf('-unscoped')
        ? 'tini-generic-unscoped'
        : 'tini-generic';
      content = content.replace(
        genericMatching,
        genericMatching.replace(`<${tag}`, `<${tag} precomputed="${nanoid(7)}"`)
      );
    });
  } else if (tiniConfig.precompileGeneric === 'full') {
    // TODO: full precompile
  }
  // dev mode
  if (isDev) return content;
  // minify
  const matchedTemplate = templateMatching[0];
  let minifiedTemplate: string;
  try {
    if (tiniConfig.skipMinifyHtmlLiterals) {
      minifiedTemplate = matchedTemplate;
    } else {
      const result = minifyHTMLLiterals(matchedTemplate);
      if (!result) throw new Error('minifyHTMLLiterals() failed.');
      minifiedTemplate = result.code;
    }
  } catch (err) {
    minifiedTemplate = matchedTemplate;
  }
  return content.replace(matchedTemplate, minifiedTemplate);
}

async function processCSS(content: string, isDev: boolean) {
  const stylesMatchingArr = content.match(/(css`)([\s\S]*?)(`,|`;)/g);
  // no css``
  if (!stylesMatchingArr) return content;
  // compile scss
  for (let i = 0; i < stylesMatchingArr.length; i++) {
    const styleMatching = stylesMatchingArr[i];
    // original
    let originalStyles = styleMatching.replace('css`', '');
    originalStyles = originalStyles.substring(0, originalStyles.length - 2);
    // compile
    let compiledStyles: string;
    try {
      compiledStyles = (
        await compileStringAsync(originalStyles, {
          style: isDev ? 'expanded' : 'compressed',
        })
      ).css;
    } catch (err) {
      compiledStyles = isDev
        ? originalStyles
        : originalStyles.replace(/(?:\r\n|\r|\n)/g, '').replace(/\s\s+/g, ' ');
    }
    // replacing
    content = content.replace(originalStyles, compiledStyles);
  }
  return content;
}

function processAssets(content: string) {
  const formats = [
    // images
    'jpe?g',
    'png',
    'webp',
    'svg',
    'bmp',
    'gif',
    'ico',
    'tiff?',
    // audios
    'mp3',
    'ogg',
    'aac',
    'wav',
    'midi?',
    // videos
    'mp4',
    'webm',
    'flv',
    'm3u8',
    'mpd',
    // fonts
    'ttf',
    'otf',
    'woff2?',
    // documents
    'txt',
    'md',
    'pdf',
    'docx?',
    'pptx?',
    'xlsx?',
    'odt',
  ];
  const lookups = [
    ['src="', '"'],
    ['srcset="', '"'],
    ['href="', '"'],
    ["url\\('", "'\\)"],
    ["asset\\('", "'\\)"],
  ];
  const validator = new RegExp(`\\.(${formats.join('|')})`, 'i');
  for (let i = 0; i < lookups.length; i++) {
    const [A, B] = lookups[i];
    const matchingArr = (
      content.match(new RegExp(`(${A})([\\s\\S]*?)(${B})`, 'g')) || []
    ).filter(item => validator.test(item));
    for (let i = 0; i < matchingArr.length; i++) {
      const originalStr = matchingArr[i];
      const url = originalStr
        .replace(A.replace('\\', ''), '')
        .replace(B.replace('\\', ''), '');
      const URL = `new URL('${url}', import.meta.url)`;
      // build new str
      let newStr = originalStr;
      if (/(src|srcset|href)/.test(A)) {
        const newA = A.replace('"', '');
        const newB = '';
        newStr = `${newA}\${${URL}}${newB}`;
      } else if (/(url)/.test(A)) {
        const newA = A.replace(/(\\|')/g, '');
        const newB = ')';
        newStr = `${newA}\${${URL}}${newB}`;
      } else {
        newStr = URL;
      }
      // apply new content
      content = content.replace(originalStr, newStr);
    }
  }
  return content;
}
