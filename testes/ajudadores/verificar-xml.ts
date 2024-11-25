// import * as xmlParser from 'fast-xml-parser';
import { Parser } from 'xml2js';

export const verificarXml = async (xml: string): Promise<any> => {
    const parser = new Parser();
    return parser.parseStringPromise(xml);
}
