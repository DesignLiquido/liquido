import * as xmlParser from 'fast-xml-parser';

export const VerificaXml = (xml: string): boolean | xmlParser.ValidationError => {
    return xmlParser.XMLValidator.validate(xml);
}