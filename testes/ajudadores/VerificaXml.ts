import * as xmlParser from 'fast-xml-parser';

export const VerificaXml = (xml: string): boolean => {
    try {
        xmlParser.XMLValidator.validate(xml);
        return true;
    } catch (err) {
        return false;
    }
}