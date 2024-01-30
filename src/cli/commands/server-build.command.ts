import {resolve} from 'path';
import {blueBright, green} from 'chalk';
import {createHash} from 'crypto';
import * as ora from 'ora';
import * as matter from 'gray-matter';
import * as toml from 'toml';
import {decodeHTML} from 'entities';
import {minify} from 'html-minifier';

import {ERROR} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {TerminalService} from '../../lib/services/terminal.service';
import {
  ProjectService,
  ProjectOptions,
} from '../../lib/services/project.service';

export class ServerBuildCommand {
  constructor(
    private fileService: FileService,
    private terminalService: TerminalService,
    private projectService: ProjectService
  ) {}

  async run(solutionName: string) {
    if (!solutionName || !~['basic'].indexOf(solutionName)) {
      return console.log(
        '\n' +
          ERROR +
          `Solution ${blueBright(solutionName)} is not available.\n`
      );
    }
    const options = await this.projectService.getOptions();
    // basic
    if (solutionName === 'basic') {
      return this.buildBasic(options);
    }
  }

  private async buildBasic({stagingPrefix, outDir}: ProjectOptions) {
    const eleventyConfigPath = resolve('content', 'eleventy.config.js');
    if (!(await this.fileService.exists(eleventyConfigPath))) {
      return console.log(
        '\n' +
          ERROR +
          `Invalid ${blueBright(
            'basic'
          )} solution (no content/eleventy.config.js found).\n`
      );
    }
    const stagingDir = `${stagingPrefix}-content`;
    const srcPath = resolve(stagingDir);
    const destPath = resolve(outDir);
    // 11ty render
    console.log('');
    const spinner = ora('Compile content using 11ty ...\n').start();
    this.terminalService.exec(
      `npx @11ty/eleventy --config="${eleventyConfigPath}"`,
      '.',
      'ignore'
    );
    // read content
    spinner.text = 'Read content from staging ...';
    const {copyPaths, buildPaths} = (
      await this.fileService.listDir(srcPath)
    ).reduce(
      (result, item) => {
        if (
          ~item.indexOf('/uploads/') ||
          ~item.indexOf(`/${stagingDir}/images/`) ||
          !item.endsWith('.html')
        ) {
          result.copyPaths.push(item);
        } else {
          result.buildPaths.push(item);
        }
        return result;
      },
      {
        copyPaths: [] as string[],
        buildPaths: [] as string[],
      }
    );

    // create tini-content dir
    const tiniContentPath = resolve(destPath, 'tini-content');
    await this.fileService.createDir(tiniContentPath);

    // copy
    spinner.text = 'Copy uploaded content ...';
    await Promise.all(
      copyPaths.map(async path => {
        const filePath = path.replace(stagingDir, `${outDir}/tini-content`);
        await this.fileService.createDir(filePath.replace(/\/[^\/]+$/, ''));
        return this.fileService.copyFile(path, filePath);
      })
    );

    // build
    const indexRecord = {} as Record<string, string>;
    const collectionRecord = {} as Record<string, Record<string, any>>;
    const fulltextSearchRecord = {} as Record<string, Record<string, any>>;

    for (let i = 0; i < buildPaths.length; i++) {
      const path = buildPaths[i];
      const [collection, slug] = path
        .split(`/${stagingDir}/`)
        .pop()!
        .replace(/\/[^\/]+$/, '')
        .split('/');

      spinner.text = `Build: ${green(`${collection}/${slug}`)} ...`;

      // process raw content
      let rawContent = await this.fileService.readText(path);
      rawContent = rawContent.replace(/(<p>\+\+\+)|(\+\+\+<\/p>)/g, '+++');
      const matterMatching = rawContent.match(/\+\+\+([\s\S]*?)\+\+\+/);
      if (!matterMatching) continue;
      const matterData = decodeHTML(matterMatching[1].replace(/\\n\\/g, '\n'));
      rawContent = rawContent.replace(matterMatching[0], `---${matterData}---`);

      // item
      const digest = createHash('sha256')
        .update(rawContent)
        .digest('base64url');
      const {content, data} = matter(rawContent, {
        engines: {
          toml: toml.parse.bind(toml),
        },
      });
      const itemFull = {
        ...(data.moredata || {}),
        ...data,
        id: digest,
        slug,
        content: minify(content, {
          html5: true,
          decodeEntities: true,
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeComments: true,
          removeOptionalTags: true,
          sortAttributes: true,
          sortClassName: true,
        }),
        moredata: undefined,
      };
      delete itemFull.moredata;
      await this.fileService.createJson(
        resolve(tiniContentPath, `${digest}.json`),
        itemFull,
        true
      );
      indexRecord[`${collection}/${slug}`] = digest;

      // collection
      collectionRecord[collection] ||= {};
      const itemForListing = {
        ...data,
        id: digest,
        moredata: undefined,
        metadata: undefined,
      };
      delete itemForListing.moredata;
      delete itemForListing.metadata;
      collectionRecord[collection][slug] = itemForListing;

      // fulltext search
      fulltextSearchRecord[collection] ||= {};
      fulltextSearchRecord[collection][slug] = this.buildSearchContent(
        content,
        data
      );
    }

    spinner.text = 'Write collections, search and index ...';

    // collections
    for (const [collection, items] of Object.entries(collectionRecord)) {
      const digest = createHash('sha256')
        .update(JSON.stringify(items))
        .digest('base64url');
      await this.fileService.createJson(
        resolve(tiniContentPath, `${digest}.json`),
        items,
        true
      );
      indexRecord[collection] = digest;
    }

    // search
    for (const [collection, items] of Object.entries(fulltextSearchRecord)) {
      const digest = createHash('sha256')
        .update(JSON.stringify(items))
        .digest('base64url');
      await this.fileService.createJson(
        resolve(tiniContentPath, `${digest}.json`),
        items,
        true
      );
      indexRecord[`${collection}-search`] = digest;
    }

    // index
    await this.fileService.createJson(
      resolve(tiniContentPath, 'index.json'),
      indexRecord,
      true
    );

    // done
    spinner.succeed(
      `Success! Copy ${blueBright(copyPaths.length)} items. Build ${blueBright(
        buildPaths.length
      )} items.\n`
    );
  }

  private buildSearchContent(
    htmlContent: string,
    data: Record<string, any> = {}
  ) {
    let content = '';
    if (data.tags) content += '\n' + data.tags.join(' ');
    if (data.keywords) content += '\n' + data.keywords.join(' ');
    if (data.title) content += '\n' + data.title;
    if (data.name) content += '\n' + data.name;
    if (data.description) content += '\n' + data.description;
    if (data.excerpt) content += '\n' + data.excerpt;
    content +=
      '\n' +
      htmlContent
        .replace(/<style([\s\S]*?)<\/style>/gi, '')
        .replace(/<script([\s\S]*?)<\/script>/gi, '')
        .replace(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g, '');
    const segmenter = new Intl.Segmenter(['en', 'vi', 'ja'], {
      granularity: 'word',
    });
    const words = Array.from(segmenter.segment(content))
      .map(segment => this.cleanupText(segment.segment))
      .filter(
        word =>
          word && !~'~`!@#$%^&*()+={}[];:\'"<>.,/\\?-_ \t\r\n'.indexOf(word)
      );
    return Array.from(new Set(words)).join(' ');
  }

  private cleanupText(text: string) {
    text = this.cleanupTextVI(text);
    return text;
  }

  private cleanupTextVI(text: string) {
    return text
      .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
      .replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A')
      .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
      .replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E')
      .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
      .replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I')
      .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
      .replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O')
      .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
      .replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U')
      .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
      .replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }
}
