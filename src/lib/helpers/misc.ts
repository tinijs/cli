export class HelperService {
  constructor() {}

  parseParams(param: string, exclude?: string, separator = ',') {
    return (!exclude ? param : param.replace(new RegExp(exclude, 'g'), ''))
      .split(separator)
      .map(item => item.trim())
      .filter(item => !!item);
  }
}
